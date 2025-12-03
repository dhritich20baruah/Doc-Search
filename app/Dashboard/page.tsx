"use client";
import React, { useEffect, useState } from "react";
import { MarketingDocument } from "@/types/document";
import UploadForm from "../component/UploadForm";
import DocumentSearch from "../component/DocumentSearch";
import { Search, Upload, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

const Dashboard = () => {
  const [visible, setVisible] = useState(true);
  const router = useRouter()

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/")
  };

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
        <div className="flex">
          <button
            className="bg-green-700 text-white p-2 cursor-pointer text-md rounded-md hover:text-red-700 hover:bg-white"
            onClick={() => setVisible((visible) => !visible)}
          >
            {visible ? (
              <Upload className="w-5 h-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>
          <button className="bg-red-700 text-white p-2 mx-3 cursor-pointer text-md rounded-md hover:text-red-700 hover:bg-white" onClick={logout}><LogOut className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
