"use client";
import React, { useState } from "react";
import { Loader2, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import pdfToText from "react-pdftotext";
import Tesseract from "tesseract.js";
import { supabase } from "@/lib/supabase-client";

interface insertError {
  message: string,
  status?: number
}

const isImageFile = (file: File) => {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")
  );
};

const isPdfFile = (file: File) => {
  return file.name.toLowerCase().endsWith(".pdf");
};

async function runTesseractOcr(file: File): Promise<string> {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(
      file,
      "eng", // Language: English
      {
        logger: (m) => console.log(m.status, m.progress), // Show OCR progress
      },
    );
    return text.trim();
  } catch (e) {
    console.error("Tesseract OCR Failed:", e);
    return "OCR_FAILED_ERROR: Could not extract text from image.";
  }
}

export async function extractTextFromPdf(file: File) {
  let fullText = await pdfToText(file);
  return fullText.trim();
}

const UploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info",
  );
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);

    // Suggest title based on file name if no title has been typed
    if (selectedFile && !title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // remove extension
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageType("info");

    if (!file || !title.trim() || !category.trim()) {
      setMessageType("error");
      setMessage(
        "Please select a file, provide a title and category for indexing.",
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      const user_email = session?.user.email;

      if (!userId) {
        throw new Error("You must be logged in to upload files.");
      }

      setMessage("Extracting text content.....");
      let extractedTextContent = "";

      if (isImageFile(file)) {
        extractedTextContent = await runTesseractOcr(file);
      } else if (isPdfFile(file)) {
        extractedTextContent = await extractTextFromPdf(file);
      } else {
        throw new Error("Unsupported file type.");
      }

      if (!extractedTextContent || extractedTextContent.includes("_ERROR")) {
        throw new Error("Failed to extracted content from the file.");
      }

      setMessage("Uploading file to storage...");
      const fileExt = file.name.split(".").pop();
      const storagePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(storagePath);

      setMessage("Indexing metadata....");

      const { data: insertData, error: insertError } = await supabase
        .from("documents")
        .insert([
          {
            file_name: title,
            file_url: publicUrl,
            category: category,
            user_id: userId,
            user_email: user_email
          },
        ])
        .select()
        .single();

      if(insertError) throw insertError

      setMessageType("success");
      setMessage(
        `Success! Document uploaded and indexed.`,
      );
      setFile(null);
      setTitle("");
      setCategory("");

      //Granular Segments logic
      const paragraphs = extractedTextContent.split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p.length>5);

      const segments = paragraphs.map((para, index) => ({
        doc_id: insertData.id,
        content: para.trim(),
        page_number: 1,
        paragraph_number: index + 1,
        user_email: user_email
      }));

      const { error: segmentError } = await supabase.from("document_segments").insert(segments).single()

      // Reset file input manually
      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Process Failed:", error);
      setMessageType("error");
      setMessage(error.message || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-xl shadow-2xl bg-white max-w-xl mx-auto font-sans">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <FileUp className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Document Portal</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Document Title
          </label>
          <input
            type="text"
            placeholder="e.g., Q4 Marketing Strategy"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>

        {/* Topic */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            placeholder="e.g., Finance"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
          />
        </div>

        {/* File Input */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Select File (PDF/JPEG/JPG/PNG)
          </label>
          <input
            type="file"
            accept=".pdf,.png,.jpeg,.jpg"
            onChange={handleFileChange}
            required
            className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
          />
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <span className="text-sm font-medium text-blue-600">
              {file ? file.name : "Click to select or drag and drop"}
            </span>
            <span className="text-xs text-gray-400">
              PDF, PNG, JPG (Max 10MB)
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center bg-blue-600 text-white p-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-150 disabled:bg-gray-400"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Upload & Index Document"
          )}
        </button>
      </form>
      {message && (
        <div
          className={`mt-6 p-4 rounded-xl flex items-center space-x-3 text-sm animate-in fade-in slide-in-from-top-2 ${
            messageType === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : messageType === "error"
                ? "bg-red-50 text-red-700 border border-red-100"
                : "bg-blue-50 text-blue-700 border border-blue-100"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : messageType === "error" ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          )}
          <span className="font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
