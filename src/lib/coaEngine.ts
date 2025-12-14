// ====================================================
// COA ENGINE v1.0
// Modular, Expandable, and Supabase-Compatible
// ====================================================

import { supabase } from "@/lib/supabase";

// ------------------------------
// Utility Functions
// ------------------------------

// Normalize input (plat, lokasi, nama)
const clean = (str: string) => str.replace(/\s+/g, "").toUpperCase();

// Make unique suffix for account codes
const suffix = (str: string) => clean(str).slice(-4);

// Auto-check Supabase for duplicates
const existsInSupabase = async (account_code: string) => {
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("account_code")
    .eq("account_code", account_code)
    .maybeSingle();

  return !!data;
};

// Get next sequential number for account code prefix
const getNextSequentialNumber = async (prefix: string) => {
  const { data } = await supabase
    .from("chart_of_accounts")
    .select("account_code")
    .like("account_code", `${prefix}%`)
    .order("account_code", { ascending: false });

  if (!data || data.length === 0) {
    return `${prefix}001`;
  }

  // Find the highest number
  let maxNumber = 0;
  for (const row of data) {
    const numPart = row.account_code.replace(prefix, "").replace(/\D/g, "");
    const num = parseInt(numPart) || 0;
    if (num > maxNumber) {
      maxNumber = num;
    }
  }
  
  const nextNumber = maxNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
};

// Insert COA to Supabase (batch)
const insertCOA = async (coa: any[]) => {
  return await supabase.from("chart_of_accounts").insert(coa);
};

// Generate COA for individual items
export async function generateCOAForItem(itemName: string, itemCode: string) {
  const base = itemCode.replace(/[^A-Za-z0-9]/g, "");

  const accounts = [
    {
      account_code: `4-${base}`,
      account_name: `Pendapatan ${itemName}`,
      account_type: "Pendapatan",
      normal_balance: "Kredit",
      level: 3,
      parent_code: "4-0000"
    },
    {
      account_code: `5-${base}`,
      account_name: `HPP ${itemName}`,
      account_type: "Beban Pokok Penjualan",
      normal_balance: "Debit",
      level: 3,
      parent_code: "5-0000"
    },
    {
      account_code: `6-${base}1`,
      account_name: `Beban Komisi ${itemName}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      level: 3,
      parent_code: "6-0000"
    },
    {
      account_code: `6-${base}2`,
      account_name: `Beban Operasional ${itemName}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      level: 3,
      parent_code: "6-0000"
    }
  ];

  for (let acc of accounts) {
    await supabase.from("chart_of_accounts").insert(acc);
  }
}

// ------------------------------
// BASE BLUEPRINTS
// ------------------------------

// * Each blueprint returns an array of accounts to be created
// * They are registered in REGISTRY below

const blueprintVehicle = async (plate: string, type: string) => {
  const asetCode = await getNextSequentialNumber("1-2");
  const pendapatanCode = await getNextSequentialNumber("4-2");
  const hppCode = await getNextSequentialNumber("5-2");
  
  // Get sequential numbers for beban accounts
  const { data: existingBeban } = await supabase
    .from("chart_of_accounts")
    .select("account_code")
    .or("account_code.like.6-2%,account_code.like.6-3%,account_code.like.6-4%")
    .order("account_code", { ascending: false });
  
  let maxBebanNum = 0;
  if (existingBeban && existingBeban.length > 0) {
    for (const row of existingBeban) {
      const numPart = row.account_code.replace(/6-[234]/, "").replace(/\D/g, "");
      const num = parseInt(numPart) || 0;
      if (num > maxBebanNum) {
        maxBebanNum = num;
      }
    }
  }
  
  const bbmCode = `6-2${(maxBebanNum + 1).toString().padStart(3, "0")}`;
  const servisCode = `6-3${(maxBebanNum + 2).toString().padStart(3, "0")}`;
  const asuransiCode = `6-4${(maxBebanNum + 3).toString().padStart(3, "0")}`;
  const penyusutanCode = await getNextSequentialNumber("7-2");

  return [
    {
      account_code: asetCode,
      account_name: `Aset Kendaraan - ${plate}`,
      account_type: "Aset",
      normal_balance: "Debit",
      kategori_layanan: "Transportasi",
      jenis_layanan: "Aset Kendaraan",
      level: 2,
      parent_code: "1-0000",
      is_header: false,
      is_active: true,
      description: `Aset kendaraan jenis ${type} (${plate})`
    },
    {
      account_code: pendapatanCode,
      account_name: `Pendapatan Transportasi - ${plate}`,
      account_type: "Pendapatan",
      normal_balance: "Kredit",
      kategori_layanan: "Transportasi",
      jenis_layanan: "Pendapatan Kendaraan",
      level: 3,
      parent_code: "4-0000",
      is_header: false
    },
    {
      account_code: hppCode,
      account_name: `HPP Kendaraan - ${plate}`,
      account_type: "Beban Pokok Penjualan",
      normal_balance: "Debit",
      kategori_layanan: "Transportasi",
      jenis_layanan: "HPP Kendaraan",
      level: 3,
      parent_code: "5-0000"
    },
    {
      account_code: bbmCode,
      account_name: `BBM Kendaraan - ${plate}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Transportasi",
      jenis_layanan: "BBM Kendaraan",
      level: 3,
      parent_code: "6-0000"
    },
    {
      account_code: servisCode,
      account_name: `Servis Kendaraan - ${plate}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Transportasi",
      jenis_layanan: "Maintenance Kendaraan",
      level: 3,
      parent_code: "6-0000"
    },
    {
      account_code: asuransiCode,
      account_name: `Asuransi Kendaraan - ${plate}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Transportasi",
      jenis_layanan: "Asuransi Kendaraan",
      level: 3,
      parent_code: "6-0000"
    },
    {
      account_code: penyusutanCode,
      account_name: `Penyusutan Kendaraan - ${plate}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Transportasi",
      jenis_layanan: "Penyusutan Kendaraan",
      level: 3,
      parent_code: "7-0000"
    }
  ];
};

