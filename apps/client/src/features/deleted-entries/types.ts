export interface DeletedEntry {
  id: number;
  source_table: string;
  source_id: number;
  source_type: string;
  data: Record<string, unknown>;
  deleted_at: string;
  import_id: number | null;
}
