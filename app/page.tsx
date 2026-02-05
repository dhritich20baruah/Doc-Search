"use client"
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import {LogOut, Zap} from 'lucide-react';
import Dashboard from "./component/Dashboard";
import { Auth } from "./component/Auth";

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
        <div className="w-full min-h-screen bg-linear-to-r from-blue-800 to-pink-300 space-y-5 relative">
          <nav className="flex justify-between p-5">
            <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">DocuIntel</span>
            </div>
            <button
            className="bg-red-700 text-white p-2 mx-3 cursor-pointer text-md rounded-md hover:text-red-700 hover:bg-white"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
          </nav>
          <Dashboard />
        </div>
      ) : (
        <Auth />
      )}
    </>
  );
}
