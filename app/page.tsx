"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";
import { MarketingDocument } from "@/types/document";
import UploadForm from "./component/UploadForm";
import DocumentSearch from "./component/DocumentSearch";
import { Search, Upload, FileUp, UploadCloud } from "lucide-react";
import { Auth } from "./component/Auth";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const [visible, setVisible] = useState(true);
  const [session, setSession] = useState<any>(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    setSession(currentSession.data.session);
  };

  useEffect(() => {
    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
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
        <button
          className="bg-red-700 text-white p-2 cursor-pointer text-md rounded-md hover:text-red-700 hover:bg-white"
          onClick={() => setVisible((visible) => !visible)}
        >
          {visible ? (
            <Upload className="w-5 h-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
