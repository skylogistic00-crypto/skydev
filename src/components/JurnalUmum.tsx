import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ChevronDown } from "lucide-react";

interface AkunCOA {
  account_code: string;
  account_name: string;
}

interface JurnalRow {
  akunCOA: string;
  deskripsiBaris: string;
  debit: number | null;
  kredit: number | null;
}

async function fetchAkunCOAFromEdge(projectRef: string): Promise<AkunCOA[]> {
  const { data, error } = await supabase.functions.invoke(
    "supabase-functions-jurnal-umum",
    {
      body: {
        path: "fetch-coa",
        projectRef,
      },
    },
  );

  if (error) {
    throw error;
  }

  return (data?.data || []) as AkunCOA[];
}

export default function JurnalUmum() {
  const { toast } = useToast();
  const [akunCOAList, setAkunCOAList] = useState<AkunCOA[]>([]);
  const [tanggalTransaksi, setTanggalTransaksi] = useState<string>("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<
    { account_code: string; description: string }[]
  >([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<
    number | null
  >(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [nomorReferensi, setNomorReferensi] = useState<string>("");
  const [deskripsiTransaksiUtama, setDeskripsiTransaksiUtama] =
    useState<string>("");
  const [jurnalRows, setJurnalRows] = useState<JurnalRow[]>([
    { akunCOA: "", deskripsiBaris: "", debit: null, kredit: null },
  ]);
  const [coaSearchTerms, setCoaSearchTerms] = useState<{ [key: number]: string }>({});
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // Generate reference number
  function generateReferenceNumber(): string {
    const timestamp = Date.now().toString().slice(-5);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REF-${timestamp}${random}`;
  }

  useEffect(() => {
    async function loadCoa() {
      try {
        const fullUrl = supabase.supabaseUrl || "";
        const projectRef =
          fullUrl.split("https://")[1]?.split(".supabase.co")[0] || "";

        const list = await fetchAkunCOAFromEdge(projectRef);
        setAkunCOAList(list);
      } catch (err) {
        console.error(err);
        toast({
          title: "Gagal memuat Akun COA",
          description: "Terjadi kesalahan saat memuat daftar akun.",
          variant: "destructive",
        });
      }
    }

    loadCoa();
  }, []); // HANYA SEKALI

  // Generate reference number on mount
  useEffect(() => {
    setNomorReferensi(generateReferenceNumber());
  }, []);

  useEffect(() => {
    console.log("AKUN COA LIST UPDATED:", akunCOAList);
  }, [akunCOAList]);

  function addRow() {
    setJurnalRows((prev) => [
      ...prev,
      { akunCOA: "", deskripsiBaris: "", debit: null, kredit: null },
    ]);
  }

  function removeRow(index: number) {
    setJurnalRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof JurnalRow, value: any) {
    setJurnalRows((prev) => {
      const rows = [...prev];
      const row = { ...rows[index] };

      if (field === "debit") {
        const num = value === "" ? null : Number(value);
        row.debit = num;
        if (num !== null && num > 0) {
          row.kredit = null;
        }
      } else if (field === "kredit") {
        const num = value === "" ? null : Number(value);
        row.kredit = num;
        if (num !== null && num > 0) {
          row.debit = null;
        }
      } else {
        (row as any)[field] = value;
      }

      rows[index] = row;
      return rows;
    });
  }

  function validateForm(): boolean {
    const errors: string[] = [];

    if (!tanggalTransaksi) {
      errors.push("Tanggal Transaksi wajib diisi.");
    }

    if (jurnalRows.length === 0) {
      errors.push("Minimal harus ada satu baris jurnal.");
    }

    let totalDebit = 0;
    let totalKredit = 0;
    let hasDebit = false;
    let hasKredit = false;

    jurnalRows.forEach((row, idx) => {
      const rowIndex = idx + 1;
      if (!row.akunCOA) {
        errors.push(`Baris ${rowIndex}: Akun COA harus dipilih.`);
      }
      const hasDebitVal = row.debit !== null && row.debit > 0;
      const hasKreditVal = row.kredit !== null && row.kredit > 0;

      if (!hasDebitVal && !hasKreditVal) {
        errors.push(
          `Baris ${rowIndex}: Debit atau Kredit harus diisi salah satu.`,
        );
      }

      if (hasDebitVal) {
        hasDebit = true;
        totalDebit += row.debit || 0;
      }
      if (hasKreditVal) {
        hasKredit = true;
        totalKredit += row.kredit || 0;
      }

      if (!row.deskripsiBaris) {
        errors.push(`Baris ${rowIndex}: Deskripsi Baris tidak boleh kosong.`);
      }
    });

    if (!hasDebit) {
      errors.push("Harus ada minimal satu baris dengan Debit.");
    }
    if (!hasKredit) {
      errors.push("Harus ada minimal satu baris dengan Kredit.");
    }
    if (totalDebit !== totalKredit) {
      errors.push("Total Debit harus sama dengan Total Kredit.");
    }

    if (errors.length > 0) {
      toast({
        title: "Validasi gagal",
        description: errors.join("\n"),
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAiSuggest() {
    if (!aiInput.trim()) return;
    try {
      setAiLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-jurnal-umum-ai-saran-akun",
        {
          body: { userInput: aiInput },
        },
      );
      if (error) throw error;
      const suggestions =
        (data?.suggestions as {
          account_code: string;
          description: string;
        }[]) || [];
      setAiSuggestions(suggestions);
      setSelectedSuggestionIndex(suggestions.length > 0 ? 0 : null);
      if (suggestions.length === 0) {
        toast({
          title: "Tidak ada saran",
          description:
            "AI tidak mengembalikan daftar akun. Silakan perbaiki deskripsi dan coba lagi.",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal mendapatkan saran akun",
        description:
          err?.message ||
          "Terjadi kesalahan saat memanggil AI. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  }

  function applySelectedSuggestionToRow(rowIndex: number) {
    if (
      selectedSuggestionIndex === null ||
      selectedSuggestionIndex < 0 ||
      selectedSuggestionIndex >= aiSuggestions.length
    ) {
      toast({
        title: "Pilih saran terlebih dahulu",
        description:
          "Silakan pilih salah satu saran akun sebelum menerapkannya ke baris.",
        variant: "destructive",
      });
      return;
    }

    const suggestion = aiSuggestions[selectedSuggestionIndex];
    setJurnalRows((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      row.akunCOA = suggestion.account_code;
      row.deskripsiBaris = suggestion.description;
      rows[rowIndex] = row;
      return rows;
    });

    toast({
      title: "Saran diterapkan",
      description: "Akun dan deskripsi baris telah diisi dari saran AI.",
    });

    setAiModalOpen(false);
  }

  function resetForm() {
    setTanggalTransaksi("");
    setNomorReferensi(generateReferenceNumber());
    setDeskripsiTransaksiUtama("");
    setJurnalRows([
      { akunCOA: "", deskripsiBaris: "", debit: null, kredit: null },
    ]);
    setAiInput("");
    setAiSuggestions([]);
    setSelectedSuggestionIndex(null);
    setSelectedRowIndex(null);
  }

  async function handleConfirmSave() {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Insert into general_journal
      const { data: journalData, error: journalError } = await supabase
        .from("general_journal")
        .insert({
          transaction_date: tanggalTransaksi,
          reference_no: nomorReferensi || null,
          description: deskripsiTransaksiUtama || null,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Insert journal lines
      const lines = jurnalRows.map((row) => {
        const selectedAccount = akunCOAList.find(
          (a) => a.account_code === row.akunCOA,
        );
        return {
          journal_id: journalData.id,
          account_code: row.akunCOA,
          account_name: selectedAccount?.account_name || "",
          debit: row.debit || 0,
          credit: row.kredit || 0,
          note: row.deskripsiBaris || null,
        };
      });

      const { error: linesError } = await supabase
        .from("general_journal_lines")
        .insert(lines);

      if (linesError) throw linesError;

      toast({
        title: "Jurnal berhasil disimpan",
        description: `Jurnal dengan referensi ${nomorReferensi || journalData.id} telah disimpan.`,
      });

      setIsPreviewOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Gagal menyimpan jurnal",
        description: err?.message || "Terjadi kesalahan saat menyimpan jurnal.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsPreviewOpen(true);
  }

  return (
    <Card className="max-w-5xl mx-auto bg-white shadow-md p-6">
      <CardHeader>
        <CardTitle>Jurnal Umum – General Journal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Tanggal Transaksi *</Label>
              <Input
                type="date"
                value={tanggalTransaksi}
                onChange={(e) => setTanggalTransaksi(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Nomor Referensi</Label>
              <Input
                type="text"
                value={nomorReferensi}
                readOnly
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Deskripsi Transaksi Utama</Label>
              <Textarea
                value={deskripsiTransaksiUtama}
                onChange={(e) => setDeskripsiTransaksiUtama(e.target.value)}
                placeholder="Opsional"
                className="h-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Akun COA</TableHead>
                  <TableHead>Deskripsi Baris</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Kredit</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jurnalRows.map((row, idx) => (
                  <TableRow
                    key={idx}
                    className={
                      selectedRowIndex === idx
                        ? "bg-blue-50 cursor-pointer"
                        : "cursor-pointer hover:bg-gray-50"
                    }
                    onClick={() => setSelectedRowIndex(idx)}
                  >
                    <TableCell className="w-64">
                      <Popover 
                        open={openPopoverIndex === idx} 
                        onOpenChange={(open) => {
                          setOpenPopoverIndex(open ? idx : null);
                          if (!open) {
                            setCoaSearchTerms(prev => ({ ...prev, [idx]: "" }));
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between text-left font-normal text-sm h-9"
                          >
                            <span className="truncate">
                              {row.akunCOA
                                ? `${row.akunCOA} - ${akunCOAList.find(acc => acc.account_code === row.akunCOA)?.account_name || ""}`
                                : "-- Pilih Akun COA --"}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <div className="p-2 border-b">
                            <div className="flex items-center gap-2 px-2 py-1 border rounded-md">
                              <Search className="h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Cari akun COA..."
                                className="flex-1 outline-none text-sm bg-transparent"
                                value={coaSearchTerms[idx] || ""}
                                onChange={(e) => {
                                  setCoaSearchTerms(prev => ({ ...prev, [idx]: e.target.value }));
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                            {akunCOAList
                              .filter((acc) => {
                                const searchTerm = (coaSearchTerms[idx] || "").toLowerCase();
                                return (
                                  acc.account_code.toLowerCase().includes(searchTerm) ||
                                  acc.account_name.toLowerCase().includes(searchTerm)
                                );
                              })
                              .map((acc) => (
                                <div
                                  key={acc.account_code}
                                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                                    row.akunCOA === acc.account_code ? "bg-blue-50 text-blue-700" : ""
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateRow(idx, "akunCOA", acc.account_code);
                                    setOpenPopoverIndex(null);
                                    setCoaSearchTerms(prev => ({ ...prev, [idx]: "" }));
                                  }}
                                >
                                  {acc.account_code} - {acc.account_name}
                                </div>
                              ))}
                            {akunCOAList.filter((acc) => {
                              const searchTerm = (coaSearchTerms[idx] || "").toLowerCase();
                              return (
                                acc.account_code.toLowerCase().includes(searchTerm) ||
                                acc.account_name.toLowerCase().includes(searchTerm)
                              );
                            }).length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                Tidak ada akun ditemukan
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        value={row.deskripsiBaris}
                        onChange={(e) =>
                          updateRow(idx, "deskripsiBaris", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="w-32">
                      <Input
                        type="number"
                        min={0}
                        value={row.debit ?? ""}
                        onChange={(e) =>
                          updateRow(idx, "debit", e.target.value)
                        }
                        disabled={row.kredit !== null && row.kredit > 0}
                      />
                    </TableCell>
                    <TableCell className="w-32">
                      <Input
                        type="number"
                        min={0}
                        value={row.kredit ?? ""}
                        onChange={(e) =>
                          updateRow(idx, "kredit", e.target.value)
                        }
                        disabled={row.debit !== null && row.debit > 0}
                      />
                    </TableCell>
                    <TableCell className="w-20">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(idx)}
                      >
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button type="button" variant="outline" onClick={addRow}>
              + Tambah Baris
            </Button>
          </div>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset Form
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAiModalOpen(true);
                  setAiInput(deskripsiTransaksiUtama || "");
                  setAiSuggestions([]);
                  setSelectedSuggestionIndex(null);
                }}
              >
                AI Saran Akun
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (validateForm()) setIsPreviewOpen(true);
                }}
              >
                Preview Jurnal
              </Button>
              <Button type="submit">Simpan Jurnal</Button>
            </div>
          </div>
        </form>

        <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>AI Saran Akun</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Deskripsi transaksi</div>
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Tuliskan deskripsi transaksi untuk mendapatkan saran akun..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Saran akun dari AI</div>
                <div className="border rounded p-3 text-sm min-h-[120px] bg-gray-50">
                  {aiSuggestions.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Belum ada saran. Klik tombol di bawah untuk meminta saran.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-60 overflow-auto text-sm">
                      {aiSuggestions.map((s, idx) => (
                        <button
                          key={`${s.account_code}-${idx}`}
                          type="button"
                          onClick={() => setSelectedSuggestionIndex(idx)}
                          className={`w-full text-left px-2 py-1 rounded border ${
                            selectedSuggestionIndex === idx
                              ? "border-blue-500 bg-blue-50"
                              : "border-transparent hover:bg-gray-100"
                          }`}
                        >
                          <div className="font-mono text-xs">
                            {s.account_code}
                          </div>
                          <div>{s.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAiModalOpen(false)}
                disabled={aiLoading}
              >
                Tutup
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                >
                  {aiLoading ? "Meminta saran..." : "Minta Saran"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (selectedRowIndex !== null) {
                      applySelectedSuggestionToRow(selectedRowIndex);
                    }
                  }}
                  disabled={
                    aiLoading ||
                    aiSuggestions.length === 0 ||
                    selectedSuggestionIndex === null ||
                    selectedRowIndex === null
                  }
                >
                  Apply ke baris terpilih
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Preview Jurnal Umum</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Tanggal Transaksi</div>
                  <div>{tanggalTransaksi}</div>
                </div>
                <div>
                  <div className="font-semibold">Nomor Referensi</div>
                  <div>{nomorReferensi || "-"}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold">Deskripsi Transaksi Utama</div>
                  <div>{deskripsiTransaksiUtama || "-"}</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Akun COA</TableHead>
                    <TableHead>Deskripsi Baris</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jurnalRows.map((row, idx) => {
                    const akun = akunCOAList.find(
                      (a) => a.account_code === row.akunCOA,
                    );
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          {row.akunCOA
                            ? `${row.akunCOA} - ${akun?.account_name ?? ""}`
                            : "-"}
                        </TableCell>
                        <TableCell>{row.deskripsiBaris}</TableCell>
                        <TableCell className="text-right">
                          {row.debit ? row.debit.toLocaleString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.kredit
                            ? row.kredit.toLocaleString("id-ID")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Menyimpan..." : "Konfirmasi & Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
