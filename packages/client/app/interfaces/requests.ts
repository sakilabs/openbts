export interface userListRequest {
	list_id: number;
	list_uuid: string;
	stations: number[];
	name: string;
	created_by: number;
	created_at: Date;
}
