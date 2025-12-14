import React from "react";

export default function PendingRegistrasi() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <img
          src="/logo.jpg"
          alt="Sky Kargo Yaksa"
          className="w-28 mx-auto mb-4 opacity-90"
        />

        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Registrasi Berhasil 🎉
        </h2>

        <p className="text-gray-600 mb-1">
          Email Anda sudah <strong>berhasil diverifikasi</strong>.
        </p>
        <p className="text-gray-600 mb-3">
          Namun akun Anda <strong>belum aktif</strong>.
        </p>

        <p className="text-sm text-gray-500 leading-relaxed">
          Akun Anda sedang menunggu persetujuan admin. Anda akan menerima email
          pemberitahuan ketika akun telah aktif.
        </p>

        <div className="mt-6">
          <a
            href="https://acc.skykargo.co.id/"
            className="text-blue-600 hover:underline text-sm"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>

      <p className="text-gray-400 text-xs mt-6">
        © {new Date().getFullYear()} Sakti Kargo Yaksa – Freight & Finance
        Management
      </p>
    </div>
  );
}
