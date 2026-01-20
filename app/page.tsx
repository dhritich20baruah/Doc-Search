"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Auth } from "./component/Auth";
import Dashboard from "./Dashboard/page";
import { Search, Upload, LogOut } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<any>(null);

  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    setSession(currentSession.data);
  };

  useEffect(() => {
    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {session ? (
        <div className="w-full flex flex-col min-h-screen items-center justify-center bg-linear-to-r from-blue-500 to-pink-300 space-y-8 relative">
          <button
            className="bg-red-700 text-white p-2 mx-3 cursor-pointer text-md rounded-md hover:text-red-700 hover:bg-white absolute top-20 right-32"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
          <Dashboard />
        </div>
      ) : (
        <Auth />
      )}
    </>
  );
}
