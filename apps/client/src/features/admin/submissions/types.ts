import type { RAT_ORDER } from "../cells/rat";

export type SubmissionUser = {
  id: string;
  name: string;
  image: string | null;
  displayUsername: string;
};

export type ProposedCell = {
  id: number;
  submission_id: string;
  operation: "add" | "update" | "delete";
  target_cell_id: number | null;
  station_id: number | null;
  band_id: number | null;
  rat: typeof RAT_ORDER[number];
  notes: string | null;
  is_confirmed: boolean;
  details: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProposedStation = {
  id: number;
  submission_id: string;
  station_id: string | null;
  operator_id: number | null;
  location_id: number | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProposedLocation = {
  id: number;
  submission_id: string;
  region_id: number;
  city: string | null;
  address: string | null;
  longitude: number;
  latitude: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SubmissionRow = {
  id: string;
  station_id: number | null;
  submitter_id: string;
  status: "pending" | "approved" | "rejected";
  type: "new" | "update" | "delete";
  review_notes: string | null;
  reviewer_id: string | null;
  createdAt: string;
  updatedAt: string;
  reviewed_at: string | null;
  station?: { station_id: string } | null;
  proposedStation?: ProposedStation | null;
};

export type SubmissionDetail = {
  id: string;
  station_id: number | null;
  submitter_id: string;
  status: "pending" | "approved" | "rejected";
  type: "new" | "update" | "delete";
  reviewer_id: string | null;
  review_notes: string | null;
  submitter_note: string | null;
  createdAt: string;
  updatedAt: string;
  reviewed_at: string | null;
  station: { id: number; station_id: string; operator_id: number; notes: string | null; is_confirmed: boolean } | null;
  submitter: SubmissionUser;
  reviewer: SubmissionUser | null;
  proposedStation: ProposedStation | null;
  proposedLocation: ProposedLocation | null;
  cells: ProposedCell[];
};

export type SubmissionListItem = {
  id: string;
  station_id: number | null;
  submitter_id: string;
  status: "pending" | "approved" | "rejected";
  type: "new" | "update" | "delete";
  reviewer_id: string | null;
  review_notes: string | null;
  submitter_note: string | null;
  createdAt: string;
  updatedAt: string;
  reviewed_at: string | null;
  station: { id: number; station_id: string } | null;
  submitter: SubmissionUser;
  reviewer: SubmissionUser | null;
  proposedStation: ProposedStation | null;
  cells: ProposedCellWithDetails[];
};

export type ProposedCellWithDetails = {
  id: number;
  submission_id: string;
  operation: "add" | "update" | "delete";
  target_cell_id: number | null;
  station_id: number | null;
  band_id: number | null;
  rat: string | null;
  notes: string | null;
  is_confirmed: boolean;
  details: Record<string, unknown> | null;
};
