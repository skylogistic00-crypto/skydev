import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export type InvoiceExtractionPreview = {
  invoice_number: string | null;
  invoice_date: string | null;
  dpp: number | null;
  total: number | null;
  ppn: number | null;
  pph: number | null;
  ocr_result: string;
  confidence_score: number;
};

export function InvoiceExtractionConfirmDialog({
  open,
  onOpenChange,
  preview,
  isSaving,
  onConfirm,
  mode = "confirm",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: InvoiceExtractionPreview | null;
  isSaving?: boolean;
  onConfirm?: (next: InvoiceExtractionPreview) => void;
  mode?: "confirm" | "view";
}) {
  const [draft, setDraft] = React.useState<InvoiceExtractionPreview | null>(preview);

  React.useEffect(() => {
    setDraft(preview);
  }, [preview, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Konfirmasi Extract Invoice</DialogTitle>
          <DialogDescription>
            Periksa hasil extract invoice. Jika sudah benar, klik Confirm untuk menyimpan.
          </DialogDescription>
        </DialogHeader>

        {!draft ? (
          <div className="text-sm text-muted-foreground">Tidak ada data.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={draft.invoice_number ?? ""}
                readOnly={mode === "view"}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, invoice_number: e.target.value || null } : p))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                placeholder="YYYY-MM-DD"
                value={draft.invoice_date ?? ""}
                readOnly={mode === "view"}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, invoice_date: e.target.value || null } : p))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>DPP</Label>
              <Input
                inputMode="decimal"
                value={draft.dpp ?? ""}
                readOnly={mode === "view"}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, dpp: e.target.value === "" ? null : Number(e.target.value) } : p))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>PPN</Label>
              <Input
                inputMode="decimal"
                value={draft.ppn ?? ""}
                readOnly={mode === "view"}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, ppn: e.target.value === "" ? null : Number(e.target.value) } : p))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>PPh</Label>
              <Input
                inputMode="decimal"
                value={draft.pph ?? ""}
                readOnly={mode === "view"}
                onChange={(e) =>
                  setDraft((p) => (p ? { ...p, pph: e.target.value === "" ? null : Number(e.target.value) } : p))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Total</Label>
              <Input
                inputMode="decimal"
                value={draft.total ?? ""}
                readOnly={mode === "view"}
                onChange={(e) =>
                  setDraft((p) =>
                    p ? { ...p, total: e.target.value === "" ? null : Number(e.target.value) } : p
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Confidence Score</Label>
              <Input value={String(draft.confidence_score ?? 0)} readOnly />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>OCR Result</Label>
              <Input value={draft.ocr_result ?? ""} readOnly />
            </div>
          </div>
        )}

        <DialogFooter>
          {mode === "confirm" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!draft) return;
                  onConfirm?.(draft);
                }}
                disabled={!draft || isSaving}
              >
                Confirm
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
