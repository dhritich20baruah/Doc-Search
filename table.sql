-- Re-create the table with a robust FTS column definition
-- WARNING: This will delete all existing data in the table.
-- If you have data, only run the ALTER TABLE command below.

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp WITH time zone DEFAULT now(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  content text NOT NULL, 
  topic text,
  category text,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  tsv_content tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED
);

-- If the table already exists, just modify the column:
-- ALTER TABLE documents 
-- DROP COLUMN tsv_content;
-- ALTER TABLE documents 
-- ADD COLUMN tsv_content tsvector 
-- GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED; 

-- Don't forget the index!
CREATE INDEX IF NOT EXISTS documents_tsv_idx ON documents USING GIN (tsv_content);

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents (user_id);


-- 2. ENABLE ROW-LEVEL SECURITY (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Ensure that nobody can accidentally access data if policies fail (recommended)
ALTER TABLE documents FORCE ROW LEVEL SECURITY;


-- 3. CREATE POLICIES

-- Policy 1: SELECT (Read Access)
-- Allows a user to view documents ONLY IF the document's user_id matches their authenticated user ID (auth.uid()).
CREATE POLICY "Users can only view their own documents."
ON documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: INSERT (Write Access)
-- Allows an authenticated user to insert a new document, and automatically sets the user_id column
-- to the currently logged-in user's ID.
CREATE POLICY "Users can insert their own documents."
ON documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- Policy 3: UPDATE (Edit Access)
-- Allows a user to update a document ONLY IF the document's user_id matches their authenticated user ID.
CREATE POLICY "Users can update their own documents."
ON documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

