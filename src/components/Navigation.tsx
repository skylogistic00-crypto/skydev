import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Users,
  ShoppingCart,
  Package,
  Warehouse,
  Building2,
  Layers,
  Plane,
  LayoutDashboard,
  FileText,
  DollarSign,
  ArrowUpFromLine,
  ClipboardList,
  Wallet,
  Truck,
  Receipt,
  Upload,
  Briefcase,
  ScanText,
  MessageCircle,
} from "lucide-react";

export default function Navigation() {
  const { userProfile } = useAuth();
  const location = useLocation();

  const role = userProfile?.role || "guest";

  console.log("Current user role:", role);
  console.log("User profile:", userProfile);

  // 🚀 Definisikan semua menu dan role yang boleh mengakses
  const navItems = [
    // Home / Menu Utama
    {
      path: "/",
      label: "Menu Utama",
      icon: Home,
      color: "indigo",
      roles: [
        "super_admin",
        "accounting_manager",
        "accounting_staff",
        "warehouse_manager",
        "warehouse_staff",
        "read_only",
        "viewer",
        "admin",
        "hr_manager",
        "hr_staff",
      ],
    },
    // Dashboard & Overview
    {
      path: "/dashboard-keuangan",
      label: "Dashboard Keuangan",
      icon: LayoutDashboard,
      color: "purple",
      roles: [
        "super_admin",
        "accounting_manager",
        "accounting_staff",
        "read_only",
        "viewer",
        "admin",
      ],
    },

    // Master Data
    {
      path: "/users",
      label: "User Management",
      icon: Users,
      color: "blue",
      roles: ["super_admin"],
    },
    {
      path: "/check-ocr-data",
      label: "Check OCR Data",
      icon: Users,
      color: "purple",
      roles: ["super_admin"],
    },
    {
      path: "/hrd-dashboard",
      label: "HRD Management",
      icon: Briefcase,
      color: "blue",
      roles: ["super_admin", "hr_manager", "hr_staff"],
    },
    {
      path: "/pos",
      label: "POS Kasir",
      icon: ShoppingCart,
      color: "emerald",
      roles: [
        "super_admin",
        "admin",
        "cashier",
        "staff",
        "accounting_manager",
        "accounting_staff",
      ],
    },
    {
      path: "/warehouse-dashboard",
      label: "Dashboard Gudang",
      icon: Package,
      color: "indigo",
      roles: ["super_admin", "admin", "warehouse_manager", "warehouse_staff"],
    },
    {
      path: "/pos-dashboard",
      label: "Dashboard POS",
      icon: ShoppingCart,
      color: "teal",
      roles: ["super_admin", "admin", "cashier", "staff"],
    },
    {
      path: "/partners",
      label: "Partners",
      icon: Users,
      color: "green",
      roles: [
        "super_admin",
        "accounting_staff",
        "warehouse_manager",
        "accounting_manager",
        "read_only",
      ],
    },
    {
      path: "/service-items",
      label: "Service Items",
      icon: Briefcase,
      color: "indigo",
      roles: [
        "super_admin",
        "accounting_manager",
        "accounting_staff",
        "read_only",
      ],
    },

    // Warehouse & Inventory
    {
      path: "/warehouses",
      label: "Warehouses",
      icon: Building2,
      color: "amber",
      roles: [
        "super_admin",
        "warehouse_manager",
        "warehouse_staff",
        "read_only",
      ],
    },
    {
      path: "/stock",
      label: "Stock",
      icon: Warehouse,
      color: "emerald",
      roles: [
        "super_admin",
        "accounting_manager",
        "accounting_staff",
        "warehouse_manager",
        "warehouse_staff",
        "read_only",
      ],
    },
    {
      path: "/barang-management",
      label: "Barang Management",
      icon: Layers,
      color: "lime",
      roles: [
        "super_admin",
        "warehouse_manager",
        "warehouse_staff",
        "accounting_manager",
        "accounting_staff",
        "read_only",
        "customs_specialist",
      ],
    },

    // Finance & Accounting
    {
      path: "/transaksi-keuangan",
      label: "Transaksi Keuangan",
      icon: DollarSign,
      color: "violet",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      path: "/mutasi-bank",
      label: "Mutasi Bank",
      icon: DollarSign,
      color: "cyan",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      path: "/employee-advance",
      label: "Uang Muka Karyawan",
      icon: DollarSign,
      color: "blue",
      roles: [
        "super_admin",
        "admin",
        "finance",
        "accounting_manager",
        "accounting_staff",
      ],
    },
    {
      path: "/cash-disbursement",
      label: "Pengeluaran Kas",
      icon: DollarSign,
      color: "red",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      path: "/approval-transaksi",
      label: "Approval Transaksi",
      icon: DollarSign,
      color: "green",
      roles: ["super_admin", "accounting_manager"],
    },
    {
      path: "/coa-management",
      label: "Chart of Accounts",
      icon: FileText,
      color: "fuchsia",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      path: "/coa-mapping",
      label: "COA Mapping",
      icon: FileText,
      color: "blue",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },

    // Tax & Reports
    {
      path: "/tax-reports",
      label: "Laporan Pajak",
      icon: Receipt,
      color: "red",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      path: "/coretax-upload",
      label: "Upload Coretax",
      icon: Upload,
      color: "yellow",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      path: "/coretax-report",
      label: "Daftar Upload Coretax",
      icon: FileText,
      color: "orange",
      roles: ["super_admin", "accounting_manager", "accounting_staff"],
    },
    {
      path: "/report-barang-lama",
      label: "Report Barang Lama",
      icon: FileText,
      color: "slate",
      roles: ["super_admin", "accounting_staff", "accounting_manager"],
    },
    {
      path: "/chat-ai",
      label: "Chat AI",
      icon: MessageCircle,
      color: "purple",
      roles: [
        "super_admin",
        "admin",
        "accounting_manager",
        "accounting_staff",
        "warehouse_manager",
        "warehouse_staff",
        "hrd_manager",
        "hrd_staff",
        "member",
      ],
    },
  ];

  // 🧩 Filter menu berdasarkan role user
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  // 💡 Tetap bagi jadi dua baris agar layout rapi
  const firstRow = filteredNavItems.slice(0, 8);
  const secondRow = filteredNavItems.slice(8);

  const renderNavItems = (items: typeof navItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      // Color variants for each button
      const colorVariants: Record<
        string,
        {
          from: string;
          to: string;
          border: string;
          borderDark: string;
          shadow: string;
        }
      > = {
        purple: {
          from: "from-purple-500",
          to: "to-purple-600",
          border: "border-purple-400",
          borderDark: "border-purple-700",
          shadow:
            "shadow-[0_4px_12px_rgba(168,85,247,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        blue: {
          from: "from-blue-500",
          to: "to-blue-600",
          border: "border-blue-400",
          borderDark: "border-blue-700",
          shadow:
            "shadow-[0_4px_12px_rgba(59,130,246,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        green: {
          from: "from-green-500",
          to: "to-green-600",
          border: "border-green-400",
          borderDark: "border-green-700",
          shadow:
            "shadow-[0_4px_12px_rgba(34,197,94,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        cyan: {
          from: "from-cyan-500",
          to: "to-cyan-600",
          border: "border-cyan-400",
          borderDark: "border-cyan-700",
          shadow:
            "shadow-[0_4px_12px_rgba(6,182,212,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        orange: {
          from: "from-orange-500",
          to: "to-orange-600",
          border: "border-orange-400",
          borderDark: "border-orange-700",
          shadow:
            "shadow-[0_4px_12px_rgba(249,115,22,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        teal: {
          from: "from-teal-500",
          to: "to-teal-600",
          border: "border-teal-400",
          borderDark: "border-teal-700",
          shadow:
            "shadow-[0_4px_12px_rgba(20,184,166,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        indigo: {
          from: "from-indigo-500",
          to: "to-indigo-600",
          border: "border-indigo-400",
          borderDark: "border-indigo-700",
          shadow:
            "shadow-[0_4px_12px_rgba(99,102,241,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        amber: {
          from: "from-amber-500",
          to: "to-amber-600",
          border: "border-amber-400",
          borderDark: "border-amber-700",
          shadow:
            "shadow-[0_4px_12px_rgba(245,158,11,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        emerald: {
          from: "from-emerald-500",
          to: "to-emerald-600",
          border: "border-emerald-400",
          borderDark: "border-emerald-700",
          shadow:
            "shadow-[0_4px_12px_rgba(16,185,129,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        lime: {
          from: "from-lime-500",
          to: "to-lime-600",
          border: "border-lime-400",
          borderDark: "border-lime-700",
          shadow:
            "shadow-[0_4px_12px_rgba(132,204,22,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        rose: {
          from: "from-rose-500",
          to: "to-rose-600",
          border: "border-rose-400",
          borderDark: "border-rose-700",
          shadow:
            "shadow-[0_4px_12px_rgba(244,63,94,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        pink: {
          from: "from-pink-500",
          to: "to-pink-600",
          border: "border-pink-400",
          borderDark: "border-pink-700",
          shadow:
            "shadow-[0_4px_12px_rgba(236,72,153,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        sky: {
          from: "from-sky-500",
          to: "to-sky-600",
          border: "border-sky-400",
          borderDark: "border-sky-700",
          shadow:
            "shadow-[0_4px_12px_rgba(14,165,233,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        violet: {
          from: "from-violet-500",
          to: "to-violet-600",
          border: "border-violet-400",
          borderDark: "border-violet-700",
          shadow:
            "shadow-[0_4px_12px_rgba(139,92,246,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        fuchsia: {
          from: "from-fuchsia-500",
          to: "to-fuchsia-600",
          border: "border-fuchsia-400",
          borderDark: "border-fuchsia-700",
          shadow:
            "shadow-[0_4px_12px_rgba(217,70,239,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        red: {
          from: "from-red-500",
          to: "to-red-600",
          border: "border-red-400",
          borderDark: "border-red-700",
          shadow:
            "shadow-[0_4px_12px_rgba(239,68,68,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        yellow: {
          from: "from-yellow-500",
          to: "to-yellow-600",
          border: "border-yellow-400",
          borderDark: "border-yellow-700",
          shadow:
            "shadow-[0_4px_12px_rgba(234,179,8,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
        slate: {
          from: "from-slate-500",
          to: "to-slate-600",
          border: "border-slate-400",
          borderDark: "border-slate-700",
          shadow:
            "shadow-[0_4px_12px_rgba(100,116,139,0.3),0_2px_4px_rgba(0,0,0,0.1)]",
        },
      };

      const colors = colorVariants[item.color] || colorVariants.blue;

      return (
        <Link
          key={item.path}
          to={item.path}
          className={`
            relative flex items-center gap-2 px-5 py-3 text-sm font-semibold 
            transition-all duration-200 whitespace-nowrap rounded-lg mx-1
            ${
              isActive
                ? `
                  bg-gradient-to-br from-white to-slate-50 text-slate-700
                  shadow-[0_4px_12px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]
                  border-t border-l border-white
                  border-b border-r border-slate-200
                `
                : `
                  bg-gradient-to-br ${colors.from} ${colors.to} text-white
                  ${colors.shadow}
                  border-t border-l ${colors.border}
                  border-b border-r ${colors.borderDark}
                  hover:brightness-110
                  hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)]
                  hover:-translate-y-0.5
                  active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
                  active:translate-y-0
                `
            }
          `}
        >
          {/* Inner highlight for emboss effect */}
          <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-lg" />

          <Icon className="w-4 h-4 relative z-10" />
          <span className="relative z-10">{item.label}</span>
        </Link>
      );
    });
  };

  return (
    <nav className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4">
        {/* 🔹 Baris 1 */}
        <div className="flex space-x-1 overflow-x-auto py-3">
          {renderNavItems(firstRow)}
        </div>

        {/* 🔹 Baris 2 */}
        {secondRow.length > 0 && (
          <div className="flex space-x-1 overflow-x-auto border-t border-slate-200 py-3">
            {renderNavItems(secondRow)}
          </div>
        )}
      </div>
    </nav>
  );
}
