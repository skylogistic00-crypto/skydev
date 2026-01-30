import * as React from "react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type JournalDraftStatus = "draft" | "posted" | "cancelled";

export type JournalDraftLine = {
  coa_id?: string | null;
  coa_code?: string | null;
  coa_name?: string | null;
  description?: string | null;
  normal_balance?: "debit" | "credit" | null;
  debit?: number | null;
  credit?: number | null;

  // True for the auto-generated counter line (Bank perusahaan)
  is_bank_counter?: boolean | null;
};

type CoaOption = {
  id: string;
  account_code: string | null;
  account_name: string | null;
  normal_balance: "debit" | "credit";
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  bankMutationId: string | null;
  transactionLinkId?: string | null;

  bankMutationDate?: string | null;
  jenisTransaksi?: string | null;

  direction?: "IN" | "OUT" | null;
  buktiUrl?: string | null;
  invoiceUrl?: string | null;
  fakturPajakUrl?: string | null;

  bankMutationDescription?: string | null; // ⬅️ TAMBAHAN
  bankMutationAmount?: number | null;
  defaultLines: JournalDraftLine[];

  onSaved?: () => void;
  onCancelled?: () => void;
  onPosted?: () => void;
};

const numberValue = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const BANK_COUNTER = {
  coa_code: "1-1220",
  coa_name: "Bank Mandiri",
} as const;

