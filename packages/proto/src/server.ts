import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import protobuf, { Root } from "protobufjs";

import { registerStructWrappers } from "./structWrapper.js";

registerStructWrappers(protobuf as unknown as Parameters<typeof registerStructWrappers>[0]);

const protoDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "proto");
const protoRoot = new Root();

const locationsProto = protoRoot.loadSync(join(protoDirectory, "locations.proto"), { keepCase: true });
export const LocationsResponseType = locationsProto.lookupType("openbts.locations.LocationsResponse");
export const LocationResponseType = locationsProto.lookupType("openbts.locations.LocationResponse");

const stationsProto = protoRoot.loadSync(join(protoDirectory, "stations.proto"), { keepCase: true });
export const StationsResponseType = stationsProto.lookupType("openbts.stations.StationsResponse");
export const StationResponseType = stationsProto.lookupType("openbts.stations.StationResponse");
export const CellsResponseType = stationsProto.lookupType("openbts.stations.CellsResponse");
export const CellResponseType = stationsProto.lookupType("openbts.stations.CellResponse");

const ukeProto = protoRoot.loadSync(join(protoDirectory, "uke.proto"), { keepCase: true });
export const ukePermitsResponseType = ukeProto.lookupType("openbts.uke.PermitsResponse");
export const ukePermitResponseType = ukeProto.lookupType("openbts.uke.PermitResponse");
export const ukeLocationsResponseType = ukeProto.lookupType("openbts.uke.LocationsResponse");
export const ukeRadiolinesResponseType = ukeProto.lookupType("openbts.uke.RadiolinesResponse");
export const ukeRadiolineResponseType = ukeProto.lookupType("openbts.uke.RadiolineResponse");
