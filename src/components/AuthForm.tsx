import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/lib/supabase";
import SupplierForm from "@/components/SupplierForm";
import ConsigneeForm from "@/components/ConsigneeForm";
import ShipperForm from "@/components/ShipperForm";
import { Eye, EyeOff, Scan, Upload, CheckCircle2 } from "lucide-react";

interface AuthFormContentProps {
  onSuccess?: () => void;
  isDialog?: boolean;
}

/**
 * SMART MERGE UTILITY
 * Merges newData into oldData without overwriting existing non-empty values in oldData.
 *
 * Rules:
 * 1. Jangan timpa field yang sudah terisi
 * 2. Jangan isi field dengan data kosong
 * 3. Tambahkan field baru atau isi field kosong
 * 4. CRITICAL: Jangan pernah mengosongkan nilai yang sudah berhasil diisi dari OCR sebelumnya
 *
 * @param oldData - The original data object.
 * @param newData - The new data object to merge.
 * @returns A new object with merged data.
 */
const smartMerge = (
  oldData: Record<string, any>,
  newData: Record<string, any>,
): Record<string, any> => {
  const merged = { ...oldData };
  Object.keys(newData).forEach((key) => {
    const newValue = newData[key];

    // Skip if newValue is empty/null/undefined
    if (newValue === undefined || newValue === null || newValue === "") {
      return;
    }

    // CRITICAL: Do not overwrite if oldData has a non-empty value
    // This ensures we never clear values that were successfully filled by previous OCR
    if (
      oldData[key] !== undefined &&
      oldData[key] !== null &&
      oldData[key] !== ""
    ) {
      return;
    }

    // Add new value or fill empty field
    merged[key] = newValue;
  });

  return merged;
};

