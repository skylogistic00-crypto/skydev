import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Home from "@/components/home";
import UserManagement from "@/components/UserManagement";
import SupplierForm from "@/components/SupplierForm";
import ShipperForm from "@/components/ShipperForm";
import ConsigneeForm from "@/components/ConsigneeForm";
import CustomerForm from "@/components/CustomerForm";
import StockForm from "@/components/StockForm";
import WarehousesForm from "@/components/WarehousesForm";
import DeliveryForm from "@/components/DeliveryForm";
import BarangLini from "@/components/BarangLini";
import BarangKeluar from "@/components/BarangKeluar";
import AirWaybill from "@/components/AirWaybill";
import TransaksiKeuanganForm from "@/components/TransaksiKeuanganForm";
import BankMutationForm from "@/components/BankMutationForm";
import BankMutationUpload from "@/components/BankMutationUpload";
import AdminSetup from "@/components/AdminSetup";
import COAManagement from "@/components/COAManagement";
import BarangLamaReport from "@/components/BarangLamaReport";
import COAMappingManager from "@/components/COAMappingManager";
import COAEngine from "@/components/COAEngine";
import FixedAssets from "@/components/FixedAssets";
import Depreciation from "@/components/Depreciation";
import AssetDisposal from "@/components/AssetDisposal";
const IntegratedFinancialReport = lazy(() => import("@/components/IntegratedFinancialReport"));
const ProfitLossReport = lazy(() => import("@/components/ProfitLossReport"));
const BalanceSheetReport = lazy(() => import("@/components/BalanceSheetReport"));
const FinancialDashboard = lazy(() => import("@/components/FinancialDashboard"));
const CashFlowReport = lazy(() => import("@/components/CashFlowReport"));
const TaxReportManagement = lazy(() => import("@/components/TaxReportManagement"));
const CoretaxUploadForm = lazy(() => import("@/components/CoretaxUploadForm"));
const CoretaxReportList = lazy(() => import("@/components/CoretaxReportList"));
const ServiceItemsForm = lazy(() => import("@/components/ServiceItemsForm"));
const ApprovalTransaksi = lazy(() => import("@/components/ApprovalTransaksi"));
const CashDisbursementForm = lazy(() => import("@/components/CashDisbursementForm"));
import { Toaster } from "@/components/ui/toaster";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import EmailConfirm from "@/pages/EmailConfirm";
import PendingRegistrasi from "@/pages/pending-registrasi";
import AuditReversalPage from "@/pages/AuditReversalPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import StockAdjustmentForm from "@/components/StockAdjustmentForm";
import StockBarangImport from "@/components/StockBarangImport";
const HRDDashboard = lazy(() => import("@/components/HRDDashboard"));
const DataKaryawan = lazy(() => import("@/components/DataKaryawan"));
const POSTerminal = lazy(() => import("@/components/POSTerminal"));
const WarehouseDashboard = lazy(() => import("@/components/WarehouseDashboard"));
const POSDashboard = lazy(() => import("@/components/POSDashboard"));
import AccountMappingsManager from "@/components/AccountMappingsManager";
import CreateProfitLossView from "@/components/CreateProfitLossView";
import PartnersPage from "@/components/PartnersPage";
import BarangManagementPage from "@/components/BarangManagementPage";
const TestOpenAIConnection = lazy(() => import("@/components/TestOpenAIConnection"));
const ChatAI = lazy(() => import("@/pages/ChatAI"));
const FloatingChatAI = lazy(() => import("@/components/FloatingChatAI"));
const GoogleOCRScanner = lazy(() => import("@/components/GoogleOCRScanner"));
const OCRExtractor = lazy(() => import("@/pages/OCRExtractor"));
const CheckUserOCRData = lazy(() => import("@/components/CheckUserOCRData"));
const EmployeeAdvanceForm = lazy(() => import("@/components/EmployeeAdvanceForm"));
const GeneralLedgerView = lazy(() => import("@/components/GeneralLedgerView"));
const TrialBalanceView = lazy(() => import("@/components/TrialBalanceView"));
const BankReconciliation = lazy(() => import("@/pages/BankReconciliation"));
const BankMutationReview = lazy(() => import("@/pages/BankMutationReview"));

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();

  // 1. tunggu fetch selesai
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-lg">Loading aplikasi...</div>
      </div>
    );
  }

  // 2. user tidak login → lempar ke halaman login (BUKAN "/")
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. user login tapi status belum approved → ke pending-registrasi
  if (userProfile?.status === "inactive") {
    return <Navigate to="/pending-registrasi" replace />;
  }

  // 4. role tidak termasuk allowedRoles → tahan user
  if (
    allowedRoles &&
    userProfile?.roles?.role_name &&
    !allowedRoles.includes(userProfile.roles.role_name)
  ) {
    return null;
  }

  // 5. semua aman → tampilkan halaman
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600"><div className="text-lg">Loading...</div></div>}>
           <AppRoutesContent />
        </Suspense>
        <Toaster />
        <Suspense fallback={null}>
          <FloatingChatAI />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

