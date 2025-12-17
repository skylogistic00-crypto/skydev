import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface BankAccount {
  id: string;
  account_code: string;
  account_name: string;
}

interface MutationRow {
  id: string;
  tanggal: string;
  deskripsi: string;
  debit: number;
  credit: number;
  balance: number;
  kas_bank: string;
  selected: boolean;
}

export default function BankMutationUpload() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<{
    id: string;
    bank_name: string;
    account_code: string;
  } | null>(null);
  const [mutations, setMutations] = useState<MutationRow[]>([]);
  const [uploading, setUploading] = useState(false);

  /* =========================
     LOAD BANK ACCOUNTS
  ========================== */
  useEffect(() => {
    const loadBanks = async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name")
        .like("account_code", "1-12%")
        .order("account_code");

      if (error) {
        toast({ title: "Error load bank", description: error.message, variant: "destructive" });
        return;
      }
      setBankAccounts(data || []);
    };

    loadBanks();
  }, []);

  /* =========================
     CSV PARSER (AMAN)
  ========================== */
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  /* =========================
     FILE UPLOAD HANDLER
  ========================== */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBank) return;

    // ✅ WAJIB: Pastikan user sudah login
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User belum login. Silakan login terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    // ✅ WAJIB: Validasi selectedBank
    if (!selectedBank) {
      toast({
        title: "Error",
        description: "Bank belum dipilih",
        variant: "destructive",
      });
      return;
    }

    console.log("AUTH USER:", user);

    setUploading(true);

    try {

      const text = await file.text();
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) throw new Error("File kosong");

      // ⚠️ JANGAN lowercase header
      const headers = lines[0].split(",").map(h => h.trim());

      /* =========================
         CREATE UPLOAD RECORD
      ========================== */
      const { data: upload, error: uploadErr } = await supabase
        .from("bank_mutation_uploads")
        .insert({
          file_name: file.name,
          bank_account_id: selectedBank.id,
          bank_account_code: selectedBank.account_code,
          bank_account_name: selectedBank.bank_name,
          bank_name: selectedBank.bank_name, // ✅ WAJIB: bank_name
          total_rows: lines.length - 1,
          status: "processing",
          created_by: user.id,
          original_filename: file.name, // ✅ WAJIB: original_filename (NOT NULL)
          user_id: user.id, // ✅ WAJIB: user_id (NOT NULL)
          file_size: file.size, // ✅ WAJIB: file_size (NOT NULL)
          mime_type: file.type || "text/csv", // ✅ WAJIB: mime_type (NOT NULL)
        })
        .select()
        .single();

      if (uploadErr) throw uploadErr;

      const rows: MutationRow[] = [];

      /* =========================
         PROCESS ROWS
      ========================== */
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};

        headers.forEach((h, idx) => (row[h] = values[idx]?.trim() || ""));

        // ✅ FIX TANGGAL (WAJIB)
        const rawDate =
          row["date & time"] ||
          row["date"] ||
          row["tanggal"] ||
          row["tgl"];

        const mutationDate = rawDate
          ? new Date(rawDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

        const debit = Number(row["debit"] || 0);
        const credit = Number(row["credit"] || row["kredit"] || 0);
        const balance = Number(row["balance"] || row["saldo"] || 0);

        const { data: inserted, error: insertErr } = await supabase
          .from("bank_mutations")
          .insert({
            upload_id: upload.id,
            bank_account_id: selectedBank.id,
            bank_account_code: selectedBank.account_code,
            bank_account_name: selectedBank.bank_name,
            bank_name: selectedBank.bank_name, // ✅ WAJIB: bank_name (NOT NULL constraint)
            mutation_date: mutationDate,
            description: row["deskripsi"] || row["keterangan"] || "",
            debit,
            credit,
            balance,
            kas_bank: selectedBank.account_code,
            mapping_status: "auto",
            approval_status: "waiting",
            user_id: user.id,
            created_by: user.id,
            transaction_date: mutationDate, // ✅ WAJIB: transaction_date (NOT NULL constraint)
            transaction_type: debit > 0 ? "expense" : "income", // ✅ WAJIB: transaction_type (NOT NULL constraint)
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        rows.push({
          id: inserted.id,
          tanggal: mutationDate,
          deskripsi: inserted.description,
          debit,
          credit,
          balance,
          kas_bank: selectedBank.account_code,
          selected: false,
        });
      }

      await supabase
        .from("bank_mutation_uploads")
        .update({ status: "completed", processed_rows: rows.length })
        .eq("id", upload.id);

      setMutations(rows);

      toast({
        title: "Berhasil",
        description: `${rows.length} mutasi berhasil diupload`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  /* =========================
     UI
  ========================== */
  return (
    <div className="p-6 space-y-4">
      <Label>Pilih Akun Bank</Label>
      <Select 
        value={selectedBank?.id || ""} 
        onValueChange={(value) => {
          const bank = bankAccounts.find(b => b.id === value);
          if (bank) {
            setSelectedBank({
              id: bank.id,
              bank_name: bank.account_name,
              account_code: bank.account_code,
            });
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pilih bank..." />
        </SelectTrigger>
        <SelectContent>
          {bankAccounts.map(b => (
            <SelectItem key={b.id} value={b.id}>
              {b.account_code} - {b.account_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input type="file" accept=".csv" onChange={handleFileUpload} disabled={uploading} />

      {mutations.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Tanggal</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mutations.map(m => (
              <TableRow key={m.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>{m.tanggal}</TableCell>
                <TableCell>{m.deskripsi}</TableCell>
                <TableCell>{m.debit}</TableCell>
                <TableCell>{m.credit}</TableCell>
                <TableCell>{m.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
