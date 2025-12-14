import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ReversalAudit } from "@/types/audit";

export default function AuditReversalPage() {
  const [data, setData] = useState<ReversalAudit[]>([]);
  const [loading, setLoading] = useState(true);

  // default periode = bulan berjalan (YYYY-MM-01)
  const [period, setPeriod] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const start = period;
      const end = new Date(period);
      end.setMonth(end.getMonth() + 1);

      const { data, error } = await supabase
        .from("v_wms_reversal_audit")
        .select("*")
        .eq("reversed", true)
        .gte("transaction_date", start)
        .lt("transaction_date", end.toISOString())
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setData(data || []);
      }

      setLoading(false);
    };

    loadData();
  }, [period]);

  if (loading) return <div className="p-6">Loading...</div>;

  // ======================
  // KPI CALCULATION
  // ======================
  const totalReversal = data.length;
  const totalFatal = data.filter((d) => d.is_fatal).length;

  // ======================
  // CLOSING GUARD (UI)
  // ======================
  const canClosePeriod = totalFatal === 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">
          Audit Reversal Setelah Closing
        </h1>

        {/* ACTION: CLOSING PERIODE */}
        <button
          disabled={!canClosePeriod}
          onClick={() => {
            // nanti diganti call API closing
            alert("Periode siap di-closing");
          }}
          className={`px-4 py-2 rounded font-semibold ${
            canClosePeriod
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          title={
            canClosePeriod
              ? "Tutup periode inventory"
              : "Tidak bisa closing karena masih ada FATAL reversal"
          }
        >
          🔒 Closing Periode
        </button>
      </div>

      {/* WARNING BLOCK */}
      {!canClosePeriod && (
        <div className="mb-4 p-3 border border-red-400 bg-red-50 text-red-800 rounded">
          ❌ Periode <b>tidak dapat di-closing</b> karena masih terdapat{" "}
          <b>{totalFatal} FATAL reversal</b>.  
          <br />
          Selesaikan reversal & journal terlebih dahulu.
        </div>
      )}

      {/* FILTER PERIODE */}
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">
          Periode Closing:
        </label>

        <input
          type="month"
          value={period.substring(0, 7)}
          onChange={(e) => setPeriod(`${e.target.value}-01`)}
          className="border px-2 py-1 rounded"
        />

        <span className="text-sm text-gray-600">
          {data.length} data
        </span>
      </div>

      {/* ======================
          KPI SUMMARY
      ====================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* TOTAL REVERSAL */}
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-gray-500">
            Total Reversal
          </div>
          <div className="text-2xl font-bold">
            {totalReversal}
          </div>
        </div>

        {/* TOTAL FATAL */}
        <div
          className={`p-4 border rounded ${
            totalFatal > 0
              ? "bg-red-50 border-red-400"
              : "bg-green-50 border-green-400"
          }`}
        >
          <div
            className={`text-sm ${
              totalFatal > 0
                ? "text-red-700"
                : "text-green-700"
            }`}
          >
            Total FATAL
          </div>
          <div
            className={`text-2xl font-bold ${
              totalFatal > 0
                ? "text-red-700"
                : "text-green-700"
            }`}
          >
            {totalFatal}
          </div>
        </div>

        {/* STATUS PERIODE */}
        <div
          className={`p-4 border rounded flex items-center justify-center ${
            totalFatal > 0
              ? "bg-red-100 border-red-500 text-red-800"
              : "bg-green-100 border-green-500 text-green-800"
          }`}
        >
          <span className="text-lg font-semibold">
            {totalFatal > 0
              ? "❌ PERIODE BERMASALAH"
              : "✅ PERIODE AMAN"}
          </span>
        </div>
      </div>

      {/* ======================
          TABLE
      ====================== */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">WMS Ref</th>
            <th className="border px-2 py-1">SKU</th>
            <th className="border px-2 py-1 text-right">Qty</th>
            <th className="border px-2 py-1 text-right">Nilai</th>
            <th className="border px-2 py-1">Akun</th>
            <th className="border px-2 py-1 text-right">Debit</th>
            <th className="border px-2 py-1 text-right">Kredit</th>
            <th className="border px-2 py-1">Tanggal</th>
            <th className="border px-2 py-1">Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr
              key={row.wms_transaction_id}
              className={`border-t ${
                row.is_fatal
                  ? "bg-red-100 text-red-800 font-semibold"
                  : ""
              }`}
              title={
                row.is_fatal
                  ? "Reversal terjadi setelah periode closing (FATAL)"
                  : ""
              }
            >
              <td className="border px-2 py-1">
                {row.wms_reference}
              </td>
              <td className="border px-2 py-1">
                {row.sku}
              </td>
              <td className="border px-2 py-1 text-right">
                {row.qty}
              </td>
              <td className="border px-2 py-1 text-right">
                {row.movement_value}
              </td>
              <td className="border px-2 py-1">
                {row.account_code}
              </td>
              <td className="border px-2 py-1 text-right">
                {row.debit}
              </td>
              <td className="border px-2 py-1 text-right">
                {row.credit}
              </td>
              <td className="border px-2 py-1">
                {new Date(
                  row.transaction_date
                ).toLocaleDateString()}
              </td>
              <td className="border px-2 py-1 text-center">
                {row.is_fatal && (
                  <span className="px-2 py-1 text-xs bg-red-600 text-white rounded">
                    FATAL
                  </span>
                )}
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="text-center text-gray-500 py-6"
              >
                Tidak ada data reversal di periode ini
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