const blueprintSPKLU = async (location: string) => {
  const asetCode = await getNextSequentialNumber("1-3");
  const pendapatanCode = await getNextSequentialNumber("4-3");
  const hppCode = await getNextSequentialNumber("5-3");
  const bebanCode = await getNextSequentialNumber("6-3");
  const penyusutanCode = await getNextSequentialNumber("7-3");

  return [
    {
      account_code: asetCode,
      account_name: `Aset SPKLU - ${location}`,
      account_type: "Aset",
      normal_balance: "Debit",
      kategori_layanan: "SPKLU",
      jenis_layanan: "Aset SPKLU",
      level: 2,
      parent_code: "1-0000",
      is_header: false,
      is_active: true,
      description: `Aset SPKLU lokasi ${location}`
    },
    {
      account_code: pendapatanCode,
      account_name: `Pendapatan Charging - ${location}`,
      account_type: "Pendapatan",
      normal_balance: "Kredit",
      kategori_layanan: "SPKLU",
      jenis_layanan: "Pendapatan Charging",
      level: 3,
      parent_code: "4-0000",
      is_header: false,
      is_active: true,
      description: `Pendapatan dari charging SPKLU ${location}`
    },
    {
      account_code: hppCode,
      account_name: `HPP Charging - ${location}`,
      account_type: "Beban Pokok Penjualan",
      normal_balance: "Debit",
      kategori_layanan: "SPKLU",
      jenis_layanan: "HPP Charging",
      level: 3,
      parent_code: "5-0000",
      is_header: false,
      is_active: true,
      description: `HPP charging SPKLU ${location}`
    },
    {
      account_code: bebanCode,
      account_name: `Beban Operasional SPKLU - ${location}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "SPKLU",
      jenis_layanan: "Maintenance SPKLU",
      level: 3,
      parent_code: "6-0000",
      is_header: false,
      is_active: true,
      description: `Beban operasional SPKLU ${location}`
    },
    {
      account_code: penyusutanCode,
      account_name: `Penyusutan SPKLU - ${location}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "SPKLU",
      jenis_layanan: "Penyusutan",
      level: 3,
      parent_code: "7-0000",
      is_header: false,
      is_active: true,
      description: `Penyusutan aset SPKLU ${location}`
    }
  ];
};

