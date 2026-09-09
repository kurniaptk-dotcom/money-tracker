"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN") {
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setLoading, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    isLoading,
    signOut,
    isAuthenticated: !!user,
  };
}
