"use client";
import Image from "next/image";
import { useState } from "react";
import axios from "axios";
import { MarketingDocument } from "@/types/document";
import UploadForm from "./component/UploadForm";
import DocumentSearch from "./component/DocumentSearch";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<MarketingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-gray-600 space-y-8">
      <DocumentSearch/>
      <button
        className="bg-amber-700 text-white p-3 cursor-pointer"
        onClick={() => setVisible(visible => !visible)}
      >
        Upload
      </button>
      {visible && <UploadForm />}
    </div>
  );
}
