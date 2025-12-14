import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface JournalLine {
  account_code: string;
  account_name: string;
  dc: "D" | "C";
  amount: number;
}

interface JournalPreviewModalProps {
  open: boolean;
  onClose: () => void;
  lines: JournalLine[];
  memo: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function JournalPreviewModal({
  open,
  onClose,
  lines,
  memo,
  onConfirm,
  isLoading = false,
}: JournalPreviewModalProps) {
  const totalDebit = lines
    .filter((l) => l.dc === "D")
    .reduce((sum, l) => sum + l.amount, 0);
  const totalCredit = lines
    .filter((l) => l.dc === "C")
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview Jurnal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {memo && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Memo:</p>
              <p className="text-sm text-blue-700">{memo}</p>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">Kode Akun</th>
                  <th className="p-3 text-left">Nama Akun</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3 font-mono text-sm">
                      {line.account_code}
                    </td>
                    <td className="p-3">{line.account_name}</td>
                    <td className="p-3 text-right font-semibold">
                      {line.dc === "D"
                        ? new Intl.NumberFormat("id-ID").format(line.amount)
                        : "-"}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {line.dc === "C"
                        ? new Intl.NumberFormat("id-ID").format(line.amount)
                        : "-"}
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-slate-50 font-bold">
                  <td className="p-3" colSpan={2}>
                    Total
                  </td>
                  <td className="p-3 text-right">
                    {new Intl.NumberFormat("id-ID").format(totalDebit)}
                  </td>
                  <td className="p-3 text-right">
                    {new Intl.NumberFormat("id-ID").format(totalCredit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {totalDebit !== totalCredit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">
                ⚠️ Warning: Debit dan Credit tidak balance!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button onClick={onConfirm} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Konfirmasi & Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
