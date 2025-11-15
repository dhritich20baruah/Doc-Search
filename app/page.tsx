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
    <div className="flex flex-col min-h-screen items-center justify-center bg-linear-to-r from-blue-500 to-pink-300 space-y-8 relative">
      {visible ? (
        <div className="shadow-2xl shadow-black">
          <DocumentSearch />
        </div>
      ) : (
        <div className="shadow-2xl shadow-black">
        <UploadForm />
          </div>
      )}
      <div className="absolute top-20 right-20">
           <button
            className="bg-red-700 text-white p-2 cursor-pointer text-3xl rounded-md hover:text-red-700 hover:bg-white"
            onClick={() => setVisible((visible) => !visible)}
          >
            {visible ? "+" : "X"}
          </button>
      </div>
    </div>
  );
}
