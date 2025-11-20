import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

export function useAuthUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  const organizationId = "ORG_A1";

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Supabase getSession error:", error.message);
        } else if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          setUserId(initialSession.user.id);
        } else {
          // Fallback: If no session, generate a temporary local ID for non-RLS operations
          // In a real app, we'd force a redirect to a login page here.
          setUserId("UNAUTHENTICATED_" + crypto.randomUUID().substring(0, 8));
        }
      } catch (e) {
        console.error("Supabase initial session check failed:", e);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // 2. State Listener: Subscribe to future authentication changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Supabase Auth Event:", event);
      setSession(session);
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? "");

      if (event === "SIGNED_IN") {
        console.log("User signed in with ID:", session?.user.id);
      }
      if (event === "SIGNED_OUT") {
        console.log("User signed out.");
      }
    });

    // Cleanup the listener on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    userId,
    organizationId,
    isAuthenticated: !!user,
    isLoading, // True while waiting for the initial session check
  };
}
