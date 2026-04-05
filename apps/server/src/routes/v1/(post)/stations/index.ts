import { bands, locations, operators, stations, cells, gsmCells, umtsCells, lteCells, nrCells } from "@openbts/drizzle";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

import db from "../../../../database/psql.js";
import { ErrorResponse } from "../../../../errors.js";
import { createAuditLog } from "../../../../services/auditLog.service.js";
import { checkGSMDuplicate, checkLTEDuplicate, checkUMTSDuplicate } from "../../../../services/cellDuplicateCheck.service.js";
import { syncStationsPermitsAssociations } from "../../../../services/stationsPermitsAssociation.service.js";
import { logger } from "../../../../utils/logger.js";
import { makeDetailsRatRefine } from "../../../../utils/submission.helpers.js";

import type { FastifyRequest } from "fastify/types/request.js";
import type { ReplyPayload } from "../../../../interfaces/fastify.interface.js";
import type { JSONBody, Route } from "../../../../interfaces/routes.interface.js";

const stationsInsertSchema = createInsertSchema(stations);
const stationSchema = createSelectSchema(stations).omit({ status: true });
const cellsSchema = createSelectSchema(cells).omit({ band_id: true });
const bandsSchema = createSelectSchema(bands);
const gsmCellsSchema = createSelectSchema(gsmCells).omit({ cell_id: true });
const umtsCellsSchema = createSelectSchema(umtsCells).omit({ cell_id: true });
const lteCellsSchema = createSelectSchema(lteCells).omit({ cell_id: true });
const nrCellsSchema = createSelectSchema(nrCells).omit({ cell_id: true });
const cellDetailsSchema = z.union([gsmCellsSchema, umtsCellsSchema, lteCellsSchema, nrCellsSchema]).nullable();
const locationSchema = createSelectSchema(locations).omit({ point: true });
const operatorSchema = createSelectSchema(operators);
const baseCellsInsertSchema = createInsertSchema(cells).omit({ createdAt: true, updatedAt: true }).strict();
const gsmInsertSchema = createInsertSchema(gsmCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({ lac: z.number().int().min(0).max(65535), cid: z.number().int().min(0).max(65535) });
const umtsInsertSchema = createInsertSchema(umtsCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({
    lac: z.number().int().min(0).max(65535).nullable().optional(),
    rnc: z.number().int().min(0).max(65535),
    cid: z.number().int().min(0).max(65535),
    arfcn: z.number().int().min(0).max(16383).nullable().optional(),
  });
const lteInsertSchema = createInsertSchema(lteCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({
    tac: z.number().int().min(0).max(65535).nullable().optional(),
    enbid: z.number().int().min(0).max(1048575),
    clid: z.number().int().min(0).max(255),
    pci: z.number().int().min(0).max(503).nullable().optional(),
    earfcn: z.number().int().min(0).max(262143).nullable().optional(),
  });
const nrInsertSchema = createInsertSchema(nrCells)
  .omit({ cell_id: true, createdAt: true, updatedAt: true })
  .extend({
    nrtac: z.number().int().min(0).max(16777215).nullable().optional(),
    gnbid: z.number().int().min(0).max(4294967295).nullable().optional(),
    clid: z.number().int().min(0).max(16383).nullable().optional(),
    pci: z.number().int().min(0).max(1007).nullable().optional(),
    arfcn: z.number().int().min(0).max(3279165).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "nsa") {
      for (const field of ["nrtac", "clid", "gnbid", "arfcn"] as const) {
        if (data[field] !== null && data[field] !== undefined)
          ctx.addIssue({ code: "custom", message: `${field} must not be set for NSA NR cells`, path: [field] });
      }
      if (data.supports_nr_redcap === true) {
        ctx.addIssue({ code: "custom", message: "supports_nr_redcap must not be set for NSA NR cells", path: ["supports_nr_redcap"] });
      }
    }
  });
const cellWithDetailsInsert = baseCellsInsertSchema
  .extend({ details: z.unknown().optional() })
  .superRefine(makeDetailsRatRefine({ GSM: gsmInsertSchema, UMTS: umtsInsertSchema, LTE: lteInsertSchema, NR: nrInsertSchema }));

type ReqBody = {
  Body: z.infer<typeof stationsInsertSchema> & { cells: z.infer<typeof cellWithDetailsInsert>[] };
};
type CellResponse = z.infer<typeof cellsSchema> & { band: z.infer<typeof bandsSchema>; details: z.infer<typeof cellDetailsSchema> };
type ResponseData = z.infer<typeof stationSchema> & {
  cells: CellResponse[];
  location: z.infer<typeof locationSchema>;
  operator: z.infer<typeof operatorSchema>;
};
const schemaRoute = {
  body: stationsInsertSchema.extend({
    cells: z.array(cellWithDetailsInsert),
  }),
  response: {
    200: z.object({
      data: stationSchema.extend({
        cells: z.array(cellsSchema.extend({ band: bandsSchema, details: cellDetailsSchema })),
        location: locationSchema,
        operator: operatorSchema,
      }),
    }),
  },
};

async function handler(req: FastifyRequest<ReqBody>, res: ReplyPayload<JSONBody<ResponseData>>) {
  const { cells: cellsData, ...stationData } = req.body;

  if (stationData.operator_id && cellsData && cellsData.length > 0) {
    for (const cell of cellsData) {
      if (!cell.details) continue;
      if (cell.rat === "GSM") {
        const d = cell.details as z.infer<typeof gsmInsertSchema>;
        /* eslint-disable-next-line no-await-in-loop */
        await checkGSMDuplicate(d.lac, d.cid, stationData.operator_id);
      } else if (cell.rat === "UMTS") {
        const d = cell.details as z.infer<typeof umtsInsertSchema>;
        /* eslint-disable-next-line no-await-in-loop */
        await checkUMTSDuplicate(d.rnc, d.cid, stationData.operator_id);
      } else if (cell.rat === "LTE") {
        const d = cell.details as z.infer<typeof lteInsertSchema>;
        /* eslint-disable-next-line no-await-in-loop */
        await checkLTEDuplicate(d.enbid, d.clid, stationData.operator_id);
      }
    }
  }

  try {
    const station = await db.transaction(async (tx) => {
      const [newStation] = await tx
        .insert(stations)
        .values({
          ...stationData,
          status: "published",
          updatedAt: new Date(),
          createdAt: new Date(),
        })
        .returning();

      if (!newStation) {
        tx.rollback();
        throw new ErrorResponse("FAILED_TO_CREATE");
      }

      if (cellsData && cellsData?.length > 0) {
        const createdCells = await tx
          .insert(cells)
          .values(
            cellsData.map((cell) => ({
              ...cell,
              station_id: newStation.id,
              updatedAt: new Date(),
              createdAt: new Date(),
            })),
          )
          .returning();

        await Promise.all(
          createdCells.map(async (row, idx) => {
            const details = cellsData[idx]?.details;
            if (!details) return;
            switch (row.rat) {
              case "GSM":
                await tx.insert(gsmCells).values({ ...(details as z.infer<typeof gsmInsertSchema>), cell_id: row.id });
                break;
              case "UMTS":
                await tx.insert(umtsCells).values({ ...(details as z.infer<typeof umtsInsertSchema>), cell_id: row.id });
                break;
              case "LTE":
                await tx.insert(lteCells).values({ ...(details as z.infer<typeof lteInsertSchema>), cell_id: row.id });
                break;
              case "NR":
                await tx.insert(nrCells).values({ ...(details as z.infer<typeof nrInsertSchema>), cell_id: row.id });
                break;
            }
          }),
        );
      }

      const full = await tx.query.stations.findFirst({
        where: {
          id: newStation.id,
        },
        with: {
          cells: { with: { band: true, gsm: true, umts: true, lte: true, nr: true }, columns: { band_id: false } },
          location: { columns: { point: false } },
          operator: true,
        },
        columns: { status: false },
      });
      if (!full) {
        tx.rollback();
        throw new ErrorResponse("NOT_FOUND");
      }

      const cellsWithDetails = (
        full.cells as Array<
          z.infer<typeof cellsSchema> & {
            band: z.infer<typeof bandsSchema>;
            gsm?: z.infer<typeof gsmCellsSchema>;
            umts?: z.infer<typeof umtsCellsSchema>;
            lte?: z.infer<typeof lteCellsSchema>;
            nr?: z.infer<typeof nrCellsSchema>;
          }
        >
      ).map((cell) => {
        const { gsm, umts, lte, nr, band, ...rest } = cell;
        const details: z.infer<typeof cellDetailsSchema> = gsm ?? umts ?? lte ?? nr ?? null;
        return { ...rest, band, details } as CellResponse;
      });

      const response: ResponseData = { ...full, cells: cellsWithDetails } as ResponseData;
      return response;
    });

    void syncStationsPermitsAssociations().catch((e) =>
      logger.error("Failed to sync stations_permits after station creation", { error: e instanceof Error ? e.message : String(e) }),
    );

    await createAuditLog(
      {
        action: "stations.create",
        table_name: "stations",
        record_id: station.id,
        old_values: null,
        new_values: station,
      },
      req,
    );

    return res.send({ data: station });
  } catch (error) {
    if (error instanceof ErrorResponse) throw error;
    throw new ErrorResponse("FAILED_TO_CREATE");
  }
}

const createStation: Route<ReqBody, ResponseData> = {
  url: "/stations",
  method: "POST",
  config: { permissions: ["write:stations"] },
  schema: schemaRoute,
  handler,
};

export default createStation;
