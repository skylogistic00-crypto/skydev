import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  BarChart3,
  TrendingUp,
  Package,
  FileText,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpRight,
  Plus,
  Receipt,
  BookOpen,
  FileSpreadsheet,
  Scale,
  PieChart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Navigation from "./Navigation";
import PurchaseRequestForm from "./PurchaseRequestForm";
import SupplierForm from "./SupplierForm";
import PermohonanDanaForm from "./PermohonanDanaForm";
import { Button } from "./ui/button";
import { canClick,canEdit } from "@/utils/roleAccess";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type ViewType =
  | "overview"
  | "requests"
  | "suppliers"
  | "users"
  | "inventory"
  | "create-request"
  | "create-supplier"
  | "permohonan-dana"
  | "create-permohonan";

export default function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>("overview");
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    totalSuppliers: 0,
    totalUsers: 0,
  });
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permohonanDana, setPermohonanDana] = useState<any[]>([]);
  const { userRole } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (retryCount = 0) => {
    try {
      const { data: requests, error: reqError } = await supabase
        .from("purchase_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (reqError) {
        if (reqError.message?.includes("Failed to fetch") && retryCount < 2) {
          console.log(`Retrying dashboard fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchDashboardData(retryCount + 1), 1000);
          return;
        }
        throw reqError;
      }

      const pendingCount =
        requests?.filter((r) => r.status === "PENDING").length || 0;

      const { data: suppliers, error: suppError } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (suppError) throw suppError;

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Fetch permohonan dana
      const { data: permohonan, error: permohonanError } = await supabase
        .from("permohonan_dana")
        .select("*")
        .order("created_at", { ascending: false });

      if (permohonanError) throw permohonanError;

      setPermohonanDana(permohonan || []);

      setStats({
        totalRequests: requests?.length || 0,
        pendingRequests: pendingCount,
        totalSuppliers: suppliers?.length || 0,
        totalUsers: users?.length || 0,
      });

      setAllRequests(requests || []);
      setAllSuppliers(suppliers || []);
      setAllUsers(users || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      // Only show error state after retries
      if (retryCount >= 2) {
        // Set empty data so UI doesn't break
        setStats({
          totalRequests: 0,
          pendingRequests: 0,
          totalSuppliers: 0,
          totalUsers: 0,
        });
      }
    } finally {
      if (retryCount >= 2) {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-orange-500";
      case "APPROVED":
        return "bg-teal-500";
      case "REJECTED":
        return "bg-red-500";
      case "COMPLETED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1e2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e2e]">
      <Header />
      <Navigation />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-slate-400">
                Welcome back, {userProfile?.full_name || "Admin"}
              </p>
            </div>
          </div>

          {currentView === "overview" ? (
            <>
              {/* 3D Cards Grid */}
              <div
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
                style={{ perspective: "2000px" }}
              >
                {/* Accounting Card */}
                <div
                  className="relative group"
                  style={{
                    transform: "rotateY(-8deg) rotateX(2deg)",
                    transformStyle: "flat",
                    transition: "all 0.5s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "rotateY(-5deg) rotateX(0deg) translateZ(20px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "rotateY(-8deg) rotateX(2deg)";
                  }}
                >
                  <div
                    className="bg-gradient-to-br from-[#2d3250] via-[#252842] to-[#1f2235] rounded-[32px] p-8 shadow-2xl"
                    style={{
                      boxShadow:
                        "30px 30px 80px rgba(0,0,0,0.5), -10px -10px 40px rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <h2
                      className="text-white text-3xl font-bold mb-8"
                      style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
                    >
                      Accounting
                    </h2>

                    {/* Top Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div
                        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 shadow-xl"
                        style={{
                          boxShadow: "0 10px 30px rgba(251,146,60,0.4)",
                          transform: "translateZ(20px)",
                        }}
                      >
                        <div className="text-white text-4xl font-bold mb-1">
                          {permohonanDana.length}
                        </div>
                        <div className="text-orange-100 text-sm font-medium">
                          Payment
                        </div>
                      </div>
                      <div
                        className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 shadow-xl"
                        style={{
                          boxShadow: "0 10px 30px rgba(20,184,166,0.4)",
                          transform: "translateZ(20px)",
                        }}
                      >
                        <div className="text-white text-4xl font-bold mb-1">
                          {
                            permohonanDana.filter((p) => p.status === "PENDING")
                              .length
                          }
                        </div>
                        <div className="text-teal-100 text-sm font-medium">
                          Number
                        </div>
                      </div>
                    </div>

                    {/* Chart Section */}
                    <div
                      className="bg-[#1a1d2e] rounded-2xl p-5 mb-6"
                      style={{
                        boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)",
                        transform: "translateZ(10px)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white text-2xl font-bold">
                          8.4K
                        </span>
                        <BarChart3 className="text-blue-400 w-7 h-7" />
                      </div>
                      <div className="flex gap-2 h-24 items-end">
                        {[60, 80, 70, 90, 75, 85].map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-blue-500 via-purple-500 to-pink-500 rounded-t-lg"
                            style={{
                              height: `${height}%`,
                              boxShadow: "0 -5px 20px rgba(139,92,246,0.4)",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Request List */}
                    <div
                      className="bg-white rounded-2xl p-5 relative overflow-visible"
                      style={{
                        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        transform: "translateZ(0)",
                        zIndex: 10,
                        minHeight: "auto",
                      }}
                    >
                      <h3 className="text-slate-800 font-bold text-lg mb-4">
                        Laporan Keuangan
                      </h3>
                      <div className="grid grid-cols-3 gap-3 relative overflow-visible" style={{ zIndex: 999, pointerEvents: 'auto', position: 'relative', transform: 'translateZ(0)' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/transaksi-keuangan");
                          }}
                          className="flex items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all cursor-pointer relative" style={{ zIndex: 999, pointerEvents: 'auto', position: 'relative' }}
                        >
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700">
                            Jurnal
                          </span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentView("general-ledger");
                          }}
                          className="flex items-center gap-2 p-3 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all cursor-pointer relative"
                          style={{ zIndex: 999, pointerEvents: 'auto', position: 'relative' }}
                        >
                          <FileSpreadsheet className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">
                            General Ledger
                          </span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentView("trial-balance");
                          }}
                          className="flex items-center gap-2 p-3 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all cursor-pointer relative"
                          style={{ zIndex: 999, pointerEvents: 'auto', position: 'relative' }}
                        >
                          <Scale className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-700">
                            Trial Balance
                          </span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentView("financial-report");
                          }}
                          className="flex items-center gap-2 p-3 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all cursor-pointer relative"
                          style={{ zIndex: 999, pointerEvents: 'auto', position: 'relative' }}
                        >
                          <PieChart className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-700">
                            Laporan Keuangan
                          </span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/tax-report");
                          }}
                          className="flex items-center gap-2 p-3 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all cursor-pointer relative"
                          style={{ zIndex: 999, pointerEvents: 'auto', position: 'relative' }}
                        >
                          <Receipt className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">
                            Laporan Pajak
                          </span>
                        </button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-200">
                      
                      <div className="pt-4 border-t border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentView("permohonan-dana");
                          }}
                          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 rounded-xl transition-all"
                        >
                          <span className="text-sm font-semibold text-teal-700">
                            Permohonan Dana
                          </span>
                          <span className="bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {permohonanDana.filter((p) => p.status === "PENDING").length}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WMS Card */}
                <div
                  onClick={() => {
                    if (canClick(userRole)) {
                      setCurrentView("inventory");
                    }
                  }}
                  className="relative cursor-pointer group"
                  style={{
                    transform: "rotateY(8deg) rotateX(2deg)",
                    transformStyle: "preserve-3d",
                    transition: "all 0.5s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "rotateY(5deg) rotateX(0deg) translateZ(20px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform =
                      "rotateY(8deg) rotateX(2deg)";
                  }}
                >
                  <div
                    className="bg-gradient-to-br from-[#2d3250] via-[#252842] to-[#1f2235] rounded-[32px] p-8 shadow-2xl"
                    style={{
                      boxShadow:
                        "-30px 30px 80px rgba(0,0,0,0.5), 10px -10px 40px rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <h2
                      className="text-white text-3xl font-bold mb-8"
                      style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
                    >
                      WMS
                    </h2>

                    {/* Chart Section */}
                    <div
                      className="bg-[#1a1d2e] rounded-2xl p-5 mb-6"
                      style={{
                        boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)",
                        transform: "translateZ(10px)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <TrendingUp className="text-teal-400 w-10 h-10 mb-2" />
                          <div className="text-teal-100 text-sm font-medium">
                            Inventory Movement
                          </div>
                        </div>
                        <span className="text-white text-3xl font-bold">
                          8.4K
                        </span>
                      </div>
                      <div className="flex gap-3 h-20 items-end mt-4">
                        {[50, 70, 60, 80, 65].map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-teal-500 via-blue-500 to-cyan-400 rounded-t-lg"
                            style={{
                              height: `${height}%`,
                              boxShadow: "0 -5px 20px rgba(20,184,166,0.4)",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Purchase Request List */}
                    <div
                      className="bg-white rounded-2xl p-5"
                      style={{
                        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        transform: "translateZ(15px)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-800 font-bold text-lg">
                          Purchase Request / Order
                        </h3>
                        <span className="text-orange-500 text-2xl font-bold">
                          8.4K
                        </span>
                      </div>
                      <div className="space-y-3">
                        {allRequests.slice(0, 4).map((req, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                          >
                            <div>
                              <div className="text-slate-700 font-semibold text-sm">
                                {req.pr_po_number || req.request_number}
                              </div>
                              <div className="text-slate-500 text-xs">
                                {req.item_name}
                              </div>
                            </div>
                            <span
                              className={`${getStatusColor(req.status)} text-white px-3 py-1 rounded-full text-xs font-medium shadow-md`}
                            >
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards - Below Laporan Keuangan */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div
                  onClick={() => {
                    if (canClick(userRole)) {
                      setCurrentView("suppliers");
                    }
                  }}
                  className="bg-gradient-to-br from-[#2d3250] to-[#1f2235] rounded-2xl p-6 shadow-xl hover:scale-105 transition-all cursor-pointer"
                  style={{
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Package className="text-green-400 w-10 h-10" />
                    <ArrowUpRight className="text-slate-400 w-6 h-6" />
                  </div>
                  <div className="text-white text-4xl font-bold mb-2">
                    {stats.totalSuppliers}
                  </div>
                  <div className="text-slate-400 text-sm font-medium">
                    Total Suppliers
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (canClick(userRole)) {
                      setCurrentView("users");
                    }
                  }}
                  className="bg-gradient-to-br from-[#2d3250] to-[#1f2235] rounded-2xl p-6 shadow-xl hover:scale-105 transition-all cursor-pointer"
                  style={{
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Users className="text-purple-400 w-10 h-10" />
                    <ArrowUpRight className="text-slate-400 w-6 h-6" />
                  </div>
                  <div className="text-white text-4xl font-bold mb-2">
                    {stats.totalUsers}
                  </div>
                  <div className="text-slate-400 text-sm font-medium">
                    Total Users
                  </div>
                </div>

                <div
                  className="bg-gradient-to-br from-[#2d3250] to-[#1f2235] rounded-2xl p-6 shadow-xl"
                  style={{
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="text-blue-400 w-10 h-10" />
                    <ArrowUpRight className="text-slate-400 w-6 h-6" />
                  </div>
                  <div className="text-white text-4xl font-bold mb-2">
                    Rp{" "}
                    {allRequests
                      .reduce(
                        (sum, req) =>
                          sum + (parseInt(req.unit_price) * req.qty || 0),
                        0,
                      )
                      .toLocaleString("id-ID")}
                  </div>
                  <div className="text-slate-400 text-sm font-medium">
                    Total Value
                  </div>
                </div>

                <div
                  onClick={() => {
                    if (canEdit(userRole)) {
                      navigate("/transaksi-keuangan");
                    }
                  }}
                  className="bg-gradient-to-br from-[#2d3250] to-[#1f2235] rounded-2xl p-6 shadow-xl hover:scale-105 transition-all cursor-pointer"
                  style={{
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Receipt className="text-cyan-400 w-10 h-10" />
                    <ArrowUpRight className="text-slate-400 w-6 h-6" />
                  </div>
                  <div className="text-white text-4xl font-bold mb-2">
                    Transaksi Keuangan
                  </div>
                  <div className="text-slate-400 text-sm font-medium">
                    Penerimaan & Pengeluaran Kas
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {currentView === "create-permohonan" ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Form Permohonan Dana
                </h2>
                <button
                  onClick={() => setCurrentView("permohonan-dana")}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Back to List
                </button>
              </div>
              <PermohonanDanaForm
                onSuccess={() => {
                  fetchDashboardData();
                  setCurrentView("permohonan-dana");
                }}
              />
            </div>
          ) : currentView === "permohonan-dana" ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Permohonan Dana
                </h2>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentView("create-permohonan")}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Permohonan Baru
                  </Button>
                  <button
                    onClick={() => setCurrentView("overview")}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Back to Overview
                  </button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Pemohon</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permohonanDana.map((req, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {req.nama_pemohon}
                      </TableCell>
                      <TableCell>{req.departemen}</TableCell>
                      <TableCell>
                        {new Date(req.tanggal_permohonan).toLocaleDateString(
                          "id-ID",
                        )}
                      </TableCell>
                      <TableCell>
                        Rp {parseFloat(req.jumlah).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{req.keterangan || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`${getStatusColor(req.status)} text-white px-3 py-1 rounded-full text-xs`}
                        >
                          {req.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : currentView === "general-ledger" ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  General Ledger
                </h2>
                <button
                  onClick={() => setCurrentView("overview")}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
              <GeneralLedgerView />
            </div>
          ) : currentView === "trial-balance" ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Trial Balance
                </h2>
                <button
                  onClick={() => setCurrentView("overview")}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
              <TrialBalanceView />
            </div>
          ) : currentView === "financial-report" ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Laporan Keuangan
                </h2>
                <button
                  onClick={() => setCurrentView("overview")}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate("/balance-sheet")}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-all"
                  >
                    <h3 className="font-semibold text-blue-900">Balance Sheet</h3>
                    <p className="text-sm text-blue-600">Neraca</p>
                  </button>
                  <button
                    onClick={() => navigate("/profit-loss")}
                    className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-all"
                  >
                    <h3 className="font-semibold text-green-900">Profit & Loss</h3>
                    <p className="text-sm text-green-600">Laba Rugi</p>
                  </button>
                  <button
                    onClick={() => navigate("/cash-flow")}
                    className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-all"
                  >
                    <h3 className="font-semibold text-purple-900">Cash Flow</h3>
                    <p className="text-sm text-purple-600">Arus Kas</p>
                  </button>
                </div>
              </div>
            </div>
          ) : currentView === "create-request" ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Create Purchase Request
                </h2>
                <button
                  onClick={() => setCurrentView("requests")}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Back to List
                </button>
              </div>
              <PurchaseRequestForm />
            </div>
          ) : currentView === "create-supplier" ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Create Supplier
                </h2>
                <button
                  onClick={() => setCurrentView("suppliers")}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Back to List
                </button>
              </div>
              <SupplierForm />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  {currentView === "requests" && "Purchase Requests"}
                  {currentView === "suppliers" && "Suppliers"}
                  {currentView === "users" && "Users"}
                  {currentView === "inventory" && "Inventory Movement"}
                </h2>
                <div className="flex gap-3">
                  {currentView === "requests" && (
                    <Button
                      onClick={() => setCurrentView("create-request")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Request
                    </Button>
                  )}
                  {currentView === "suppliers" && (
                    <Button
                      onClick={() => setCurrentView("create-supplier")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Supplier
                    </Button>
                  )}
                  <button
                    onClick={() => setCurrentView("overview")}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Back to Overview
                  </button>
                </div>
              </div>

              {currentView === "requests" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Number</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRequests.map((req, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {req.request_number}
                        </TableCell>
                        <TableCell>{req.requester_name}</TableCell>
                        <TableCell>{req.item_name}</TableCell>
                        <TableCell>{req.supplier_name}</TableCell>
                        <TableCell>{req.qty}</TableCell>
                        <TableCell>
                          Rp {parseInt(req.unit_price).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`${getStatusColor(req.status)} text-white px-3 py-1 rounded-full text-xs`}
                          >
                            {req.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(req.created_at).toLocaleDateString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {currentView === "suppliers" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>PKP Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSuppliers.map((supplier, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {supplier.supplier_name}
                        </TableCell>
                        <TableCell>{supplier.contact_person}</TableCell>
                        <TableCell>{supplier.phone_number}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.address}</TableCell>
                        <TableCell>
                          <span
                            className={`${supplier.is_pkp ? "bg-green-500" : "bg-gray-500"} text-white px-3 py-1 rounded-full text-xs`}
                          >
                            {supplier.is_pkp ? "PKP" : "Non-PKP"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {currentView === "users" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {user.full_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString(
                            "id-ID",
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {currentView === "inventory" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Movement Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>From/To</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRequests.map((req, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {req.item_name}
                        </TableCell>
                        <TableCell>Purchase</TableCell>
                        <TableCell>{req.qty}</TableCell>
                        <TableCell>{req.supplier_name}</TableCell>
                        <TableCell>
                          {new Date(req.created_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`${getStatusColor(req.status)} text-white px-3 py-1 rounded-full text-xs`}
                          >
                            {req.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}