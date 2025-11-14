export interface MarketingDocument {
  id: number;
  title: string;
  file_type: string;
  link_to_file: string;
  team: string | null; 
  project: string | null;
  upload_date: string; 
  content: string; 
}

export type NewDocument = Omit<MarketingDocument, 'id' | 'upload_date'>;