# Doc-Search
## Project Overview
  * Doc-Search is a application designed to automate the ingestion, text extraction, and categorization of unstructured documents (PDFs and images). It leverages technologies like Tesseract OCR for client-side text extraction and the Google Gemini API for server-side classification, indexing the results into a Supabase database for powerful search.

  * This project demonstrates a real-world use case of combining specialized libraries (OCR/PDF parsing) with large language models (LLMs) to transform raw data into structured, searchable insights.

  * This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Key Features

  * Universal File Upload: Supports uploading of both PDF and Image (PNG/JPG/JPEG) files.

  * Client-Side Text Extraction:

    * Uses a dedicated PDF parser (react-pdftotext) for PDFs.

    * Uses Tesseract.js to perform optical character recognition (OCR) on images.

  * Intelligent Categorization: The Gemini API analyzes the extracted text content and automatically assigns structured metadata: Topic, Project, and Team.

  * Categorization is strictly limited to predefined lists using the JSON schema enum constraint in the Gemini API call, ensuring consistent data quality.

  * Search: Users can perform Full-Text Search (FTS) against the document content.

  * Supabase Backend: Utilizes Supabase Storage for secure file storage and Supabase PostgreSQL for metadata indexing and FTS.

## Architecture and Flow
The application follows a three-stage intelligent pipeline:

  1. Client-Side Pre-processing (React/Tesseract):

  * The user selects a file.

  * The client determines the file type (PDF or Image).

  * Tesseract.js (for images) or react-pdftotext (for PDFs) extracts the raw text content.

  * The raw file (Base64) and the extracted text are bundled and sent to the Vercel API endpoint.

  2. Server-Side Intelligence & Storage (Vercel / Gemini):

  * The Vercel Serverless Function (/api/upload-simple) receives the payload.

  * LLM Categorization: The extracted text snippet is sent to the Gemini 2.5 Flash model with a System Instruction and a JSON Schema containing the required enum lists.

  * Gemini returns the categorized metadata (Topic, Project, Team).

  * Supabase Storage: The original file (Base64) is decoded and uploaded to the Supabase Storage bucket.

  3. Indexing & Search (Supabase PostgreSQL):

  * The categorized metadata (Title, URL, Topic, Project, Team) and the full extracted text are inserted into the Supabase database.

  * The search endpoint (/api/search) constructs a complex query that combines:

    * PostgreSQL Full-Text Search (FTS) on the content column.

    * Exact match filters (.eq()) on the topic, project, and team columns.

## Setup and Deployment
Prerequisites
  1. Google AI Studio API Key: For the categorization step (Gemini API).
  2. Supabase Account: For database and file storage.
  3. Vercel Account: For deployment (required for the Next.js API Routes).

Environment Variables
You must set the following environment variables in your Vercel project settings:
  1. GEMINI_API_KEY: Your Google AI API Key for categorization.
  2. NEXT_PUBLIC_SUPABASE_URL: The public URL of your Supabase project.
  3. SUPABASE_SERVICE_ROLE_KEY: The service_role secret key (do NOT use the anon key).

Database Schema (SQL)

The following SQL must be executed in your Supabase SQL Editor to create the marketing_documents table and a Full-Text Search index.

```
-- 1. Create the marketing_documents table
CREATE TABLE public.marketing_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- File Data
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    
    -- LLM Categorization (Enforced Taxonomy)
    topic TEXT NOT NULL,
    project TEXT NOT NULL,
    team TEXT NOT NULL,
    
    -- Extracted Content (for FTS)
    content TEXT NOT NULL
    -- column to store the tsvector data for indexing
    content_tsvector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
);

-- 2. Create a GIN index for faster search queries
CREATE INDEX content_search_idx ON public.marketing_documents USING GIN (content_tsvector);
```
Set up Storage Bucket: Create a new Storage Bucket named 'marketing-documents' in Supabase.

## To setup locally
  1. Clone the repository
  2. Run
     ```
     npm install
     ```
  3. Create a .env.local file in the root directory
  4. Create environment variables of supabase url, supabase key and gemini api key as NEXT_PUBLIC_SUPABASE_URL, SUPABASE_KEY and GEMINI_API_KEY respectively.
  5. Run
     ```
     npm run dev
     ```
  6. If the setup is successful the application will run at localhost:3000. 

## Key Technical Decisions

1. Client-Side OCR/Extraction

  * Decision: Run Tesseract.js (for images) and PDF parsing on the client.

  * Reasoning: Offloading heavy computation like OCR/PDF reading from the serverless function environment prevents timeouts and reduces serverless execution costs. The serverless function remains lean, focusing only on I/O (Supabase) and LLM API calls.

2. LLM Taxonomy Enforcement

  * Decision: The categorizeDocumentContent function in the API route uses the responseSchema with the enum property.

  * Reasoning: This is the most robust method for ensuring the LLM adheres to the predefined categories (VALID_TOPICS, etc.). Unlike relying solely on text instructions, the enum constraint provides a formal, machine-readable list of acceptable output values, guaranteeing consistency for the frontend filters.

3. Supabase for Combined Services

  * Decision: Use Supabase for both Storage (files) and PostgreSQL (metadata/FTS).

  * Reasoning: Simplifies deployment and infrastructure management. PostgreSQL's native Full-Text Search (FTS) capability is highly efficient for keyword searching against large blocks of text (content), and it integrates seamlessly with the exact-match filtering on the topic/team/project columns.




