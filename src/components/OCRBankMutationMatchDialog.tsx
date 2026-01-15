import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

import type { BankMutationMatchCandidate } from "@/lib/bankMutationMatch";

type CandidateWithScore = { row: BankMutationMatchCandidate; score: number };

export function OCRBankMutationMatchDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: CandidateWithScore[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  target: {
    date?: string | null;
    amount?: number | null;
    description?: string | null;
  };
}) {
  const { open, onOpenChange, candidates, selectedId, onSelect, onConfirm, onCancel, target } = props;

  const title = useMemo(() => {
    const parts: string[] = [];
    if (target.date) parts.push(`Tanggal: ${format(new Date(target.date), "dd/MM/yyyy")}`);
    if (typeof target.amount === "number") parts.push(`Nominal: ${target.amount.toLocaleString("id-ID")}`);
    if (target.description) parts.push(`Deskripsi: ${target.description.slice(0, 50)}${target.description.length > 50 ? "…" : ""}`);
    return parts.join(" • ") || "Auto-match";
  }, [target.amount, target.date, target.description]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Konfirmasi Mutasi Bank</DialogTitle>
          <DialogDescription>
            Sistem menemukan beberapa kandidat berdasarkan tanggal, nominal, dan deskripsi. Pilih 1 baris yang benar.
          </DialogDescription>
        </DialogHeader>

        <div className="text-xs text-muted-foreground">{title}</div>
        <Separator />

        <ScrollArea className="h-[340px] pr-4">
          <div className="space-y-2">
            {candidates.map(({ row, score }) => {
              const amount = Number(row.debit ?? row.credit ?? 0);
              const selected = selectedId === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelect(row.id)}
                  className={
                    "w-full text-left rounded-md border p-3 transition-colors hover:bg-muted/50 " +
                    (selected ? "border-primary bg-muted" : "border-border")
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{row.description || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.date ? format(new Date(row.date), "dd/MM/yyyy") : "-"} • {amount.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <Badge variant={selected ? "default" : "outline"}>Score {score}</Badge>
                  </div>
                </button>
              );
            })}

            {candidates.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">Tidak ada kandidat ditemukan.</div>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={!selectedId}>
            Gunakan baris ini
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