// Exported component for use in Header dialog
export function AuthFormContent({
  onSuccess,
  isDialog = false,
}: AuthFormContentProps) {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResults, setOcrResults] = useState<Record<string, any>>({});
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);

  // Metadata tracking for smart merge protection
  const [signUpMeta, setSignUpMeta] = useState<
    Record<
      string,
      {
        source: "user" | "ocr";
        document_type: string;
        confidence: number;
        last_updated_at: string;
      }
    >
  >({});

  // Workflow suggestions based on scanned documents
  const [workflowSuggestions, setWorkflowSuggestions] = useState<
    {
      type: string;
      label: string;
      document_types_required: string[];
      icon?: string;
    }[]
  >([]);

  // Track scanned document types
  const [scannedDocTypes, setScannedDocTypes] = useState<Set<string>>(
    new Set(),
  );

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({
    roleName: "",
    roleEntity: "", // Track the entity of the selected role
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    password: "",
    ktpAddress: "",
    ktpNumber: "",
    ktpName: "", // Name from KTP
    religion: "",
    ethnicity: "",
    education: "",
    phoneNumber: "",
    licenseNumber: "",
    licenseExpiryDate: "",
    // KK (Kartu Keluarga) fields
    familyCardNumber: "",
    kelurahanDesa: "",
    kabupatenKota: "",
    kecamatan: "",
    provinsi: "",
    kodePos: "",
    rtRw: "",
    // Vehicle fields for Driver Mitra
    vehicleBrand: "",
    vehicleModel: "",
    plateNumber: "",
    vehicleYear: "",
    vehicleColor: "",
    uploadIjasah: null as File | null,
    selfiePhoto: null as File | null,
    familyCard: null as File | null,
    ktpDocument: null as File | null,
    simDocument: null as File | null,
    skckDocument: null as File | null,
    stnkDocument: null as File | null,
    vehiclePhoto: null as File | null,
  });
  const [showEntityForm, setShowEntityForm] = useState<
    "supplier" | "consignee" | "shipper" | null
  >(null);

  // Supplier/Consignee/Shipper form data
  const [entityFormData, setEntityFormData] = useState({
    entity_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    city: "",
    country: "",
    address: "",
    is_pkp: "",
    tax_id: "",
    bank_name: "",
    bank_account_holder: "",
    payment_terms: "",
    category: "",
    currency: "IDR",
    status: "ACTIVE",
  });

  // Load roles from database
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const { data, error } = await supabase
      .from("roles")
      .select("role_id, role_name, entity")
      .order("role_name", { ascending: true });

    if (error) {
      console.error("Error loading roles:", err);
    } else {
      setRoles(data || []);
    }
  };

  // Helper function to humanize role names
  const humanizeRole = (roleName: string) => {
    return roleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // OCR Scan Handler
  const handleOcrScan = async (documentType: string, file: File) => {
    setOcrScanning(true);
    try {
      // Validate supported file types
      const supportedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      if (!supportedTypes.includes(file.type)) {
        toast({
          title: "Format Tidak Didukung",
          description:
            "Hanya file gambar (JPEG, PNG, WEBP) dan PDF yang didukung untuk OCR.",
          variant: "destructive",
        });
        setOcrScanning(false);
        return;
      }

      // Upload file to storage via Edge Function
      const fileExt = file.name.split(".").pop();
      const fileName = `ocr_${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);

      // Call Edge Function with proper headers
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supabase-functions-upload-ocr-file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData?.error || `Upload failed: ${response.status}`,
        );
      }

      const uploadResult = await response.json();

      if (!uploadResult?.success) {
        throw new Error(uploadResult?.error || "Upload failed");
      }

      const signedUrl = uploadResult.signedUrl;

      // Call Hybrid OCR Processor with file type
      const { data: ocrData, error: ocrError } =
        await supabase.functions.invoke(
          "supabase-functions-hybrid-ocr-processor",
          {
            body: {
              image_url: signedUrl,
              file_type: file.type,
              document_type_hint: documentType,
            },
          },
        );

      if (ocrError) {
        console.error("OCR Error:", ocrErr);
        throw ocrErr;
      }

      if (!ocrData || !ocrData.success) {
        throw new Error(ocrData?.error || "OCR processing failed");
      }

      const {
        ocr_engine,
        jenis_dokumen,
        data: structuredData,
        raw_text,
        clean_text,
      } = ocrData;

      if (!structuredData) {
        throw new Error("No structured data returned from OCR");
      }

      // ========================================
      // A. SMART OCR MERGE ENGINE
      // ========================================

      // Determine document type for namespace
      const docTypeMap: Record<string, string> = {
        KTP: "ktp",
        KK: "kk",
        IJAZAH: "ijazah",
        SKCK: "skck",
        CV: "cv",
      };
      const docTypeForMerge = docTypeMap[jenis_dokumen] || null;

      // Skip keys - technical fields that should not be processed
      const skipKeys = [
        "jenis_dokumen",
        "raw_text",
        "clean_text",
        "ocr_engine",
        "id",
        "created_at",
        "updated_at",
        "debug_notes",
      ];

      // Filter out skip keys from OCR data
      const cleanedOcrData: Record<string, any> = {};
      Object.entries(structuredData).forEach(([key, value]) => {
        if (!skipKeys.includes(key)) {
          cleanedOcrData[key] = value;
        }
      });

      // Build complete update object for signUpData using SMART MERGE
      const updatedSignUpData: Record<string, any> = { ...signUpData };
      const newDynamicFields: any[] = [];
      const existingFormFields = Object.keys(signUpData);

      // ========================================
      // NAMESPACE STORAGE: Store document-specific data in details[document_type]
      // ========================================
      // Initialize details object if not exists
      if (!updatedSignUpData.details) {
        updatedSignUpData.details = {};
      }

      // Store full OCR data in namespace based on document type
      if (docTypeForMerge) {
        // Initialize namespace if not exists
        if (!updatedSignUpData.details[docTypeForMerge]) {
          updatedSignUpData.details[docTypeForMerge] = {};
        }

        // Store all cleaned OCR data in the namespace
        Object.entries(cleanedOcrData).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            // Only add if not already exists in namespace
            if (
              !updatedSignUpData.details[docTypeForMerge][key] ||
              updatedSignUpData.details[docTypeForMerge][key] === "" ||
              updatedSignUpData.details[docTypeForMerge][key] === null
            ) {
              updatedSignUpData.details[docTypeForMerge][key] = value;
            }
          }
        });
      }

      // Special handling for KK documents with anggota_keluarga
      if (
        jenis_dokumen === "KK" &&
        structuredData.anggota_keluarga &&
        Array.isArray(structuredData.anggota_keluarga)
      ) {
        // SMART MERGE: Only add anggota_keluarga if not already exists
        if (
          !updatedSignUpData["anggota_keluarga"] ||
          updatedSignUpData["anggota_keluarga"] === null ||
          updatedSignUpData["anggota_keluarga"] === undefined
        ) {
          updatedSignUpData["anggota_keluarga"] =
            structuredData.anggota_keluarga;
        }

        // Add anggota_keluarga as a dynamic field (will be displayed as JSON)
        newDynamicFields.push({
          name: "anggota_keluarga",
          label: "Anggota Keluarga",
          type: "json",
          required: false,
          value: structuredData.anggota_keluarga,
        });

        // ========================================
        // SMART MERGE: Add KK header fields
        // ========================================
        const kkHeaderFields = [
          "nomor_kk",
          "nama_kepala_keluarga",
          "rt_rw",
          "kelurahan_desa",
          "kecamatan",
          "kabupaten_kota",
          "provinsi",
          "kode_pos",
          "tanggal_dikeluarkan",
        ];

        kkHeaderFields.forEach((field) => {
          if (
            structuredData[field] &&
            structuredData[field] !== null &&
            structuredData[field] !== undefined &&
            structuredData[field] !== ""
          ) {
            // SMART MERGE: Only add if field is empty or doesn't exist
            if (
              !updatedSignUpData[field] ||
              updatedSignUpData[field] === "" ||
              updatedSignUpData[field] === null ||
              updatedSignUpData[field] === undefined
            ) {
              updatedSignUpData[field] = structuredData[field];

              // Add to dynamic fields for display
              newDynamicFields.push({
                name: field,
                label: field
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" "),
                type: "text",
                required: false,
                value: structuredData[field],
              });
            }
          }
        });

        // Extract first family member (kepala keluarga) data for main form
        const kepalaKeluarga =
          structuredData.anggota_keluarga.find(
            (a: any) =>
              a.status_hubungan_keluarga?.toUpperCase() === "KEPALA KELUARGA",
          ) || structuredData.anggota_keluarga[0];

        if (kepalaKeluarga) {
          // SMART MERGE: Map kepala keluarga fields to main form
          const kepalaKeluargaFields = [
            { source: "nama", target: "nama" },
            { source: "nik", target: "nik" },
            { source: "tempat_lahir", target: "tempat_lahir" },
            { source: "tanggal_lahir", target: "tanggal_lahir" },
            { source: "jenis_kelamin", target: "jenis_kelamin" },
            { source: "agama", target: "agama" },
            { source: "pekerjaan", target: "pekerjaan" },
            { source: "jenis_pekerjaan", target: "pekerjaan" },
            { source: "status_perkawinan", target: "status_perkawinan" },
            { source: "kewarganegaraan", target: "kewarganegaraan" },
            { source: "nama_ayah", target: "nama_ayah" },
            { source: "nama_ibu", target: "nama_ibu" },
          ];

          kepalaKeluargaFields.forEach(({ source, target }) => {
            if (
              kepalaKeluarga[source] &&
              kepalaKeluarga[source] !== null &&
              kepalaKeluarga[source] !== undefined &&
              kepalaKeluarga[source] !== ""
            ) {
              // SMART MERGE: Only add if target field is empty or doesn't exist
              if (
                !updatedSignUpData[target] ||
                updatedSignUpData[target] === "" ||
                updatedSignUpData[target] === null ||
                updatedSignUpData[target] === undefined
              ) {
                updatedSignUpData[target] = kepalaKeluarga[source];
                console.log(
                  `✔ SMART MERGE [kepala keluarga]: ${target} = ${kepalaKeluarga[source]}`,
                );
              } else {
                console.log(
                  `⊗ SMART MERGE [kepala keluarga]: ${target} already exists, skipping`,
                );
              }
            }
          });

          console.log("Extracted kepala keluarga data:", kepalaKeluarga.nama);
        }
      }

      // Process ALL keys from structuredData with SMART MERGE logic
      // Skip KK header fields if already processed above
      const kkHeaderFieldsToSkip =
        jenis_dokumen === "KK"
          ? [
              "nomor_kk",
              "nama_kepala_keluarga",
              "rt_rw",
              "kelurahan_desa",
              "kecamatan",
              "kabupaten_kota",
              "provinsi",
              "kode_pos",
              "tanggal_dikeluarkan",
            ]
          : [];

      // ========================================
      // UDFM ULTRA: UNIVERSAL DOCUMENT FIELD MAPPER
      // Supports ALL document types with namespace storage
      // ========================================

      // Store document data under namespace: signUpData.details.[document_type]
      if (!updatedSignUpData.details) {
        updatedSignUpData.details = {};
      }

      // Map document type to namespace key
      const namespaceKey = jenis_dokumen.toLowerCase().replace(/_/g, "_");
      updatedSignUpData.details[namespaceKey] = structuredData;
      console.log(
        `✔ UDFM ULTRA: Data stored in signUpData.details.${namespaceKey}`,
      );

      // Process ALL fields from structuredData with SMART MERGE
      // CRITICAL: Jangan menghapus data dari dokumen sebelumnya
      Object.entries(structuredData).forEach(([sourceKey, value]) => {
        // Skip array fields (like anggota_keluarga, items, pendidikan, etc.)
        if (Array.isArray(value)) {
          console.log(`⊗ UDFM ULTRA: Skipping array field ${sourceKey}`);
          return;
        }

        if (value !== null && value !== undefined && value !== "") {
          const targetKey = sourceKey.replace(/[^a-zA-Z0-9_]/g, "");

          // SMART MERGE: Only add if target field is empty or doesn't exist
          // CRITICAL: Jangan menimpa data yang sudah benar (user edit / OCR confidence tinggi)
          if (
            !updatedSignUpData[targetKey] ||
            updatedSignUpData[targetKey] === "" ||
            updatedSignUpData[targetKey] === null ||
            updatedSignUpData[targetKey] === undefined
          ) {
            updatedSignUpData[targetKey] = value;
            console.log(
              `✔ SMART MERGE [${jenis_dokumen}]: ${targetKey} = ${value}`,
            );
          } else {
            console.log(
              `⊗ SMART MERGE [${jenis_dokumen}]: ${targetKey} already exists, skipping`,
            );
          }

          // WAJIB: Semua field hasil OCR harus dimasukkan ke dynamicFields
          // walaupun tidak ada di form awal
          const existingDynamicField = newDynamicFields.find(
            (f) => f.name === targetKey,
          );
          if (
            !existingDynamicField &&
            !existingFormFields.includes(targetKey)
          ) {
            newDynamicFields.push({
              name: targetKey,
              label: targetKey
                .split("_")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
              type:
                targetKey.includes("tanggal") || targetKey.includes("date")
                  ? "date"
                  : "text",
              required: false,
              value: value,
            });
            console.log(
              `✔ DYNAMIC FIELD [${jenis_dokumen}]: ${targetKey} added to dynamicFields`,
            );
          }
        }
      });

      console.log(
        `UDFM ULTRA: ${jenis_dokumen} data processed successfully - all fields added to dynamicFields`,
      );

      // Skip fields that were already processed above
      const processedFieldsToSkip = Object.keys(structuredData).filter(
        (k) => !Array.isArray(structuredData[k]),
      );

      Object.entries(cleanedOcrData).forEach(([key, value]) => {
        // Skip anggota_keluarga (already processed above), KK header fields, and already processed fields
        if (
          key === "anggota_keluarga" ||
          kkHeaderFieldsToSkip.includes(key) ||
          processedFieldsToSkip.includes(key)
        )
          return;

        const normalizedKey = key.replace(/[^a-zA-Z0-9_]/g, "");

        // SMART MERGE: Only add if value is not empty AND field is empty or doesn't exist
        if (value !== null && value !== undefined && value !== "") {
          if (
            !updatedSignUpData[normalizedKey] ||
            updatedSignUpData[normalizedKey] === "" ||
            updatedSignUpData[normalizedKey] === null ||
            updatedSignUpData[normalizedKey] === undefined
          ) {
            updatedSignUpData[normalizedKey] = value;
            console.log(`✔ SMART MERGE: ${normalizedKey} = ${value}`);
          } else {
            console.log(
              `⊗ SMART MERGE: ${normalizedKey} already exists, skipping`,
            );
          }
        }

        // If field doesn't exist in form, add to dynamic fields
        if (
          !existingFormFields.includes(normalizedKey) &&
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          newDynamicFields.push({
            name: normalizedKey,
            label: normalizedKey
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
            type: "text",
            required: false,
            value: value,
          });
        }
      });

      // Single state update with all fields using SMART MERGE
      // CRITICAL: Use smartMerge to prevent overwriting existing data
      setSignUpData((prev) => smartMerge(prev, updatedSignUpData));

      // ========================================
      // UPDATE METADATA FOR SMART MERGE PROTECTION
      // ========================================
      setSignUpMeta((prev) => {
        const updatedMeta = { ...prev };

        // Add metadata for all new OCR fields
        Object.keys(cleanedOcrData).forEach((key) => {
          const value = cleanedOcrData[key];
          if (value !== null && value !== undefined && value !== "") {
            // Only update meta if field doesn't exist or is from OCR (not user-edited)
            if (!updatedMeta[key] || updatedMeta[key].source !== "user") {
              updatedMeta[key] = {
                source: "ocr",
                document_type: docTypeForMerge || jenis_dokumen,
                confidence: 0.85,
                last_updated_at: new Date().toISOString(),
              };
            }
          }
        });

        return updatedMeta;
      });

      // ========================================
      // WORKFLOW ROUTING (UDFM v3)
      // ========================================
      // Update scanned document types and generate workflow suggestions
      const currentDocType = docTypeForMerge || jenis_dokumen;
      if (currentDocType) {
        setScannedDocTypes((prev) => {
          const updated = new Set(prev);
          updated.add(currentDocType);

          // Generate workflow suggestions based on scanned documents
          const suggestions: typeof workflowSuggestions = [];

          // INVOICE workflow
          if (updated.has("INVOICE")) {
            suggestions.push({
              type: "create_purchase_transaction",
              label:
                "Buat transaksi pembelian / jurnal akuntansi dari invoice ini",
              document_types_required: ["INVOICE"],
              icon: "📄",
            });
          }

          // STNK / PAJAK_KENDARAAN workflow
          if (updated.has("STNK") || updated.has("PAJAK_KENDARAAN")) {
            suggestions.push({
              type: "create_vehicle_asset",
              label:
                "Tambah kendaraan ke master asset / jadwalkan pengingat pajak",
              document_types_required: ["STNK", "PAJAK_KENDARAAN"],
              icon: "🚗",
            });
          }

          // KTP + KK workflow
          if (updated.has("KTP") && updated.has("KK")) {
            suggestions.push({
              type: "create_employee_master",
              label: "Buat master data karyawan/customer baru",
              document_types_required: ["KTP", "KK"],
              icon: "👤",
            });
          } else if (updated.has("KTP")) {
            suggestions.push({
              type: "create_customer_master",
              label: "Buat master data customer dari KTP",
              document_types_required: ["KTP"],
              icon: "👤",
            });
          }

          // AWB workflow
          if (updated.has("AWB")) {
            suggestions.push({
              type: "create_shipment",
              label: "Buat data shipment / tracking order",
              document_types_required: ["AWB"],
              icon: "📦",
            });
          }

          // IJAZAH + CV workflow
          if (updated.has("IJAZAH") && updated.has("CV")) {
            suggestions.push({
              type: "create_candidate_profile",
              label: "Buat profil kandidat / karyawan",
              document_types_required: ["IJAZAH", "CV"],
              icon: "📋",
            });
          } else if (updated.has("IJAZAH")) {
            suggestions.push({
              type: "add_education_data",
              label: "Tambah data pendidikan ke profil",
              document_types_required: ["IJAZAH"],
              icon: "🎓",
            });
          }

          // NPWP workflow
          if (updated.has("NPWP")) {
            suggestions.push({
              type: "add_tax_data",
              label: "Tambah data pajak ke profil",
              document_types_required: ["NPWP"],
              icon: "📊",
            });
          }

          // SIM workflow
          if (updated.has("SIM")) {
            suggestions.push({
              type: "add_driver_license",
              label: "Tambah data SIM ke profil driver",
              document_types_required: ["SIM"],
              icon: "🪪",
            });
          }

          // BPJS workflow
          if (updated.has("BPJS")) {
            suggestions.push({
              type: "add_insurance_data",
              label: "Tambah data BPJS ke profil karyawan",
              document_types_required: ["BPJS"],
              icon: "🏥",
            });
          }

          setWorkflowSuggestions(suggestions);
          console.log("✔ Workflow suggestions updated:", suggestions);

          return updated;
        });
      }

      console.log("Dynamic fields to render:", newDynamicFields);

      // ========================================
      // SMART MERGE FOR DYNAMIC FIELDS
      // ========================================
      // Merge newDynamicFields with existing dynamicFields
      // Rule: Jangan pernah mengosongkan nilai yang sudah berhasil diisi dari OCR sebelumnya
      setDynamicFields((prev) => {
        const mergedFields = [...prev];

        newDynamicFields.forEach((newField) => {
          const existingFieldIndex = mergedFields.findIndex(
            (f) => f.name === newField.name,
          );

          if (existingFieldIndex === -1) {
            // Field baru, tambahkan
            mergedFields.push(newField);
            console.log(
              `✔ DYNAMIC FIELD ADDED: ${newField.name} = ${newField.value}`,
            );
          } else {
            // Field sudah ada, cek apakah perlu update
            const existingField = mergedFields[existingFieldIndex];

            // Jangan timpa jika field lama sudah terisi dan tidak kosong
            if (
              existingField.value !== null &&
              existingField.value !== undefined &&
              existingField.value !== ""
            ) {
              console.log(
                `⊗ DYNAMIC FIELD PRESERVED: ${newField.name} (existing value: ${existingField.value})`,
              );
            } else if (
              newField.value !== null &&
              newField.value !== undefined &&
              newField.value !== ""
            ) {
              // Field lama kosong, isi dengan nilai baru
              mergedFields[existingFieldIndex] = newField;
              console.log(
                `✔ DYNAMIC FIELD FILLED: ${newField.name} = ${newField.value}`,
              );
            }
          }
        });

        console.log("Total dynamic fields after merge:", mergedFields.length);
        return mergedFields;
      });

      // ========================================
      // C. AUTO-CREATE DATABASE COLUMNS
      // ========================================
      const { data: fieldsData, error: fieldsError } =
        await supabase.functions.invoke(
          "supabase-functions-auto-create-user-fields",
          {
            body: {
              structured_data: structuredData,
              document_type: jenis_dokumen,
            },
          },
        );

      if (fieldsError) {
        console.error("Auto-create fields error:", fieldsError);
        toast({
          title: "Peringatan",
          description: `Gagal membuat kolom otomatis: ${fieldsError.message}`,
          variant: "destructive",
        });
      }

      console.log("Auto-created fields:", fieldsData);

      // Update dynamicFields from Edge Function response if available
      if (fieldsData?.success && fieldsData?.auto_fields_created?.length > 0) {
        // SMART MERGE: Merge auto_fields_created with existing dynamicFields
        // Rule: Jangan pernah mengosongkan nilai yang sudah berhasil diisi dari OCR sebelumnya
        setDynamicFields((prev) => {
          const mergedFields = [...prev];

          fieldsData.auto_fields_created.forEach((newField: any) => {
            const existingFieldIndex = mergedFields.findIndex(
              (f) => f.name === newField.name,
            );

            if (existingFieldIndex === -1) {
              // Field baru dari Edge Function, tambahkan
              mergedFields.push(newField);
              console.log(
                `✔ EDGE FUNCTION FIELD ADDED: ${newField.name} = ${newField.value}`,
              );
            } else {
              // Field sudah ada, cek apakah perlu update
              const existingField = mergedFields[existingFieldIndex];

              // Jangan timpa jika field lama sudah terisi dan tidak kosong
              if (
                existingField.value !== null &&
                existingField.value !== undefined &&
                existingField.value !== ""
              ) {
                console.log(
                  `⊗ EDGE FUNCTION FIELD PRESERVED: ${newField.name} (existing value: ${existingField.value})`,
                );
              } else if (
                newField.value !== null &&
                newField.value !== undefined &&
                newField.value !== ""
              ) {
                // Field lama kosong, isi dengan nilai baru
                mergedFields[existingFieldIndex] = newField;
                console.log(
                  `✔ EDGE FUNCTION FIELD FILLED: ${newField.name} = ${newField.value}`,
                );
              }
            }
          });

          console.log(
            "Total dynamic fields after Edge Function merge:",
            mergedFields.length,
          );
          return mergedFields;
        });

        console.log(
          "Updated dynamicFields from Edge Function with SMART MERGE",
        );

        if (fieldsData.supabase_columns_created?.length > 0) {
          toast({
            title: "Kolom Baru Dibuat",
            description: `${fieldsData.supabase_columns_created.length} kolom baru ditambahkan ke database`,
          });
        }
      } else if (!fieldsData?.success) {
        toast({
          title: "Peringatan",
          description: `Gagal membuat kolom otomatis: ${fieldsData?.error || "Unknown error"}`,
          variant: "destructive",
        });
      }

      // Save document results to appropriate table
      const { data: saveData, error: saveError } =
        await supabase.functions.invoke(
          "supabase-functions-save-document-results",
          {
            body: {
              document_type: jenis_dokumen,
              structured_data: structuredData,
              raw_text: raw_text,
              user_id: null,
            },
          },
        );

      if (saveError) {
        console.error("Save document error:", saveError);
      }

      // Show success message
      toast({
        title: "OCR Berhasil",
        description: `${Object.keys(structuredData).length} field berhasil diekstrak dari ${jenis_dokumen}`,
      });

      setOcrResults({ ...ocrResults, [documentType]: structuredData });
    } catch (error) {
      console.error("OCR Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal memproses dokumen";
      toast({
        title: "OCR Gagal",
        description: errorMessage,
        variant: "destructive",
      });
      setOcrResults((prev) => ({
        ...prev,
        [documentType]: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    } finally {
      setOcrScanning(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
      toast({ title: "Success", description: "Signed in successfully" });
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign in failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to upload file to bucket
  const uploadFileToBucket = async (
    file: File,
    folder: string,
    userId?: string,
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = userId
        ? `${folder}/${userId}/${fileName}`
        : `${folder}/temp_${fileName}`;

      const { data, error } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("employee-documents").getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation before sending to Edge Function
    if (!signUpData.email || signUpData.email.trim() === "") {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (!signUpData.password || signUpData.password.trim() === "") {
      toast({
        title: "Error",
        description: "Password is required",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpData.email.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare details object based on entity type
      const details: Record<string, any> = {};
      const fileUrls: Record<string, string> = {};

      // roleEntity is the actual entity_type (karyawan, driver_perusahaan, etc.)
      // Fallback to roleName if roleEntity is empty (for roles like Consignee, Supplier, Shipper)
      let entityType = signUpData.roleEntity;
      if (!entityType && signUpData.roleName) {
        // Map role names to entity types
        const roleNameLower = signUpData.roleName.toLowerCase();
        if (roleNameLower === "consignee") entityType = "consignee";
        else if (roleNameLower === "supplier") entityType = "supplier";
        else if (roleNameLower === "shipper") entityType = "shipper";
        else if (roleNameLower === "customer") entityType = "customer";
        else entityType = roleNameLower.replace(/\s+/g, "_");
      }

      if (
        entityType === "supplier" ||
        entityType === "consignee" ||
        entityType === "shipper" ||
        entityType === "customer"
      ) {
        // Entity-specific details
        Object.assign(details, {
          entity_name: entityFormData.entity_name,
          contact_person: entityFormData.contact_person,
          city: entityFormData.city,
          country: entityFormData.country,
          address: entityFormData.address,
          is_pkp: entityFormData.is_pkp,
          tax_id: entityFormData.tax_id,
          bank_name: entityFormData.bank_name,
          bank_account_holder: entityFormData.bank_account_holder,
          payment_terms: entityFormData.payment_terms,
          category: entityFormData.category,
          currency: entityFormData.currency,
          status: entityFormData.status,
        });
      }

      if (
        entityType === "karyawan" ||
        entityType === "driver_perusahaan" ||
        entityType === "driver_mitra"
      ) {
        // Employee/Driver details
        Object.assign(details, {
          ktp_address: signUpData.ktpAddress,
          ktp_number: signUpData.ktpNumber,
          religion: signUpData.religion,
          ethnicity: signUpData.ethnicity,
          education: signUpData.education,
          license_number: signUpData.licenseNumber,
          license_expiry_date: signUpData.licenseExpiryDate,
        });

        // Upload ijasah file to bucket if provided
        if (signUpData.uploadIjasah) {
          console.log("Uploading ijasah file:", signUpData.uploadIjasah.name);
          const ijasahUrl = await uploadFileToBucket(
            signUpData.uploadIjasah,
            "upload_ijasah",
          );
          console.log("Ijasah upload result:", ijasahUrl);
          if (ijasahUrl) {
            details.upload_ijasah = ijasahUrl;
            fileUrls.upload_ijasah_url = ijasahUrl;
          }
        }

        // Additional vehicle details for Driver Mitra
        if (entityType === "driver_mitra") {
          Object.assign(details, {
            vehicle_brand: signUpData.vehicleBrand,
            vehicle_model: signUpData.vehicleModel,
            plate_number: signUpData.plateNumber,
            vehicle_year: signUpData.vehicleYear,
            vehicle_color: signUpData.vehicleColor,
          });
        }

        // Upload KTP document to bucket if provided
        if (signUpData.ktpDocument) {
          console.log("Uploading KTP document:", signUpData.ktpDocument.name);
          const ktpUrl = await uploadFileToBucket(
            signUpData.ktpDocument,
            "ktp",
          );
          console.log("KTP upload result:", ktpUrl);
          if (ktpUrl) {
            details.ktp_document_url = ktpUrl;
            fileUrls.ktp_document_url = ktpUrl;
          }
        }

        // Upload selfie photo to bucket if provided
        if (signUpData.selfiePhoto) {
          console.log("Uploading selfie photo:", signUpData.selfiePhoto.name);
          const selfieUrl = await uploadFileToBucket(
            signUpData.selfiePhoto,
            "selfi",
          );
          console.log("Selfie upload result:", selfieUrl);
          if (selfieUrl) {
            details.selfie_url = selfieUrl;
            fileUrls.selfie_url = selfieUrl;
          }
        }

        // Upload family card to bucket if provided
        if (signUpData.familyCard) {
          console.log("Uploading family card:", signUpData.familyCard.name);
          const familyCardUrl = await uploadFileToBucket(
            signUpData.familyCard,
            "family_card",
          );
          console.log("Family card upload result:", familyCardUrl);
          if (familyCardUrl) {
            details.family_card_url = familyCardUrl;
            fileUrls.family_card_url = familyCardUrl;
          }
        }

        // Upload SIM document to bucket if provided
        if (signUpData.simDocument) {
          console.log("Uploading SIM document:", signUpData.simDocument.name);
          const simUrl = await uploadFileToBucket(
            signUpData.simDocument,
            "sim",
          );
          console.log("SIM upload result:", simUrl);
          if (simUrl) {
            details.sim_url = simUrl;
            fileUrls.sim_url = simUrl;
          }
        }

        // Upload SKCK document to bucket if provided
        if (signUpData.skckDocument) {
          console.log("Uploading SKCK document:", signUpData.skckDocument.name);
          const skckUrl = await uploadFileToBucket(
            signUpData.skckDocument,
            "skck",
          );
          console.log("SKCK upload result:", skckUrl);
          if (skckUrl) {
            details.skck_url = skckUrl;
            fileUrls.skck_url = skckUrl;
          }
        }

        // Additional file URLs for Driver Mitra
        if (entityType === "driver_mitra") {
          // Upload STNK document
          if (signUpData.stnkDocument) {
            console.log(
              "Uploading STNK document:",
              signUpData.stnkDocument.name,
            );
            const stnkUrl = await uploadFileToBucket(
              signUpData.stnkDocument,
              "stnk",
            );
            console.log("STNK upload result:", stnkUrl);
            if (stnkUrl) {
              details.upload_stnk_url = stnkUrl;
              fileUrls.upload_stnk_url = stnkUrl;
            }
          }
          // Upload vehicle photo
          if (signUpData.vehiclePhoto) {
            console.log(
              "Uploading vehicle photo:",
              signUpData.vehiclePhoto.name,
            );
            const vehiclePhotoUrl = await uploadFileToBucket(
              signUpData.vehiclePhoto,
              "vehicle_photo",
            );
            console.log("Vehicle photo upload result:", vehiclePhotoUrl);
            if (vehiclePhotoUrl) {
              details.vehicle_photo = vehiclePhotoUrl;
              fileUrls.upload_vehicle_photo_url = vehiclePhotoUrl;
            }
          }
        }
      }

      // Determine fullName from OCR data or entity form
      // Priority: OCR extracted name > contact_person > entity_name
      const fullName =
        signUpData.ktpName ||
        entityFormData.contact_person ||
        entityFormData.entity_name ||
        "";

      // ========================================
      // D. INCLUDE ALL DYNAMIC FIELDS IN DETAILS
      // ========================================
      // Add all dynamic fields from OCR to details object
      dynamicFields.forEach((field) => {
        const fieldValue = signUpData[field.name as keyof typeof signUpData];
        if (
          fieldValue !== undefined &&
          fieldValue !== null &&
          fieldValue !== ""
        ) {
          details[field.name] = fieldValue;
          console.log(
            `✔ Including dynamic field in sign-up: ${field.name} = ${fieldValue}`,
          );
        }
      });

      // Also include any other fields from signUpData that aren't already in details
      // Skip keys that are file objects (File instances)
      const fileFieldKeys = [
        "ktpDocument",
        "selfiePhoto",
        "familyCard",
        "simDocument",
        "skckDocument",
        "uploadIjasah",
        "stnkDocument",
        "vehiclePhoto",
      ];

      Object.entries(signUpData).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !details[key] &&
          !fileFieldKeys.includes(key) && // Skip file fields
          !(value instanceof File) // Skip File objects
        ) {
          // Allow arrays and objects (like anggota_keluarga)
          details[key] = value;
          console.log(
            `✔ Including additional field in sign-up: ${key} = ${typeof value === "object" ? JSON.stringify(value).substring(0, 100) : value}`,
          );
        }
      });

      console.log("Final details object for sign-up:", details);
      console.log("=== CRITICAL: Checking KTP/KK fields in details ===");
      console.log("details.nik:", details.nik);
      console.log("details.nama:", details.nama);
      console.log("details.nomor_kk:", details.nomor_kk);
      console.log(
        "details.nama_kepala_keluarga:",
        details.nama_kepala_keluarga,
      );
      console.log(
        "details.anggota_keluarga:",
        details.anggota_keluarga ? "EXISTS" : "NOT FOUND",
      );
      console.log("=== END CRITICAL CHECK ===");

      await signUp(
        signUpData.email,
        signUpData.password,
        fullName,
        entityType,
        signUpData.phoneNumber || entityFormData.phone_number,
        details, // <---- ALL fields including dynamic OCR fields
        fileUrls,
        selectedRole?.role_name || signUpData.roleName || null,
        selectedRole?.role_id || null,
        entityType, // Use the computed entityType instead of selectedRole?.entity
        // <- hanya dikirim jika ingin masuk tabel USERS
        signUpData.ktpNumber,
        signUpData.ktpAddress,
        null, // first_name - removed, will be derived from OCR
        null, // last_name - removed, will be derived from OCR
        signUpData.religion,
        signUpData.ethnicity,
        signUpData.licenseNumber,
        signUpData.licenseExpiryDate,
        signUpData.education,
        details.upload_ijasah || fileUrls.upload_ijasah_url || null,
      );

      toast({
        title: "Success",
        description:
          "Account created! Please check your email for verification.",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Sign up error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create account";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If used in dialog mode, render without Card wrapper
  if (isDialog) {
    return (
      <Tabs defaultValue="signin" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 mt-4">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin" className="px-6 pb-6 mt-4 shrink-0">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                value={signInData.email}
                onChange={(e) =>
                  setSignInData({ ...signInData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showSignInPassword ? "text" : "password"}
                  value={signInData.password}
                  onChange={(e) =>
                    setSignInData({ ...signInData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-gray-700 transition-colors"
                >
                  {showSignInPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent
          value="signup"
          className="flex-1 min-h-0 flex flex-col px-6 pb-6 mt-4"
        >
          <form
            onSubmit={handleSignUp}
            className="flex-1 overflow-y-auto pr-2 space-y-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f5f9",
            }}
          >
            {/* Role */}
            <div className="space-y-2 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
              <Label
                htmlFor="signup-role"
                className="text-sm font-medium text-slate-700"
              >
                Role *
              </Label>
              <Select
                value={signUpData.roleName}
                onValueChange={(value) => {
                  const foundRole = roles.find((r) => r.role_name === value);
                  setSelectedRole(foundRole || null);
                  setSignUpData({
                    ...signUpData,
                    roleName: value,
                    roleEntity: foundRole?.entity || "",
                  });
                  const lowerRole = value.toLowerCase();
                  if (lowerRole.includes("supplier")) {
                    setShowEntityForm("supplier");
                  } else if (lowerRole.includes("consignee")) {
                    setShowEntityForm("consignee");
                  } else if (lowerRole.includes("shipper")) {
                    setShowEntityForm("shipper");
                  } else {
                    setShowEntityForm(null);
                  }
                }}
              >
                <SelectTrigger
                  id="signup-role"
                  className="bg-white border-blue-200"
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.role_name)
                    .map((role) => (
                      <SelectItem key={role.role_id} value={role.role_name}>
                        {humanizeRole(role.role_name)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* OCR Document Scanner */}
            {signUpData.roleName && !showEntityForm && (
              <div className="space-y-3 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Scan className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    Scan Dokumen (Opsional)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Scan dokumen untuk mengisi data secara otomatis
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {/* KTP Scanner */}
                  <div className="space-y-1">
                    <Label htmlFor="ocr-ktp" className="text-xs cursor-pointer">
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>KTP</span>
                        </span>
                        {ocrResults.ktp?.success && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </Label>
                    <Input
                      id="ocr-ktp"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleOcrScan("ktp", file);
                      }}
                      disabled={ocrScanning}
                    />
                  </div>

                  {/* KK Scanner */}
                  <div className="space-y-1">
                    <Label htmlFor="ocr-kk" className="text-xs cursor-pointer">
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>KK</span>
                        </span>
                        {ocrResults.kk?.success && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </Label>
                    <Input
                      id="ocr-kk"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleOcrScan("kk", file);
                      }}
                      disabled={ocrScanning}
                    />
                  </div>

                  {/* Ijazah Scanner */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="ocr-ijazah"
                      className="text-xs cursor-pointer"
                    >
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Ijazah</span>
                        </span>
                        {ocrResults.ijazah?.success && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </Label>
                    <Input
                      id="ocr-ijazah"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleOcrScan("ijazah", file);
                      }}
                      disabled={ocrScanning}
                    />
                  </div>

                  {/* SIM Scanner */}
                  {(signUpData.roleEntity === "driver_perusahaan" ||
                    signUpData.roleEntity === "driver_mitra") && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="ocr-sim"
                        className="text-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                          <span className="flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>SIM</span>
                          </span>
                          {ocrResults.sim?.success && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </Label>
                      <Input
                        id="ocr-sim"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleOcrScan("sim", file);
                        }}
                        disabled={ocrScanning}
                      />
                    </div>
                  )}

                  {/* STNK Scanner */}
                  {signUpData.roleEntity === "driver_mitra" && (
                    <div className="space-y-1">
                      <Label
                        htmlFor="ocr-stnk"
                        className="text-xs cursor-pointer"
                      >
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                          <span className="flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>STNK</span>
                          </span>
                          {ocrResults.stnk?.success && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </Label>
                      <Input
                        id="ocr-stnk"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleOcrScan("stnk", file);
                        }}
                        disabled={ocrScanning}
                      />
                    </div>
                  )}

                  {/* SKCK Scanner */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="ocr-skck"
                      className="text-xs cursor-pointer"
                    >
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>SKCK</span>
                        </span>
                        {ocrResults.skck?.success && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </Label>
                    <Input
                      id="ocr-skck"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleOcrScan("skck", file);
                      }}
                      disabled={ocrScanning}
                    />
                  </div>

                  {/* CV Scanner */}
                  <div className="space-y-1">
                    <Label htmlFor="ocr-cv" className="text-xs cursor-pointer">
                      <div className="flex items-center justify-between p-2 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                        <span className="flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>CV</span>
                        </span>
                        {ocrResults.cv?.success && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </Label>
                    <Input
                      id="ocr-cv"
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleOcrScan("cv", file);
                      }}
                      disabled={ocrScanning}
                    />
                  </div>
                </div>

                {ocrScanning && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-2 text-sm text-green-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <span>Memproses dokumen...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show entity-specific inline form if supplier, consignee, or shipper is selected */}
            {showEntityForm && (
              <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 border-b pb-2">
                  {showEntityForm === "supplier" && "Supplier Information"}
                  {showEntityForm === "consignee" && "Consignee Information"}
                  {showEntityForm === "shipper" && "Shipper Information"}
                </h3>

                {/* Entity Name */}
                <div className="space-y-2">
                  <Label htmlFor="entity-name-mobile" className="text-sm">
                    {showEntityForm === "supplier" && "Supplier Name *"}
                    {showEntityForm === "consignee" && "Consignee Name *"}
                    {showEntityForm === "shipper" && "Shipper Name *"}
                  </Label>
                  <Input
                    id="entity-name-mobile"
                    type="text"
                    placeholder={`PT. ${showEntityForm.charAt(0).toUpperCase() + showEntityForm.slice(1)} Indonesia`}
                    value={entityFormData.entity_name}
                    onChange={(e) =>
                      setEntityFormData({
                        ...entityFormData,
                        entity_name: e.target.value,
                      })
                    }
                    required
                    className="bg-slate-50"
                  />
                </div>

                {/* Contact Person & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-person-mobile" className="text-sm">
                      Contact Person *
                    </Label>
                    <Input
                      id="contact-person-mobile"
                      type="text"
                      placeholder="John Doe"
                      value={entityFormData.contact_person}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          contact_person: e.target.value,
                        })
                      }
                      required
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-mobile" className="text-sm">
                      Phone *
                    </Label>
                    <Input
                      id="phone-mobile"
                      type="tel"
                      placeholder="+62 812 3456 7890"
                      value={entityFormData.phone_number}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          phone_number: e.target.value,
                        })
                      }
                      required
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="entity-email-mobile" className="text-sm">
                    Email *
                  </Label>
                  <Input
                    id="entity-email-mobile"
                    type="email"
                    placeholder={`${showEntityForm}@example.com`}
                    value={entityFormData.email}
                    onChange={(e) =>
                      setEntityFormData({
                        ...entityFormData,
                        email: e.target.value,
                      })
                    }
                    required
                    className="bg-slate-50"
                  />
                </div>

                {/* City & Country */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="city-mobile" className="text-sm">
                      City
                    </Label>
                    <Input
                      id="city-mobile"
                      type="text"
                      placeholder="Jakarta"
                      value={entityFormData.city}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          city: e.target.value,
                        })
                      }
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country-mobile" className="text-sm">
                      Country
                    </Label>
                    <Input
                      id="country-mobile"
                      type="text"
                      placeholder="Indonesia"
                      value={entityFormData.country}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          country: e.target.value,
                        })
                      }
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address-mobile" className="text-sm">
                    Address
                  </Label>
                  <Input
                    id="address-mobile"
                    type="text"
                    placeholder="Jl. Sudirman No. 123"
                    value={entityFormData.address}
                    onChange={(e) =>
                      setEntityFormData({
                        ...entityFormData,
                        address: e.target.value,
                      })
                    }
                    className="bg-slate-50"
                  />
                </div>

                {/* Tax Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="is-pkp-mobile" className="text-sm">
                      PKP Status
                    </Label>
                    <Select
                      value={entityFormData.is_pkp}
                      onValueChange={(value) =>
                        setEntityFormData({
                          ...entityFormData,
                          is_pkp: value,
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-50">
                        <SelectValue placeholder="Select PKP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKP">PKP</SelectItem>
                        <SelectItem value="NON-PKP">NON-PKP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-id-mobile" className="text-sm">
                      Tax ID (NPWP)
                    </Label>
                    <Input
                      id="tax-id-mobile"
                      type="text"
                      placeholder="00.000.000.0-000.000"
                      value={entityFormData.tax_id}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          tax_id: e.target.value,
                        })
                      }
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                {/* Bank Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name-mobile" className="text-sm">
                      Bank Name
                    </Label>
                    <Input
                      id="bank-name-mobile"
                      type="text"
                      placeholder="Bank BCA"
                      value={entityFormData.bank_name}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          bank_name: e.target.value,
                        })
                      }
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-holder-mobile" className="text-sm">
                      Account Holder
                    </Label>
                    <Input
                      id="bank-holder-mobile"
                      type="text"
                      placeholder="PT. Company Name"
                      value={entityFormData.bank_account_holder}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          bank_account_holder: e.target.value,
                        })
                      }
                      className="bg-slate-50"
                    />
                  </div>
                </div>

                {/* Category & Payment Terms */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-mobile" className="text-sm">
                      Category
                    </Label>
                    <Input
                      id="category-mobile"
                      type="text"
                      placeholder="GOODS"
                      value={entityFormData.category}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          category: e.target.value,
                        })
                      }
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-terms-mobile" className="text-sm">
                      Payment Terms
                    </Label>
                    <Input
                      id="payment-terms-mobile"
                      type="text"
                      placeholder="NET 30"
                      value={entityFormData.payment_terms}
                      onChange={(e) =>
                        setEntityFormData({
                          ...entityFormData,
                          payment_terms: e.target.value,
                        })
                      }
                      className="bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Credentials */}
            {!showEntityForm && (
              <>
                {/* Account Credentials */}
                <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-medium text-slate-700 border-b pb-2">
                    Account Credentials
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">
                      Email *
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={(e) =>
                        setSignUpData({ ...signUpData, email: e.target.value })
                      }
                      required
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpData.password}
                        onChange={(e) =>
                          setSignUpData({
                            ...signUpData,
                            password: e.target.value,
                          })
                        }
                        required
                        className="bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowSignUpPassword(!showSignUpPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-gray-700 transition-colors"
                      >
                        {showSignUpPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* OCR Scan Summary - Shows all completed scans */}
                {Object.keys(ocrResults).some(
                  (key) => ocrResults[key]?.success,
                ) && (
                  <div className="space-y-2 bg-green-50 p-3 rounded-lg border border-green-200">
                    <h3 className="text-sm font-medium text-green-700 border-b border-green-200 pb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Dokumen Berhasil Di-Scan
                    </h3>
                    <div className="space-y-1 text-xs">
                      {ocrResults.ktp?.success && (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 size={14} />
                          <span className="font-medium">KTP:</span>
                          <span>
                            {signUpData.ktpNumber || "Data tersimpan"}
                          </span>
                        </div>
                      )}
                      {ocrResults.kk?.success && (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 size={14} />
                          <span className="font-medium">Kartu Keluarga:</span>
                          <span>
                            {signUpData.familyCardNumber || "Data tersimpan"}
                          </span>
                        </div>
                      )}
                      {ocrResults.ijazah?.success && (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 size={14} />
                          <span className="font-medium">Ijazah:</span>
                          <span>Data tersimpan</span>
                        </div>
                      )}
                      {ocrResults.sim?.success && (
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 size={14} />
                          <span className="font-medium">SIM:</span>
                          <span>
                            {signUpData.licenseNumber || "Data tersimpan"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dynamic OCR Fields */}
                {dynamicFields.length > 0 && (
                  <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-700 border-b border-blue-200 pb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Data Dokumen (Auto-Extracted) - {
                        dynamicFields.length
                      }{" "}
                      fields
                    </h3>
                    <p className="text-xs text-blue-600 mb-2">
                      ✓ Semua field dapat diedit. Data akan tersimpan sampai
                      Submit.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {dynamicFields.map((field) => {
                        const meta = signUpMeta[field.name];
                        const isUserEdited = meta?.source === "user";
                        const docType = meta?.document_type || "";

                        return (
                          <div
                            key={field.name}
                            className={`space-y-2 ${field.type === "json" || field.type === "jsonb" ? "col-span-2" : ""}`}
                          >
                            <Label
                              htmlFor={`dynamic-${field.name}`}
                              className="text-sm flex items-center gap-1 flex-wrap"
                            >
                              {field.label}
                              {/* Source Badge */}
                              {isUserEdited ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                                  [U]
                                </span>
                              ) : docType ? (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    docType === "KTP"
                                      ? "bg-green-100 text-green-700"
                                      : docType === "KK"
                                        ? "bg-orange-100 text-orange-700"
                                        : docType === "IJAZAH"
                                          ? "bg-blue-100 text-blue-700"
                                          : docType === "STNK"
                                            ? "bg-red-100 text-red-700"
                                            : docType === "SIM"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : docType === "NPWP"
                                                ? "bg-indigo-100 text-indigo-700"
                                                : docType === "AWB"
                                                  ? "bg-cyan-100 text-cyan-700"
                                                  : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  [{docType}]
                                </span>
                              ) : (
                                <span className="text-xs text-blue-500">
                                  (editable)
                                </span>
                              )}
                            </Label>
                            {field.type === "json" || field.type === "jsonb" ? (
                              <div className="bg-white border border-blue-200 rounded-md p-2 max-h-40 overflow-auto">
                                <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                                  {JSON.stringify(
                                    signUpData[
                                      field.name as keyof typeof signUpData
                                    ] ?? field.value,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            ) : (
                              <Input
                                id={`dynamic-${field.name}`}
                                type={field.type || "text"}
                                placeholder={field.label || field.name}
                                value={
                                  signUpData[
                                    field.name as keyof typeof signUpData
                                  ] ??
                                  field.value ??
                                  ""
                                }
                                onChange={(e) => {
                                  setSignUpData({
                                    ...signUpData,
                                    [field.name]: e.target.value,
                                  });
                                  // Mark as user-edited when user changes the value
                                  setSignUpMeta((prev) => ({
                                    ...prev,
                                    [field.name]: {
                                      source: "user",
                                      document_type:
                                        prev[field.name]?.document_type || "",
                                      confidence: 1.0,
                                      last_updated_at: new Date().toISOString(),
                                    },
                                  }));
                                }}
                                className={`bg-white ${isUserEdited ? "border-purple-300" : "border-blue-200"}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Workflow Suggestions */}
                {workflowSuggestions.length > 0 && (
                  <div className="space-y-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h3 className="text-sm font-medium text-amber-700 border-b border-amber-200 pb-2 flex items-center gap-2">
                      <span>💡</span>
                      Workflow Suggestions ({workflowSuggestions.length})
                    </h3>
                    <p className="text-xs text-amber-600 mb-2">
                      Berdasarkan dokumen yang sudah di-scan, Anda dapat
                      melakukan:
                    </p>
                    <div className="space-y-2">
                      {workflowSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-white rounded border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
                          onClick={() => {
                            console.log("Workflow triggered:", suggestion.type);
                            // TODO: Implement workflow routing
                          }}
                        >
                          <span className="text-lg">
                            {suggestion.icon || "📋"}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700">
                              {suggestion.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              Dokumen:{" "}
                              {suggestion.document_types_required.join(" + ")}
                            </p>
                          </div>
                          <span className="text-amber-500">→</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vehicle Information - Only for Driver Mitra */}
                {signUpData.roleEntity === "driver_mitra" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-4">
                        Informasi Kendaraan
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-vehicle-brand" className="text-sm">
                        Merk Kendaraan *
                      </Label>
                      <Input
                        id="signup-vehicle-brand"
                        type="text"
                        placeholder="Misal: Toyota"
                        value={signUpData.vehicleBrand}
                        onChange={(e) =>
                          setSignUpData({
                            ...signUpData,
                            vehicleBrand: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-vehicle-model" className="text-sm">
                        Model Kendaraan *
                      </Label>
                      <Input
                        id="signup-vehicle-model"
                        type="text"
                        placeholder="Misal: Avanza"
                        value={signUpData.vehicleModel}
                        onChange={(e) =>
                          setSignUpData({
                            ...signUpData,
                            vehicleModel: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-plate-number" className="text-sm">
                        Plate Number *
                      </Label>
                      <Input
                        id="signup-plate-number"
                        type="text"
                        placeholder="B 1234 XYZ"
                        value={signUpData.plateNumber}
                        onChange={(e) =>
                          setSignUpData({
                            ...signUpData,
                            plateNumber: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-vehicle-year" className="text-sm">
                        Tahun Kendaraan *
                      </Label>
                      <Input
                        id="signup-vehicle-year"
                        type="text"
                        placeholder="2020"
                        value={signUpData.vehicleYear}
                        onChange={(e) =>
                          setSignUpData({
                            ...signUpData,
                            vehicleYear: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-vehicle-color" className="text-sm">
                        Warna Kendaraan *
                      </Label>
                      <Input
                        id="signup-vehicle-color"
                        type="text"
                        placeholder="Hitam"
                        value={signUpData.vehicleColor}
                        onChange={(e) =>
                          setSignUpData({
                            ...signUpData,
                            vehicleColor: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                  </div>
                )}

                {/* Upload Documents - For Karyawan, Driver Perusahaan, Driver Mitra entities */}
                {(signUpData.roleEntity === "karyawan" ||
                  signUpData.roleEntity === "driver_perusahaan" ||
                  signUpData.roleEntity === "driver_mitra") && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 border-b border-blue-200 pb-2">
                      Upload Dokumen Karyawan
                    </h3>
                    <div className="space-y-3">
                      {/* STNK and Vehicle Photo - Only for Driver Mitra */}
                      {signUpData.roleEntity === "driver_mitra" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="upload-stnk" className="text-sm">
                              Foto STNK *
                            </Label>
                            <Input
                              id="upload-stnk"
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) =>
                                setSignUpData({
                                  ...signUpData,
                                  stnkDocument: e.target.files?.[0] || null,
                                })
                              }
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="upload-vehicle-photo"
                              className="text-sm"
                            >
                              Foto Kendaraan *
                            </Label>
                            <Input
                              id="upload-vehicle-photo"
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setSignUpData({
                                  ...signUpData,
                                  vehiclePhoto: e.target.files?.[0] || null,
                                })
                              }
                              className="bg-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="pt-2 sticky bottom-0 bg-white border-t">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    );
  }

  // Original full-page render
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>User Roles Management</CardTitle>
          <CardDescription>
            Sign in to manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signInData.email}
                    onChange={(e) =>
                      setSignInData({ ...signInData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInData.password}
                    onChange={(e) =>
                      setSignInData({ ...signInData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form
                onSubmit={handleSignUp}
                className="space-y-5 max-h-[650px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
              >
                {/* Role */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <Label
                    htmlFor="signup-role"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Role *
                  </Label>
                  <Select
                    value={signUpData.roleName}
                    onValueChange={(value) => {
                      const foundRole = roles.find(
                        (r) => r.role_name === value,
                      );
                      setSelectedRole(foundRole || null);
                      setSignUpData({
                        ...signUpData,
                        roleName: value,
                        roleEntity: foundRole?.entity || "",
                      });
                      // Check if role is supplier, consignee, or shipper
                      const lowerRole = value.toLowerCase();
                      if (lowerRole.includes("supplier")) {
                        setShowEntityForm("supplier");
                      } else if (lowerRole.includes("consignee")) {
                        setShowEntityForm("consignee");
                      } else if (lowerRole.includes("shipper")) {
                        setShowEntityForm("shipper");
                      } else {
                        setShowEntityForm(null);
                      }
                    }}
                  >
                    <SelectTrigger id="signup-role" className="bg-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles
                        .filter((role) => role.role_name)
                        .map((role) => (
                          <SelectItem key={role.id} value={role.role_name}>
                            {humanizeRole(role.role_name)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* OCR Document Scanner - Desktop */}
                {signUpData.roleName && !showEntityForm && (
                  <div className="space-y-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Scan className="w-5 h-5 text-green-600" />
                      <h3 className="text-sm font-semibold text-slate-700">
                        Scan Dokumen (Opsional)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">
                      Scan dokumen untuk mengisi data secara otomatis
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {/* KTP Scanner */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="ocr-ktp-desktop"
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span>KTP</span>
                            </span>
                            {ocrResults.ktp?.success && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </Label>
                        <Input
                          id="ocr-ktp-desktop"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOcrScan("ktp", file);
                          }}
                          disabled={ocrScanning}
                        />
                      </div>

                      {/* KK Scanner */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="ocr-kk-desktop"
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span>KK</span>
                            </span>
                            {ocrResults.kk?.success && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </Label>
                        <Input
                          id="ocr-kk-desktop"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOcrScan("kk", file);
                          }}
                          disabled={ocrScanning}
                        />
                      </div>

                      {/* Ijazah Scanner */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="ocr-ijazah-desktop"
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span>Ijazah</span>
                            </span>
                            {ocrResults.ijazah?.success && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </Label>
                        <Input
                          id="ocr-ijazah-desktop"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOcrScan("ijazah", file);
                          }}
                          disabled={ocrScanning}
                        />
                      </div>

                      {/* SIM Scanner */}
                      {(signUpData.roleEntity === "driver_perusahaan" ||
                        signUpData.roleEntity === "driver_mitra") && (
                        <div className="space-y-1">
                          <Label
                            htmlFor="ocr-sim-desktop"
                            className="text-xs cursor-pointer"
                          >
                            <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                              <span className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                <span>SIM</span>
                              </span>
                              {ocrResults.sim?.success && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </Label>
                          <Input
                            id="ocr-sim-desktop"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleOcrScan("sim", file);
                            }}
                            disabled={ocrScanning}
                          />
                        </div>
                      )}

                      {/* STNK Scanner */}
                      {signUpData.roleEntity === "driver_mitra" && (
                        <div className="space-y-1">
                          <Label
                            htmlFor="ocr-stnk-desktop"
                            className="text-xs cursor-pointer"
                          >
                            <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                              <span className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                <span>STNK</span>
                              </span>
                              {ocrResults.stnk?.success && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </Label>
                          <Input
                            id="ocr-stnk-desktop"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleOcrScan("stnk", file);
                            }}
                            disabled={ocrScanning}
                          />
                        </div>
                      )}

                      {/* SKCK Scanner */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="ocr-skck-desktop"
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span>SKCK</span>
                            </span>
                            {ocrResults.skck?.success && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </Label>
                        <Input
                          id="ocr-skck-desktop"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOcrScan("skck", file);
                          }}
                          disabled={ocrScanning}
                        />
                      </div>

                      {/* CV Scanner */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="ocr-cv-desktop"
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200 hover:border-green-400 transition-colors">
                            <span className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span>CV</span>
                            </span>
                            {ocrResults.cv?.success && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </Label>
                        <Input
                          id="ocr-cv-desktop"
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleOcrScan("cv", file);
                          }}
                          disabled={ocrScanning}
                        />
                      </div>
                    </div>

                    {ocrScanning && (
                      <div className="text-center py-2">
                        <div className="inline-flex items-center gap-2 text-sm text-green-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          <span>Memproses dokumen...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Show entity-specific inline form if supplier, consignee, or shipper is selected */}
                {showEntityForm && (
                  <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                      {showEntityForm === "supplier" && "Supplier Information"}
                      {showEntityForm === "consignee" &&
                        "Consignee Information"}
                      {showEntityForm === "shipper" && "Shipper Information"}
                    </h3>

                    {/* Entity Name */}
                    <div className="space-y-2">
                      <Label htmlFor="entity-name" className="text-sm">
                        {showEntityForm === "supplier" && "Supplier Name *"}
                        {showEntityForm === "consignee" && "Consignee Name *"}
                        {showEntityForm === "shipper" && "Shipper Name *"}
                      </Label>
                      <Input
                        id="entity-name"
                        type="text"
                        placeholder={`PT. ${showEntityForm.charAt(0).toUpperCase() + showEntityForm.slice(1)} Indonesia`}
                        value={entityFormData.entity_name}
                        onChange={(e) =>
                          setEntityFormData({
                            ...entityFormData,
                            entity_name: e.target.value,
                          })
                        }
                        required
                        className="bg-slate-50"
                      />
                    </div>

                    {/* Contact Person & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="contact-person" className="text-sm">
                          Contact Person *
                        </Label>
                        <Input
                          id="contact-person"
                          type="text"
                          placeholder="John Doe"
                          value={entityFormData.contact_person}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              contact_person: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm">
                          Phone *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+62 812 3456 7890"
                          value={entityFormData.phone_number}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              phone_number: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="entity-email" className="text-sm">
                        Email *
                      </Label>
                      <Input
                        id="entity-email"
                        type="email"
                        placeholder={`${showEntityForm}@example.com`}
                        value={entityFormData.email}
                        onChange={(e) =>
                          setEntityFormData({
                            ...entityFormData,
                            email: e.target.value,
                          })
                        }
                        required
                        className="bg-slate-50"
                      />
                    </div>

                    {/* City & Country */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm">
                          City
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="Jakarta"
                          value={entityFormData.city}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              city: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm">
                          Country
                        </Label>
                        <Input
                          id="country"
                          type="text"
                          placeholder="Indonesia"
                          value={entityFormData.country}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              country: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm">
                        Address
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Jl. Sudirman No. 123"
                        value={entityFormData.address}
                        onChange={(e) =>
                          setEntityFormData({
                            ...entityFormData,
                            address: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>

                    {/* Tax Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="is-pkp" className="text-sm">
                          PKP Status
                        </Label>
                        <Select
                          value={entityFormData.is_pkp}
                          onValueChange={(value) =>
                            setEntityFormData({
                              ...entityFormData,
                              is_pkp: value,
                            })
                          }
                        >
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue placeholder="Select PKP Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PKP">PKP</SelectItem>
                            <SelectItem value="NON-PKP">NON-PKP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax-id" className="text-sm">
                          Tax ID (NPWP)
                        </Label>
                        <Input
                          id="tax-id"
                          type="text"
                          placeholder="00.000.000.0-000.000"
                          value={entityFormData.tax_id}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              tax_id: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Bank Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="bank-name" className="text-sm">
                          Bank Name
                        </Label>
                        <Input
                          id="bank-name"
                          type="text"
                          placeholder="Bank BCA"
                          value={entityFormData.bank_name}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              bank_name: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank-holder" className="text-sm">
                          Account Holder
                        </Label>
                        <Input
                          id="bank-holder"
                          type="text"
                          placeholder="PT. Company Name"
                          value={entityFormData.bank_account_holder}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              bank_account_holder: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Category & Payment Terms */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm">
                          Category
                        </Label>
                        <Input
                          id="category"
                          type="text"
                          placeholder="GOODS"
                          value={entityFormData.category}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              category: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-terms" className="text-sm">
                          Payment Terms
                        </Label>
                        <Input
                          id="payment-terms"
                          type="text"
                          placeholder="NET 30"
                          value={entityFormData.payment_terms}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              payment_terms: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Documents - For Karyawan, Driver Perusahaan, Driver Mitra entities */}
                {(signUpData.roleEntity === "karyawan" ||
                  signUpData.roleEntity === "driver_perusahaan" ||
                  signUpData.roleEntity === "driver_mitra") && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 border-b border-blue-200 pb-2">
                      Upload Dokumen Karyawan
                    </h3>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="upload-ktp" className="text-sm">
                          KTP *
                        </Label>
                        <Input
                          id="upload-ktp"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              ktpDocument: e.target.files?.[0] || null,
                            })
                          }
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upload-selfie" className="text-sm">
                          Foto Selfie *
                        </Label>
                        <Input
                          id="upload-selfie"
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              selfiePhoto: e.target.files?.[0] || null,
                            })
                          }
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="Ijasah" className="text-sm">
                          Ijasah *
                        </Label>
                        <Input
                          id="ijasah"
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              uploadIjasah: e.target.files?.[0] || null,
                            })
                          }
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upload-family-card" className="text-sm">
                          Kartu Keluarga *
                        </Label>
                        <Input
                          id="upload-family-card"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              familyCard: e.target.files?.[0] || null,
                            })
                          }
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upload-sim" className="text-sm">
                          SIM
                        </Label>
                        <Input
                          id="upload-sim"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              simDocument: e.target.files?.[0] || null,
                            })
                          }
                          className="bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upload-skck" className="text-sm">
                          SKCK
                        </Label>
                        <Input
                          id="upload-skck"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              skckDocument: e.target.files?.[0] || null,
                            })
                          }
                          className="bg-white"
                        />
                      </div>

                      {/* STNK and Vehicle Photo - Only for Driver Mitra */}
                      {signUpData.roleEntity === "driver_mitra" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="upload-stnk" className="text-sm">
                              Foto STNK *
                            </Label>
                            <Input
                              id="upload-stnk"
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) =>
                                setSignUpData({
                                  ...signUpData,
                                  stnkDocument: e.target.files?.[0] || null,
                                })
                              }
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="upload-vehicle-photo"
                              className="text-sm"
                            >
                              Foto Kendaraan *
                            </Label>
                            <Input
                              id="upload-vehicle-photo"
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setSignUpData({
                                  ...signUpData,
                                  vehiclePhoto: e.target.files?.[0] || null,
                                })
                              }
                              className="bg-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Conditional Forms Based on Role - Only show if NOT supplier/consignee/shipper */}
                {!showEntityForm && signUpData.roleName === "supplier" ? (
                  // Supplier Form
                  <>
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                        Supplier Information
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="entity-name" className="text-sm">
                          Supplier Name *
                        </Label>
                        <Input
                          id="entity-name"
                          type="text"
                          placeholder="PT. Supplier Indonesia"
                          value={entityFormData.entity_name}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              entity_name: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="contact-person" className="text-sm">
                            Contact Person *
                          </Label>
                          <Input
                            id="contact-person"
                            type="text"
                            placeholder="John Doe"
                            value={entityFormData.contact_person}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                contact_person: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">
                            Phone *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+62 812 3456 7890"
                            value={entityFormData.phone_number}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                phone_number: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="entity-email" className="text-sm">
                          Email *
                        </Label>
                        <Input
                          id="entity-email"
                          type="email"
                          placeholder="supplier@example.com"
                          value={entityFormData.email}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              email: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="Jakarta"
                            value={entityFormData.city}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                city: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm">
                            Country
                          </Label>
                          <Input
                            id="country"
                            type="text"
                            placeholder="Indonesia"
                            value={entityFormData.country}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                country: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm">
                          Address
                        </Label>
                        <Textarea
                          id="address"
                          placeholder="Jl. Contoh No. 123"
                          value={entityFormData.address}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              address: e.target.value,
                            })
                          }
                          rows={3}
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="is-pkp" className="text-sm">
                            PKP
                          </Label>
                          <Select
                            value={entityFormData.is_pkp}
                            onValueChange={(value) =>
                              setEntityFormData({
                                ...entityFormData,
                                is_pkp: value,
                              })
                            }
                          >
                            <SelectTrigger className="bg-slate-50">
                              <SelectValue placeholder="Pilih status PKP" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PKP">PKP</SelectItem>
                              <SelectItem value="Non PKP">Non PKP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tax-id" className="text-sm">
                            Tax ID / No. PKP
                          </Label>
                          <Input
                            id="tax-id"
                            type="text"
                            placeholder="01.234.567.8-901.000"
                            value={entityFormData.tax_id}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                tax_id: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="bank-name" className="text-sm">
                            Bank Name
                          </Label>
                          <Input
                            id="bank-name"
                            type="text"
                            placeholder="Bank BCA"
                            value={entityFormData.bank_name}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                bank_name: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-holder" className="text-sm">
                            Account Holder
                          </Label>
                          <Input
                            id="bank-holder"
                            type="text"
                            placeholder="PT. Supplier Indonesia"
                            value={entityFormData.bank_account_holder}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                bank_account_holder: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-sm">
                            Category
                          </Label>
                          <Input
                            id="category"
                            type="text"
                            placeholder="GOODS"
                            value={entityFormData.category}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                category: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment-terms" className="text-sm">
                            Payment Terms
                          </Label>
                          <Input
                            id="payment-terms"
                            type="text"
                            placeholder="NET 30"
                            value={entityFormData.payment_terms}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                payment_terms: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : signUpData.roleName === "consignee" ? (
                  // Consignee Form
                  <>
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                        Consignee Information
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="entity-name" className="text-sm">
                          Consignee Name *
                        </Label>
                        <Input
                          id="entity-name"
                          type="text"
                          placeholder="PT. Consignee Indonesia"
                          value={entityFormData.entity_name}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              entity_name: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="contact-person" className="text-sm">
                            Contact Person *
                          </Label>
                          <Input
                            id="contact-person"
                            type="text"
                            placeholder="John Doe"
                            value={entityFormData.contact_person}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                contact_person: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">
                            Phone *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+62 812 3456 7890"
                            value={entityFormData.phone_number}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                phone_number: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="entity-email" className="text-sm">
                          Email *
                        </Label>
                        <Input
                          id="entity-email"
                          type="email"
                          placeholder="consignee@example.com"
                          value={entityFormData.email}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              email: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="Jakarta"
                            value={entityFormData.city}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                city: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm">
                            Country
                          </Label>
                          <Input
                            id="country"
                            type="text"
                            placeholder="Indonesia"
                            value={entityFormData.country}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                country: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm">
                          Address
                        </Label>
                        <Textarea
                          id="address"
                          placeholder="Jl. Contoh No. 123"
                          value={entityFormData.address}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              address: e.target.value,
                            })
                          }
                          rows={3}
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="is-pkp" className="text-sm">
                            PKP
                          </Label>
                          <Select
                            value={entityFormData.is_pkp}
                            onValueChange={(value) =>
                              setEntityFormData({
                                ...entityFormData,
                                is_pkp: value,
                              })
                            }
                          >
                            <SelectTrigger className="bg-slate-50">
                              <SelectValue placeholder="Pilih status PKP" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PKP">PKP</SelectItem>
                              <SelectItem value="Non PKP">Non PKP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tax-id" className="text-sm">
                            Tax ID / No. PKP
                          </Label>
                          <Input
                            id="tax-id"
                            type="text"
                            placeholder="01.234.567.8-901.000"
                            value={entityFormData.tax_id}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                tax_id: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="bank-name" className="text-sm">
                            Bank Name
                          </Label>
                          <Input
                            id="bank-name"
                            type="text"
                            placeholder="Bank BCA"
                            value={entityFormData.bank_name}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                bank_name: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-holder" className="text-sm">
                            Account Holder
                          </Label>
                          <Input
                            id="bank-holder"
                            type="text"
                            placeholder="PT. Consignee Indonesia"
                            value={entityFormData.bank_account_holder}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                bank_account_holder: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-sm">
                            Category
                          </Label>
                          <Input
                            id="category"
                            type="text"
                            placeholder="GOODS"
                            value={entityFormData.category}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                category: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment-terms" className="text-sm">
                            Payment Terms
                          </Label>
                          <Input
                            id="payment-terms"
                            type="text"
                            placeholder="NET 30"
                            value={entityFormData.payment_terms}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                payment_terms: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : signUpData.roleName === "shipper" ? (
                  // Shipper Form
                  <>
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                        Shipper Information
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="entity-name" className="text-sm">
                          Shipper Name *
                        </Label>
                        <Input
                          id="entity-name"
                          type="text"
                          placeholder="PT. Shipper Indonesia"
                          value={entityFormData.entity_name}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              entity_name: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="contact-person" className="text-sm">
                            Contact Person *
                          </Label>
                          <Input
                            id="contact-person"
                            type="text"
                            placeholder="John Doe"
                            value={entityFormData.contact_person}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                contact_person: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm">
                            Phone *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+62 812 3456 7890"
                            value={entityFormData.phone_number}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                phone_number: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="entity-email" className="text-sm">
                          Email *
                        </Label>
                        <Input
                          id="entity-email"
                          type="email"
                          placeholder="shipper@example.com"
                          value={entityFormData.email}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              email: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="Jakarta"
                            value={entityFormData.city}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                city: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm">
                            Country
                          </Label>
                          <Input
                            id="country"
                            type="text"
                            placeholder="Indonesia"
                            value={entityFormData.country}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                country: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm">
                          Address
                        </Label>
                        <Textarea
                          id="address"
                          placeholder="Jl. Contoh No. 123"
                          value={entityFormData.address}
                          onChange={(e) =>
                            setEntityFormData({
                              ...entityFormData,
                              address: e.target.value,
                            })
                          }
                          rows={3}
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="is-pkp" className="text-sm">
                            PKP
                          </Label>
                          <Select
                            value={entityFormData.is_pkp}
                            onValueChange={(value) =>
                              setEntityFormData({
                                ...entityFormData,
                                is_pkp: value,
                              })
                            }
                          >
                            <SelectTrigger className="bg-slate-50">
                              <SelectValue placeholder="Pilih status PKP" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PKP">PKP</SelectItem>
                              <SelectItem value="Non PKP">Non PKP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tax-id" className="text-sm">
                            Tax ID / No. PKP
                          </Label>
                          <Input
                            id="tax-id"
                            type="text"
                            placeholder="01.234.567.8-901.000"
                            value={entityFormData.tax_id}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                tax_id: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="bank-name" className="text-sm">
                            Bank Name
                          </Label>
                          <Input
                            id="bank-name"
                            type="text"
                            placeholder="Bank BCA"
                            value={entityFormData.bank_name}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                bank_name: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-holder" className="text-sm">
                            Account Holder
                          </Label>
                          <Input
                            id="bank-holder"
                            type="text"
                            placeholder="PT. Shipper Indonesia"
                            value={entityFormData.bank_account_holder}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                bank_account_holder: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-sm">
                            Category
                          </Label>
                          <Input
                            id="category"
                            type="text"
                            placeholder="GOODS"
                            value={entityFormData.category}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                category: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment-terms" className="text-sm">
                            Payment Terms
                          </Label>
                          <Input
                            id="payment-terms"
                            type="text"
                            placeholder="NET 30"
                            value={entityFormData.payment_terms}
                            onChange={(e) =>
                              setEntityFormData({
                                ...entityFormData,
                                payment_terms: e.target.value,
                              })
                            }
                            className="bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Default Form for other roles
                  <>
                    {/* Personal Information Section */}
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                        Personal Information
                      </h3>

                      {/* Name Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="signup-firstname" className="text-sm">
                            First Name *
                          </Label>
                          <Input
                            id="signup-firstname"
                            type="text"
                            placeholder="John"
                            value={signUpData.firstName}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                firstName: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-lastname" className="text-sm">
                            Last Name *
                          </Label>
                          <Input
                            id="signup-lastname"
                            type="text"
                            placeholder="Doe"
                            value={signUpData.lastName}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                lastName: e.target.value,
                              })
                            }
                            required
                            className="bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-fullname" className="text-sm">
                          Full Name *
                        </Label>
                        <Input
                          id="signup-fullname"
                          type="text"
                          placeholder="John Doe"
                          value={signUpData.fullName}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              fullName: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Account Credentials Section */}
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                        Account Credentials
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm">
                          Email *
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signUpData.email}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              email: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm">
                          Password *
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={signUpData.password}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              password: e.target.value,
                            })
                          }
                          required
                          className="bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* OCR Scan Summary - Desktop - Shows all completed scans */}
                    {Object.keys(ocrResults).some(
                      (key) => ocrResults[key]?.success,
                    ) && (
                      <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="text-sm font-semibold text-green-700 border-b border-green-200 pb-2 flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          Dokumen Berhasil Di-Scan
                        </h3>
                        <div className="space-y-2 text-sm">
                          {ocrResults.ktp?.success && (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 size={16} />
                              <span className="font-medium">KTP:</span>
                              <span>
                                {signUpData.ktpNumber || "Data tersimpan"}
                              </span>
                            </div>
                          )}
                          {ocrResults.kk?.success && (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 size={16} />
                              <span className="font-medium">
                                Kartu Keluarga:
                              </span>
                              <span>
                                {signUpData.familyCardNumber ||
                                  "Data tersimpan"}
                              </span>
                            </div>
                          )}
                          {ocrResults.ijazah?.success && (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 size={16} />
                              <span className="font-medium">Ijazah:</span>
                              <span>Data tersimpan</span>
                            </div>
                          )}
                          {ocrResults.sim?.success && (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle2 size={16} />
                              <span className="font-medium">SIM:</span>
                              <span>
                                {signUpData.licenseNumber || "Data tersimpan"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dynamic OCR Fields - Desktop */}
                    {dynamicFields.length > 0 && (
                      <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-blue-700 border-b border-blue-200 pb-2 flex items-center gap-2">
                          <CheckCircle2 size={16} />
                          Data Dokumen (Auto-Extracted) - {
                            dynamicFields.length
                          }{" "}
                          fields
                        </h3>
                        <p className="text-xs text-blue-600 mb-2">
                          ✓ Semua field dapat diedit. Data akan tersimpan sampai
                          Submit.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {dynamicFields.map((field) => {
                            const meta = signUpMeta[field.name];
                            const isUserEdited = meta?.source === "user";
                            const docType = meta?.document_type || "";

                            return (
                              <div
                                key={field.name}
                                className={`space-y-2 ${field.type === "json" || field.type === "jsonb" ? "col-span-2" : ""}`}
                              >
                                <Label
                                  htmlFor={`dynamic-desktop-${field.name}`}
                                  className="text-sm flex items-center gap-1 flex-wrap"
                                >
                                  {field.label}
                                  {/* Source Badge */}
                                  {isUserEdited ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                                      [U]
                                    </span>
                                  ) : docType ? (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                        docType === "KTP"
                                          ? "bg-green-100 text-green-700"
                                          : docType === "KK"
                                            ? "bg-orange-100 text-orange-700"
                                            : docType === "IJAZAH"
                                              ? "bg-blue-100 text-blue-700"
                                              : docType === "STNK"
                                                ? "bg-red-100 text-red-700"
                                                : docType === "SIM"
                                                  ? "bg-yellow-100 text-yellow-700"
                                                  : docType === "NPWP"
                                                    ? "bg-indigo-100 text-indigo-700"
                                                    : docType === "AWB"
                                                      ? "bg-cyan-100 text-cyan-700"
                                                      : "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      [{docType}]
                                    </span>
                                  ) : (
                                    <span className="text-xs text-blue-500">
                                      (editable)
                                    </span>
                                  )}
                                </Label>
                                {field.type === "json" ||
                                field.type === "jsonb" ? (
                                  <div className="bg-white border border-blue-200 rounded-md p-2 max-h-48 overflow-auto">
                                    <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                                      {JSON.stringify(
                                        signUpData[
                                          field.name as keyof typeof signUpData
                                        ] ?? field.value,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                ) : (
                                  <Input
                                    id={`dynamic-desktop-${field.name}`}
                                    type={field.type || "text"}
                                    placeholder={field.label || field.name}
                                    value={
                                      signUpData[
                                        field.name as keyof typeof signUpData
                                      ] ??
                                      field.value ??
                                      ""
                                    }
                                    onChange={(e) => {
                                      setSignUpData({
                                        ...signUpData,
                                        [field.name]: e.target.value,
                                      });
                                      // Mark as user-edited when user changes the value
                                      setSignUpMeta((prev) => ({
                                        ...prev,
                                        [field.name]: {
                                          source: "user",
                                          document_type:
                                            prev[field.name]?.document_type ||
                                            "",
                                          confidence: 1.0,
                                          last_updated_at:
                                            new Date().toISOString(),
                                        },
                                      }));
                                    }}
                                    className={`bg-white ${isUserEdited ? "border-purple-300" : "border-blue-200"}`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Workflow Suggestions - Desktop */}
                    {workflowSuggestions.length > 0 && (
                      <div className="space-y-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="text-sm font-semibold text-amber-700 border-b border-amber-200 pb-2 flex items-center gap-2">
                          <span>💡</span>
                          Workflow Suggestions ({workflowSuggestions.length})
                        </h3>
                        <p className="text-xs text-amber-600 mb-2">
                          Berdasarkan dokumen yang sudah di-scan, Anda dapat
                          melakukan:
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {workflowSuggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
                              onClick={() => {
                                console.log(
                                  "Workflow triggered:",
                                  suggestion.type,
                                );
                                // TODO: Implement workflow routing
                              }}
                            >
                              <span className="text-2xl">
                                {suggestion.icon || "📋"}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700">
                                  {suggestion.label}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Dokumen:{" "}
                                  {suggestion.document_types_required.join(
                                    " + ",
                                  )}
                                </p>
                              </div>
                              <span className="text-amber-500 text-lg">→</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact Section */}
                    <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                        Contact Information
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="text-sm">
                          Phone Number
                        </Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+62 812 3456 7890"
                          value={signUpData.phoneNumber}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              phoneNumber: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-license-number"
                          className="text-sm"
                        >
                          License Number
                        </Label>
                        <Input
                          id="signup-license-number"
                          type="text"
                          placeholder="1234567890"
                          value={signUpData.licenseNumber}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              licenseNumber: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-license-expiry"
                          className="text-sm"
                        >
                          SIM/License Expiry Date
                        </Label>
                        <Input
                          id="signup-license-expiry"
                          type="date"
                          value={signUpData.licenseExpiryDate}
                          onChange={(e) =>
                            setSignUpData({
                              ...signUpData,
                              licenseExpiryDate: e.target.value,
                            })
                          }
                          className="bg-slate-50"
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Default export for standalone page usage
export default function AuthForm() {
  return <AuthFormContent isDialog={false} />;
}
