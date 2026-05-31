// Auth context and provider for managing user authentication state
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "analyst" | "alert_source";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; role?: AppRole | null }>;
  signUp: (email: string, password: string, displayName?: string, selectedRole?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Role fetch timeout")), 5000)
      );
      
      const fetchPromise = supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<typeof fetchPromise>;

      if (!error && data) {
        const userRole = data.role as AppRole;
        setRole(userRole);
        return userRole;
      } else {
        console.error("Failed to fetch role:", error);
        // Default to analyst if no role found (prevents infinite loading)
        setRole("analyst");
        return "analyst";
      }
    } catch (err) {
      console.error("Error fetching role:", err);
      // Default to analyst on error to prevent infinite loading
      setRole("analyst");
      return "analyst";
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch role immediately (not deferred)
          await fetchUserRole(session.user.id);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error: error as Error, role: null };
    }

    // Immediately fetch role after successful sign in
    let userRole: AppRole | null = null;
    if (data.user) {
      userRole = await fetchUserRole(data.user.id);
    }

    return { error: null, role: userRole };
  };

  const signUp = async (email: string, password: string, displayName?: string, selectedRole?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    // Only allow 'analyst' or 'alert_source' roles from signup - never 'admin'
    const roleToAssign = selectedRole === "alert_source" ? "alert_source" : "analyst";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split("@")[0],
          role: roleToAssign, // This is passed to the handle_new_user trigger
        },
      },
    });

    if (error) {
      return { error: error as Error };
    }

    return { error: null };
  };

  const signOut = async () => {
    try {
      setRole(null);
      setUser(null);
      setSession(null);
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