export function BankMutationJournalPreviewDialog({
  open,
  onOpenChange,
  bankMutationId,
  transactionLinkId,
  bankMutationDate,
  jenisTransaksi,

  direction,
  buktiUrl,
  invoiceUrl,
  fakturPajakUrl,
  bankMutationDescription, // ⬅️ WAJIB
  bankMutationAmount,
  defaultLines,
  onSaved,
  onCancelled,
  onPosted,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [lines, setLines] = React.useState<JournalDraftLine[]>(defaultLines);
  const [saving, setSaving] = React.useState<JournalDraftStatus | null>(null);

  const ensurePerRowBankCounters = React.useCallback((next: JournalDraftLine[]) => {
    // Remove any existing bank counter lines, then insert one bank counter line
    // immediately after each non-bank line.
    const nonBank = next.filter((l) => !l.is_bank_counter);

    const withCounters: JournalDraftLine[] = [];
    for (const l of nonBank) {
      withCounters.push({ ...l, is_bank_counter: false });
      withCounters.push({
        coa_id: null,
        coa_code: BANK_COUNTER.coa_code,
        coa_name: BANK_COUNTER.coa_name,
        description: l.description
          ? `${l.description}`
          : "Counter (otomatis)",
        debit: l.credit && l.credit > 0 ? l.credit : null,
        credit: l.debit && l.debit > 0 ? l.debit : null,
        is_bank_counter: true,
      });
    }

    return withCounters;
  }, []);

  const setLinesAuto = React.useCallback(
    (updater) => {
      setLines((prev) => {
        const updated = updater(prev);
        return ensurePerRowBankCounters(updated);
      });
    },
    [ensurePerRowBankCounters]
  );

  const [coaOptions, setCoaOptions] = React.useState<CoaOption[]>([]);
  const [coaLoading, setCoaLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    // On first open, start with NO rows.
    // Existing drafts (when editing) are still loaded via `defaultLines`.
    const initial = defaultLines && defaultLines.length > 0 ? defaultLines : [];

    // Only generate bank counter rows if user already has at least 1 non-bank row.
    const nonBankCount = initial.filter((l) => !l.is_bank_counter).length;
    setLines(() =>
      nonBankCount > 0
        ? ensurePerRowBankCounters(
            initial.map((l) =>
              l.is_bank_counter
              ? l
              : {
                  ...l,
                  normal_balance: l.normal_balance?.toLowerCase() ?? null,
                  description: l.description ?? bankMutationDescription ?? null,
                }
          )
        )
      : []
  );
  }, [open, defaultLines, ensurePerRowBankCounters]);

  React.useEffect(() => {
    const loadCoa = async () => {
      if (!open) return;
      try {
        setCoaLoading(true);
        const { data, error } = await supabase
          .from("chart_of_accounts" as any)
          .select("id, account_code, account_name, normal_balance")
          .eq("level", 3)
          .order("account_code", { ascending: true });

        if (error) throw error;
        setCoaOptions(
          (data ?? []).map((c: any) => ({
            ...c,
            normal_balance: c.normal_balance?.toLowerCase(), // ⬅️ KUNCI
          }))
        );
      } catch (err: any) {
        toast({
          title: "Gagal memuat COA",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setCoaLoading(false);
      }
    };

    loadCoa();
  }, [open, toast]);

  const totals = React.useMemo(() => {
    const totalDebit = lines.reduce(
      (acc, l) => acc + numberValue(l.debit),
      0
    );

    const totalCredit = lines.reduce(
      (acc, l) => acc + numberValue(l.credit),
      0
    );

    return {
      totalDebit,
      totalCredit,
      balanced: totalDebit === totalCredit,
    };
  }, [lines]);

  const persist = async (status: JournalDraftStatus) => {
    if (!bankMutationId) {
      toast({
        title: "Error",
        description: "bankMutationId tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(status);

      const payload = {
        bank_mutation_id: bankMutationId,
        transaction_link_id: transactionLinkId ?? null,
        draft_lines: ensurePerRowBankCounters(lines),
        total_debit: totals.totalDebit,
        total_credit: totals.totalCredit,
        status,
        created_by: user?.id ?? null,
        posted_at: null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("bank_mutation_journal_drafts" as any)
        .upsert(payload as any, { onConflict: "bank_mutation_id" } as any);

      if (error) throw error;

      if (status === "posted") {
        const { error: postError } = await supabase.rpc(
          "post_journal_bank_mutation" as any,
          {
            p_bank_mutation_id: bankMutationId,
          } as any
        );

        // If Postgres schema cache hasn't picked up the RPC yet, client can throw a
        // "Could not find the function" error even though it exists.
        // Fallback: call edge function which can execute the same DB logic.
        if (postError) {
          const msg = String((postError as any)?.message ?? postError);
          const isSchemaCacheFnMissing =
            msg.includes("Could not find the function") || msg.includes("schema cache");

          if (!isSchemaCacheFnMissing) throw postError;

          const { data: fnData, error: fnError } = await supabase.functions.invoke(
            "supabase-functions-post-journal",
            {
              body: {
                action: "post_bank_mutation",
                bank_mutation_id: bankMutationId,
              },
            }
          );

          if (fnError) throw fnError;
          if ((fnData as any)?.error) throw new Error((fnData as any).error);
        }

        toast({ title: "Posted", description: "Jurnal berhasil diposting" });
        onPosted?.();
        onSaved?.();
        onOpenChange(false);
        return;
      }

      if (status === "draft") {
        toast({ title: "Saved", description: "Draft jurnal disimpan" });
        onSaved?.();
        onOpenChange(false);
        return;
      }

      if (status === "cancelled") {
        toast({ title: "Cancelled", description: "Draft jurnal dibatalkan" });
        onCancelled?.();
        onOpenChange(false);
        return;
      }

      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Preview Posting Journal Entries</DialogTitle>
          <DialogDescription>
            Review & edit draft jurnal sebelum disimpan atau diposting.
          </DialogDescription>

          {/* HEADER INFO TRANSAKSI – FULL WIDTH */}
          <div className="mt-4 rounded-lg border bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

              <div>
                <div className="text-muted-foreground">Tanggal</div>
                <div className="font-medium">
                  {bankMutationDate
                    ? new Date(bankMutationDate).toLocaleDateString("id-ID")
                    : "-"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-semibold">
                  {typeof bankMutationAmount === "number"
                  ? new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(bankMutationAmount)
                : "-"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Jenis Transaksi</div>
                <div className="font-medium">{jenisTransaksi ?? "-"}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Direction</div>
                <div className="font-semibold">
                  {direction === "IN" && <span className="text-green-600">IN</span>}
                  {direction === "OUT" && <span className="text-red-600">OUT</span>}
                  {!direction && "-"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Bukti</div>
                  {buktiUrl ? (
                    <a href={buktiUrl} target="_blank" className="text-blue-600 underline">
                      Lihat
                    </a>
                  ) : (
                    "-"
                  )}
              </div>

              <div>
                <div className="text-muted-foreground">Invoice</div>
                  {invoiceUrl ? (
                    <a href={invoiceUrl} target="_blank" className="text-blue-600 underline">
                      Lihat
                    </a>
                  ) : (
                    "-"
                  )}
              </div>

              <div>
                <div className="text-muted-foreground">Faktur Pajak</div>
                  {fakturPajakUrl ? (
                    <a href={fakturPajakUrl} target="_blank" className="text-blue-600 underline">
                      Lihat
                    </a>
                  ) : (
                    "-"
                  )}
              </div>
            </div>

            {/* DESKRIPSI */}
            <div className="mt-4">
              <div className="text-muted-foreground text-sm">Deskripsi</div>
              <div className="text-sm">
                {bankMutationDescription ?? "-"}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border">

            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[260px]">Akun COA</TableHead>
                    <TableHead>Deskripsi Baris</TableHead>
                    <TableHead className="w-[140px] text-right">Debit</TableHead>
                    <TableHead className="w-[140px] text-right">Kredit</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-9 w-full justify-start px-3 font-normal"
                              disabled={!!l.is_bank_counter}
                            >
                              {l.is_bank_counter
                                ? `${BANK_COUNTER.coa_code} - ${BANK_COUNTER.coa_name}`
                                : l.coa_code || l.coa_name
                                  ? `${l.coa_code ?? ""}${l.coa_code && l.coa_name ? " - " : ""}${l.coa_name ?? ""}`
                                  : "-- Pilih Akun COA --"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[380px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari akun COA..." />
                              <CommandList>
                                <CommandEmpty>
                                  {coaLoading ? "Loading..." : "Akun tidak ditemukan"}
                                </CommandEmpty>
                                <CommandGroup>
                                  {coaOptions.map((opt) => (
                                    <CommandItem
                                      key={opt.id}
                                      value={`${opt.account_code ?? ""} ${opt.account_name ?? ""}`}
                                      onSelect={() => {
                                        setLinesAuto((prev) =>
                                          prev.map((p, i) =>
                                            i === idx
                                              ? {
                                                  ...p,
                                                  coa_id: opt.id,
                                                  coa_code: opt.account_code,
                                                  coa_name: opt.account_name,
                                                  normal_balance: opt.normal_balance,
                                                  debit: opt.normal_balance === "credit" ? null : p.debit,
                                                  credit: opt.normal_balance === "debit" ? null : p.credit,
                                                  is_bank_counter: false,
                                                }
                                              : p
                                          )
                                        );
                                      }}
                                    >
                                      <div className="flex w-full items-center justify-between gap-3">
                                        <div className="truncate text-sm">
                                          <span className="font-medium">{opt.account_code}</span>
                                          {opt.account_name ? (
                                            <span className="text-muted-foreground"> - {opt.account_name}</span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={l.description ?? ""}
                          placeholder=""
                          onChange={(e) => {
                            const v = e.target.value;
                            setLinesAuto((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, description: v } : p))
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="text-right"
                          inputMode="decimal"
                          value={l.debit ?? ""}
                          disabled={!!l.is_bank_counter || numberValue(l.credit) > 0}
                          onChange={(e) => {
                            const parsed = e.target.value === "" ? null : numberValue(e.target.value);
                            setLinesAuto((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? {
                                    ...p,
                                    debit: parsed,
                                    credit: parsed ? null : p.credit,
                                    }
                                  : p
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="text-right"
                          inputMode="decimal"
                          value={l.credit ?? ""}
                          disabled={!!l.is_bank_counter || numberValue(l.debit) > 0}
                          onChange={(e) => {
                            const parsed = e.target.value === "" ? null : numberValue(e.target.value);
                            setLinesAuto((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? {
                                    ...p,
                                    credit: parsed,
                                    debit: parsed ? null : p.debit,
                                    }
                                  : p
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setLinesAuto((prev) => {
                              if (prev[idx]?.is_bank_counter) return prev;
                              return prev.filter((_, i) => i !== idx);
                            })
                          }
                          disabled={!!l.is_bank_counter}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!lines.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Tidak ada baris
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setLinesAuto((prev) => [
                      ...prev,
                      {
                        coa_id: null,
                        coa_code: null,
                        coa_name: null,
                        description: bankMutationDescription ?? null, // ⬅️ AUTO
                        debit: null,
                        credit: null,
                        is_bank_counter: false,
                      },
                    ])
                  }
                >
                  + Tambah Baris
                </Button>

                <div className="text-xs text-muted-foreground">
                  Total Debit: <span className="font-medium text-foreground">{totals.totalDebit.toFixed(2)}</span>
                  <span className="mx-2"></span>
                  Total Kredit: <span className="font-medium text-foreground">{totals.totalCredit.toFixed(2)}</span>
                  {!totals.balanced && (
                    <span className="ml-2 text-destructive">(Tidak balance)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!saving}>
            Close
          </Button>
          <Button variant="secondary" onClick={() => persist("cancelled")} disabled={!!saving}>
            {saving === "cancelled" ? "Cancelling..." : "Cancel"}
          </Button>
          <Button onClick={() => persist("draft")} disabled={!!saving}>
            {saving === "draft" ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="default"
            onClick={() => persist("posted")}
            disabled={!!saving}
          >
            {saving === "posted" ? "Posting..." : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