const blueprintWarehouse = async (rack: string) => {
  const asetCode = await getNextSequentialNumber("1-4");
  const pendapatanCode = await getNextSequentialNumber("4-4");
  const hppCode = await getNextSequentialNumber("5-4");
  const bebanCode = await getNextSequentialNumber("6-4");
  const penyusutanCode = await getNextSequentialNumber("7-4");

  return [
    {
      account_code: asetCode,
      account_name: `Aset Warehouse - Rak ${rack}`,
      account_type: "Aset",
      normal_balance: "Debit",
      kategori_layanan: "Warehouse",
      jenis_layanan: "Aset Warehouse",
      level: 2,
      parent_code: "1-0000",
      is_header: false,
      is_active: true,
      description: `Aset warehouse rak ${rack}`
    },
    {
      account_code: pendapatanCode,
      account_name: `Pendapatan Sewa Rak - ${rack}`,
      account_type: "Pendapatan",
      normal_balance: "Kredit",
      kategori_layanan: "Warehouse",
      jenis_layanan: "Pendapatan Sewa",
      level: 3,
      parent_code: "4-0000",
      is_header: false,
      is_active: true,
      description: `Pendapatan sewa rak ${rack}`
    },
    {
      account_code: hppCode,
      account_name: `HPP Warehouse - ${rack}`,
      account_type: "Beban Pokok Penjualan",
      normal_balance: "Debit",
      kategori_layanan: "Warehouse",
      jenis_layanan: "HPP Warehouse",
      level: 3,
      parent_code: "5-0000",
      is_header: false,
      is_active: true,
      description: `HPP warehouse rak ${rack}`
    },
    {
      account_code: bebanCode,
      account_name: `Beban Operasional Warehouse - ${rack}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Warehouse",
      jenis_layanan: "Operasional Warehouse",
      level: 3,
      parent_code: "6-0000",
      is_header: false,
      is_active: true,
      description: `Beban operasional warehouse rak ${rack}`
    },
    {
      account_code: penyusutanCode,
      account_name: `Penyusutan Warehouse - ${rack}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Warehouse",
      jenis_layanan: "Penyusutan Warehouse",
      level: 3,
      parent_code: "7-0000",
      is_header: false,
      is_active: true,
      description: `Penyusutan warehouse rak ${rack}`
    }
  ];
};

