export interface MarketingDocument {
  id: string;
  created_at: string;
  file_name: string;
  file_url: string;
  content: string;
  topic: string;
  project: string;
  team: string;
}

export type NewDocument = Omit<MarketingDocument, "id" | "created_at">;
