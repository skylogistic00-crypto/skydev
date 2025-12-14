import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

// WAJIB: pakai client utama
import { supabase } from "@/lib/supabase";

// WAJIB: tipe import
import type { UserProfile } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    entityType: string,
    phone?: string,
    details?: Record<string, any>,
    fileUrls?: Record<string, string>,
    roleName?: string,
    roleId?: number | null,
    roleEntity?: string,
    ktp_number?: string,
    ktp_address?: string,
    first_name?: string,
    last_name?: string,
    religion?: string,
    ethnicity?: string,
    license_number?: string,
    license_expiry_date?: string,
    education?: string,
    upload_ijasah?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Mark as initialized immediately so context is available
    setInitialized(true);
    
    const isEmailConfirmRoute =
      window.location.pathname.startsWith("/auth/confirm");

    if (isEmailConfirmRoute) {
      console.log("⛔ Skipping session checks on /auth/confirm route");

      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      setLoading(false);

      return; // ⛔ WAJIB SUPAYA getSession TIDAK DIJALANKAN
    }

    // NORMAL SESSION HANDLING
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // ⛔ CRITICAL: Jangan auto sign-in di halaman konfirmasi email
      const isEmailConfirmRoute =
        window.location.pathname.startsWith("/auth/confirm");

      if (isEmailConfirmRoute) {
        console.log("⛔ Blocking auto sign-in on /auth/confirm route");
        return; // ⛔ STOP auto sign-in
      }

      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Get current session to have email available
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Profile fetch error:", error);
        // Jangan clear user session saat fetch profile gagal
        // Biarkan user tetap login dengan data minimal
        setUserProfile({
          id: userId,
          email: session?.user?.email || "",
          role: "viewer",
          status: "active",
        } as any);
        setUserRole("viewer");
        setLoading(false);
        return;
      }

      setUserProfile(data);
      const role = data.role || "viewer";
      setUserRole(role);

      setLoading(false);
    } catch (error: any) {
      console.warn("Profile fetch exception:", error);
      // Get session for fallback email
      const {
        data: { session },
      } = await supabase.auth.getSession();
      // Jangan clear user session saat fetch profile gagal
      setUserProfile({
        id: userId,
        email: session?.user?.email || "",
        role_name: "user",
        status: "active",
      } as any);
      setUserRole("user");
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // 1. Cek status user
      const { data: userCheck, error: userError } = await supabase
        .from("users")
        .select("id, status")
        .eq("email", email)
        .maybeSingle();

      if (userError || !userCheck) {
        throw { type: "not_found", message: "Akun tidak ditemukan" };
      }

      // 2. Status = suspended
      if (userCheck.status === "suspended") {
        throw { type: "suspended", message: "Akun Anda ditangguhkan" };
      }

      // 3. Status = inactive
      if (userCheck.status === "inactive") {
        throw { type: "inactive", message: "Akun Anda tidak aktif" };
      }

      // 4. Status aktif → lanjut login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw { type: "auth", message: error.message };
      return data;
    } catch (err: any) {
      throw err; // -> dilempar ke Header untuk ditampilkan via modal
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    entityType: string,
    phone?: string,
    details?: Record<string, any>,
    fileUrls?: Record<string, string>,
    roleName?: string,
    roleId?: number | null,
    roleEntity?: string,
    ktp_number?: string,
    ktp_address?: string,
    first_name?: string,
    last_name?: string,
    religion?: string,
    ethnicity?: string,
    license_number?: string,
    license_expiry_date?: string,
    education?: string,
    upload_ijasah?: string,
  ) => {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-signup-multi-entity",
      {
        body: {
          email,
          password,
          full_name: fullName,
          entity_type: roleEntity || entityType,
          phone,
          details: details || {}, // <--- semua data employee masuk di sini
          file_urls: fileUrls || {},
          role_name: roleName,
          role_id: roleId,
          ktp_number, // <--- untuk tabel users
          ktp_address, // <--- untuk tabel users
          first_name,
          last_name,
          religion,
          ethnicity,
          license_number,
          license_expiry_date,
          education,
          upload_ijasah,
        },
      },
    );

    if (error) {
      console.error("Sign up edge function error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw new Error(error.message || "Failed to create account");
    }
    
    // Check if data contains error from edge function
    if (data && data.error) {
      console.error("Sign up error from edge function:", data.error);
      console.error("Error details from edge function:", data.details ? JSON.stringify(data.details, null, 2) : "No details");
      const detailsStr = data.details ? ` - Details: ${JSON.stringify(data.details)}` : "";
      throw new Error(data.error + detailsStr);
    }
    
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ user, userRole, userProfile, loading, signIn, signUp, signOut }}
    >
      {initialized ? children : (
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          <div className="text-lg">Initializing...</div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe default during initial render to prevent crashes
    console.warn("useAuth called outside AuthProvider - returning safe defaults");
    return {
      user: null,
      userProfile: null,
      userRole: null,
      loading: true,
      signIn: async () => { throw new Error("AuthProvider not initialized"); },
      signUp: async () => { throw new Error("AuthProvider not initialized"); },
      signOut: async () => { throw new Error("AuthProvider not initialized"); },
    } as AuthContextType;
  }
  return context;
}
