import { useEffect, useState } from "react";

export default function EmailConfirm() {
  const [message, setMessage] = useState("Memverifikasi email...");

  useEffect(() => {
    console.log("EmailConfirm loaded — preventing auto login");

    // ⛔ CRITICAL: Hapus SEMUA session Supabase
    // Supabase menyimpan token dengan format: sb-{project-ref}-auth-token
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.includes("supabase")) {
        localStorage.removeItem(key);
        console.log("🗑️ Removed:", key);
      }
    });

    sessionStorage.clear();

    // Pastikan hash dihapus agar Supabase tidak ambil token
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    setMessage("Email berhasil dikonfirmasi. Mengarahkan ke halaman pending...");

    const timer = setTimeout(() => {
      window.location.href = "/pending-registrasi";
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>{message}</h1>
    </div>
  );
}
