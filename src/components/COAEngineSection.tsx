import { Settings, Building2, TrendingDown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function COAEngineSection() {
  const navigate = useNavigate();

  return (
    <div className="mt-12 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        COA Engine
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* COA Engine Card */}
        <div
          onClick={() => navigate("/coa-engine")}
          className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 hover:from-indigo-500/30 hover:to-indigo-600/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-indigo-500/30"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl mb-4 w-fit group-hover:scale-110 transition-transform"
            style={{
              boxShadow: "0 10px 30px rgba(99,102,241,0.5)",
            }}
          >
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">COA Engine</h3>
          <p className="text-indigo-200 text-sm mb-4">Kelola chart of accounts</p>
          <button className="text-indigo-300 font-semibold text-sm hover:text-indigo-100">
            Buka Menu →
          </button>
        </div>

        {/* Fixed Assets Card */}
        <div
          onClick={() => navigate("/fixed-assets")}
          className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 hover:from-teal-500/30 hover:to-teal-600/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-teal-500/30"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-xl mb-4 w-fit group-hover:scale-110 transition-transform"
            style={{
              boxShadow: "0 10px 30px rgba(20,184,166,0.5)",
            }}
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">Fixed Assets</h3>
          <p className="text-teal-200 text-sm mb-4">Kelola aset tetap perusahaan</p>
          <button className="text-teal-300 font-semibold text-sm hover:text-teal-100">
            Buka Menu →
          </button>
        </div>

        {/* Depreciation Card */}
        <div
          onClick={() => navigate("/depreciation")}
          className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-amber-500/30"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-xl mb-4 w-fit group-hover:scale-110 transition-transform"
            style={{
              boxShadow: "0 10px 30px rgba(251,191,36,0.5)",
            }}
          >
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">Depreciation</h3>
          <p className="text-amber-200 text-sm mb-4">Kelola penyusutan aset</p>
          <button className="text-amber-300 font-semibold text-sm hover:text-amber-100">
            Buka Menu →
          </button>
        </div>

        {/* Asset Disposal Card */}
        <div
          onClick={() => navigate("/asset-disposal")}
          className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 hover:from-rose-500/30 hover:to-rose-600/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group border border-rose-500/30"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="bg-gradient-to-br from-rose-500 to-rose-600 p-4 rounded-xl mb-4 w-fit group-hover:scale-110 transition-transform"
            style={{
              boxShadow: "0 10px 30px rgba(244,63,94,0.5)",
            }}
          >
            <Trash2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-lg text-white mb-2">Asset Disposal</h3>
          <p className="text-rose-200 text-sm mb-4">Kelola penghapusan aset</p>
          <button className="text-rose-300 font-semibold text-sm hover:text-rose-100">
            Buka Menu →
          </button>
        </div>
      </div>
    </div>
  );
}
