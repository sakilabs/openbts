export type CommentAttachment = { uuid: string; type: string };

export type AdminComment = {
  id: string;
  station_id: number;
  user_id: string;
  content: string;
  attachments: CommentAttachment[] | null;
  status: "pending" | "approved";
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string | null;
    name: string;
    image: string | null;
  } | null;
  station: {
    id: number;
    station_id: string;
    operator: {
      id: number;
      name: string;
      full_name: string;
      parent_id: number | null;
      mnc: number | null;
    } | null;
  } | null;
};
