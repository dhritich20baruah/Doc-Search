"use client";
import React, { useState } from "react";
import axios from "axios";
import { Loader2, Zap } from "lucide-react";
import pdfToText from "react-pdftotext";
import Tesseract from "tesseract.js";
import { useSession } from "../context/SessionContext";

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
      }
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
  const { session, setSession } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
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
    if (!file || !title.trim()) {
      setMessage(
        "Please select a file, provide a title, and paste content for indexing."
      );
      return;
    }

    if (!isPdfFile(file) && !isImageFile(file)) {
      setMessage("Error: Only PDF, PNG, JPG, or JPEG files are supported.");
      return;
    }

    setLoading(true);
    setMessage("Converting file, uploading, and indexing...");

    let extractedContent = "";

    if (isImageFile(file)) {
      setMessage("Extracting content from image using Tesseract OCR...");
      extractedContent = await runTesseractOcr(file); // 🛑 AWAIT the result
    } else if (isPdfFile(file)) {
      setMessage("Extracting content from PDF using react-pdftotext...");
      extractedContent = await extractTextFromPdf(file); // 🛑 AWAIT the result
    }

    if (extractedContent.includes("ERROR") || extractedContent === "") {
      setMessage(
        `Extraction failed: Extracted content was empty or contained an error.`
      );
      setLoading(false);
      return;
    }

    setMessage('Extraction complete. Preparing for upload and categorization...');

    // 1. Convert File to Base64 String
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Data = reader.result?.toString().split(",")[1]; // Get only the base64 part

      if (!base64Data) {
        setMessage("Error reading file data.");
        setLoading(false);
        return;
      }

      try {
        // 2. Send JSON payload to the simplified Route Handler
        const payload = {
          fileName: file.name,
          base64Content: base64Data,
          content: extractedContent, // The text for FTS indexing
          title: title,
          category: "category",
          topic: "topic",
          userId: session.user.id
        };

        const response = await axios.post("/api/upload-index", payload);

        setMessage(
          `Success! Indexed file: ${response.data.document.file_name}`
        );
        setFile(null);
        //setContentToIndex("");
        setTitle("");
      } catch (error) {
        setMessage("Indexing failed. Check console for details.");
        console.error("Upload Failed:", error);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage("Error reading file.");
      setLoading(false);
    };
  };

  return (
    <div className="p-6 rounded-xl shadow-2xl bg-white max-w-xl mx-auto font-sans">
      <h3 className="text-2xl font-extrabold mb-4 text-gray-800">
        Document Uploading and Indexing
      </h3>

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
        <p
          className={`mt-4 text-sm text-center font-medium ${
            message.startsWith("Success") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default UploadForm;