function HomePage() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-lg">Memuat data pengguna...</div>
      </div>
    );
  }

  // 🟥 USER BELUM LOGIN → tampilkan Header PUBLIC (tanpa useAuth)
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header publicMode={true} /> {/* Wajib */}
        <HeroSection />
      </div>
    );
  }

  // 🟨 USER LOGIN tetapi status belum approved
  if (userProfile?.status === "inactive") {
    return <Navigate to="/pending-registrasi" replace />;
  }

  // 🟩 USER LOGIN & APPROVED → tampilkan dashboard normal
  return (
    <div className="min-h-screen bg-slate-50">
      <Header /> {/* Header normal */}
      <Navigation />
      <Home />
    </div>
  );
}

function AppRoutesContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <div className="text-lg">Loading aplikasi...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth/confirm" element={<EmailConfirm />} />
      <Route path="/verify" element={<EmailConfirm />} />
      <Route path="/confirm" element={<EmailConfirm />} />
      <Route path="/confirm/*" element={<EmailConfirm />} />
      <Route path="/pending-registrasi" element={<PendingRegistrasi />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/admin-setup" element={<AdminSetup />} />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <UserManagement />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/check-ocr-data"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <CheckUserOCRData />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/supplier"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "accounting_manager",
              "accounting_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <SupplierForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipper"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "accounting_manager",
              "accounting_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <ShipperForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/consignee"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "accounting_manager",
              "accounting_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <ConsigneeForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "accounting_manager",
              "accounting_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <CustomerForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-items"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <ServiceItemsForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
              "warehouse_manager",
              "warehouse_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <StockForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "warehouse_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <WarehousesForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "warehouse_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <DeliveryForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/barang-lini"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "warehouse_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <BarangLini />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/barang-keluar"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "accounting_manager",
              "accounting_staff",
              "warehouse_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <BarangKeluar />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-adjustment"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "accounting_manager",
              "accounting_staff",
              "warehouse_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <StockAdjustmentForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-barang-import"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "accounting_manager",
              "accounting_staff",
              "warehouse_staff",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <StockBarangImport />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/air-waybill"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <AirWaybill />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transaksi-keuangan"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <TransaksiKeuanganForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mutasi-bank"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <BankMutationUpload />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-advance"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "admin",
              "finance",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <EmployeeAdvanceForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cash-disbursement"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <CashDisbursementForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/approval-transaksi"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "accounting_manager"]}>
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <ApprovalTransaksi />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coa-management"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <COAManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coa-mapping"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <COAMappingManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coa-engine"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <COAEngine />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fixed-assets"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <FixedAssets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depreciation"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <Depreciation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/asset-disposal"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <AssetDisposal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-barang-lama"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <BarangLamaReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-keuangan"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_staff",
              "accounting_manager",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <FinancialDashboard />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profit-loss"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <ProfitLossReport />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/balance-sheet"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <BalanceSheetReport />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cash-flow"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <CashFlowReport />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/general-ledger"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <GeneralLedgerView />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trial-balance"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <TrialBalanceView />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tax-reports"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <TaxReportManagement />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coretax-upload"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <CoretaxUploadForm />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coretax-report"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <CoretaxReportList />
            </div>
          </ProtectedRoute>
        }
      />
      {/* OCR Scanner */}
      <Route
        path="/google-ocr-scanner"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <Navigation />
              <GoogleOCRScanner />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/laporan-keuangan"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_manager",
              "accounting_staff",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <IntegratedFinancialReport />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/hrd-dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "hr_manager", "hr_staff"]}
          >
            <div className="min-h-screen bg-white">
              <Header />
              <Navigation />
              <HRDDashboard />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/data-karyawan"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "hr_manager", "hr_staff", "admin"]}
          >
            <div className="min-h-screen bg-white">
              <Header />
              <Navigation />
              <DataKaryawan />
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "cashier", "staff"]}
          >
            <POSTerminal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warehouse-dashboard"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "admin",
              "warehouse_manager",
              "warehouse_staff",
            ]}
          >
            <WarehouseDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos-dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "admin", "cashier", "staff"]}
          >
            <POSDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/partners"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "accounting_staff",
              "warehouse_manager",
              "accounting_manager",
              "read_only",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <PartnersPage />
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/barang-management"
        element={
          <ProtectedRoute
            allowedRoles={[
              "super_admin",
              "warehouse_manager",
              "warehouse_staff",
              "accounting_manager",
              "accounting_staff",
              "read_only",
              "customs_specialist",
            ]}
          >
            <div className="min-h-screen bg-slate-50">
              <Header />
              <Navigation />
              <BarangManagementPage />
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/account-mappings"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "accounting_manager"]}>
            <div className="min-h-screen bg-white">
              <Header />
              <Navigation />
              <div className="container mx-auto px-4 py-8">
                <AccountMappingsManager />
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-profit-loss-view"
        element={
          <ProtectedRoute allowedRoles={["super_admin", "accounting_manager"]}>
            <div className="min-h-screen bg-white">
              <Header />
              <Navigation />
              <CreateProfitLossView />
            </div>
          </ProtectedRoute>
        }
      />



      <Route path="/test-openai" element={<TestOpenAIConnection />} />

      <Route path="/chat-ai" element={<ChatAI />} />
      <Route path="/ocr-extractor" element={<OCRExtractor />} />
      <Route path="/bank-reconciliation" element={<BankReconciliation />} />
      <Route path="/bank-mutation-review" element={<BankMutationReview />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