const blueprintDriver = async (driverId: string, name: string) => {
  const pendapatanCode = await getNextSequentialNumber("4-5");
  const bebanCode = await getNextSequentialNumber("6-5");

  return [
    {
      account_code: pendapatanCode,
      account_name: `Pendapatan Driver - ${name}`,
      account_type: "Pendapatan",
      normal_balance: "Kredit",
      kategori_layanan: "Driver",
      jenis_layanan: "Pendapatan Driver",
      level: 3,
      parent_code: "4-0000",
      is_header: false,
      is_active: true,
      description: `Pendapatan dari driver ${name}`
    },
    {
      account_code: bebanCode,
      account_name: `Beban Driver - ${name}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Driver",
      jenis_layanan: "Beban Driver",
      level: 3,
      parent_code: "6-0000",
      is_header: false,
      is_active: true,
      description: `Beban operasional driver ${name}`
    }
  ];
};

const blueprintBarang = async (itemName: string, itemCode: string) => {
  // Get sequential numbers for each account type
  const persediaanCode = await getNextSequentialNumber("1-5");
  const pendapatanCode = await getNextSequentialNumber("4-6");
  const hppCode = await getNextSequentialNumber("5-5");
  
  // For beban accounts, get the next available number in 6-6 range
  const { data: existingBeban } = await supabase
    .from("chart_of_accounts")
    .select("account_code")
    .like("account_code", "6-6%")
    .order("account_code", { ascending: false });
  
  let maxBebanNum = 0;
  if (existingBeban && existingBeban.length > 0) {
    for (const row of existingBeban) {
      const numPart = row.account_code.replace("6-6", "").replace(/\D/g, "");
      const num = parseInt(numPart) || 0;
      if (num > maxBebanNum) {
        maxBebanNum = num;
      }
    }
  }
  
  const komisiCode = `6-6${(maxBebanNum + 1).toString().padStart(3, "0")}`;
  const operasionalCode = `6-6${(maxBebanNum + 2).toString().padStart(3, "0")}`;

  return [
    {
      account_code: persediaanCode,
      account_name: `Persediaan ${itemName}`,
      account_type: "Aset",
      normal_balance: "Debit",
      kategori_layanan: "Barang",
      jenis_layanan: "Persediaan Barang",
      level: 3,
      parent_code: "1-0000",
      is_header: false,
      is_active: true,
      description: `Persediaan barang ${itemName}`
    },
    {
      account_code: pendapatanCode,
      account_name: `Pendapatan ${itemName}`,
      account_type: "Pendapatan",
      normal_balance: "Kredit",
      kategori_layanan: "Barang",
      jenis_layanan: "Pendapatan Barang",
      level: 3,
      parent_code: "4-0000",
      is_header: false,
      is_active: true,
      description: `Pendapatan dari penjualan ${itemName}`
    },
    {
      account_code: hppCode,
      account_name: `HPP ${itemName}`,
      account_type: "Beban Pokok Penjualan",
      normal_balance: "Debit",
      kategori_layanan: "Barang",
      jenis_layanan: "HPP Barang",
      level: 3,
      parent_code: "5-0000",
      is_header: false,
      is_active: true,
      description: `HPP barang ${itemName}`
    },
    {
      account_code: komisiCode,
      account_name: `Beban Komisi ${itemName}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Barang",
      jenis_layanan: "Beban Komisi",
      level: 3,
      parent_code: "6-0000",
      is_header: false,
      is_active: true,
      description: `Beban komisi penjualan ${itemName}`
    },
    {
      account_code: operasionalCode,
      account_name: `Beban Operasional ${itemName}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Barang",
      jenis_layanan: "Beban Operasional Barang",
      level: 3,
      parent_code: "6-0000",
      is_header: false,
      is_active: true,
      description: `Beban operasional barang ${itemName}`
    }
  ];
};

const blueprintJasa = async (serviceName: string, serviceCode: string) => {
  // Get sequential numbers for each account type
  const pendapatanCode = await getNextSequentialNumber("4-7");
  const bebanLangsungCode = await getNextSequentialNumber("5-6");
  
  // For beban accounts, get the next available number in 6-7 range
  const { data: existingBeban } = await supabase
    .from("chart_of_accounts")
    .select("account_code")
    .like("account_code", "6-7%")
    .order("account_code", { ascending: false });
  
  let maxBebanNum = 0;
  if (existingBeban && existingBeban.length > 0) {
    for (const row of existingBeban) {
      const numPart = row.account_code.replace("6-7", "").replace(/\D/g, "");
      const num = parseInt(numPart) || 0;
      if (num > maxBebanNum) {
        maxBebanNum = num;
      }
    }
  }
  
  const komisiCode = `6-7${(maxBebanNum + 1).toString().padStart(3, "0")}`;
  const operasionalCode = `6-7${(maxBebanNum + 2).toString().padStart(3, "0")}`;

  return [
    {
      account_code: pendapatanCode,
      account_name: `Pendapatan ${serviceName}`,
      account_type: "Pendapatan",
      normal_balance: "Kredit",
      kategori_layanan: "Jasa",
      jenis_layanan: "Pendapatan Jasa",
      level: 3,
      parent_code: "4-0000",
      is_header: false,
      is_active: true,
      description: `Pendapatan dari jasa ${serviceName}`
    },
    {
      account_code: bebanLangsungCode,
      account_name: `Beban Langsung ${serviceName}`,
      account_type: "Beban Pokok Penjualan",
      normal_balance: "Debit",
      kategori_layanan: "Jasa",
      jenis_layanan: "Beban Langsung Jasa",
      level: 3,
      parent_code: "5-0000",
      is_header: false,
      is_active: true,
      description: `Beban langsung jasa ${serviceName}`
    },
    {
      account_code: komisiCode,
      account_name: `Beban Komisi ${serviceName}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Jasa",
      jenis_layanan: "Beban Komisi Jasa",
      level: 3,
      parent_code: "6-0000",
      is_header: false,
      is_active: true,
      description: `Beban komisi jasa ${serviceName}`
    },
    {
      account_code: operasionalCode,
      account_name: `Beban Operasional ${serviceName}`,
      account_type: "Beban Operasional",
      normal_balance: "Debit",
      kategori_layanan: "Jasa",
      jenis_layanan: "Beban Operasional Jasa",
      level: 3,
      parent_code: "6-0000",
      is_header: false,
      is_active: true,
      description: `Beban operasional jasa ${serviceName}`
    }
  ];
};

// ------------------------------
// REGISTER BLUEPRINTS
// ------------------------------

export const COA_REGISTRY: any = {
  VEHICLE: blueprintVehicle,
  SPKLU: blueprintSPKLU,
  WAREHOUSE: blueprintWarehouse,
  DRIVER: blueprintDriver,
  BARANG: blueprintBarang,
  JASA: blueprintJasa
};

// ------------------------------
// COA ENGINE MAIN FUNCTION
// ------------------------------

export const COA_ENGINE = async (
  type: "VEHICLE" | "SPKLU" | "WAREHOUSE" | "DRIVER" | "BARANG" | "JASA",
  identifier: string,
  meta?: any
) => {
  const createFn = COA_REGISTRY[type];

  if (!createFn) throw new Error("Blueprint COA tidak ditemukan");

  const blueprint = await createFn(identifier, meta);

  // PREVENT DUPLICATION
  const filtered: any[] = [];
  for (const coa of blueprint) {
    const exists = await existsInSupabase(coa.account_code);
    if (!exists) filtered.push(coa);
  }

  if (filtered.length === 0) return { message: "Semua akun sudah ada." };

  return await insertCOA(filtered);
};

// ====================================================
// END OF FILE
// ====================================================
