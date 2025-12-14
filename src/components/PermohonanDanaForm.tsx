import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { Calendar } from "lucide-react";

interface PermohonanDanaFormProps {
  onSuccess?: () => void;
}

export default function PermohonanDanaForm({
  onSuccess,
}: PermohonanDanaFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_pemohon: "",
    departemen: "",
    tanggal_permohonan: "",
    jumlah: "",
    keterangan: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert permohonan dana
      const { data: permohonan, error: permohonanError } = await supabase
        .from("permohonan_dana")
        .insert([
          {
            nama_pemohon: formData.nama_pemohon,
            departemen: formData.departemen,
            tanggal_permohonan: formData.tanggal_permohonan,
            jumlah: parseFloat(formData.jumlah),
            keterangan: formData.keterangan,
            created_by: user?.id,
            status: "PENDING",
          },
        ])
        .select()
        .single();

      if (permohonanError) throw permohonanError;

      // Create journal entries (double entry bookkeeping)
      const journalEntries = [
        {
          transaction_id: permohonan.id,
          transaction_date: formData.tanggal_permohonan,
          account_code: "2-1100",
          account_name: "Hutang Usaha",
          debit: parseFloat(formData.jumlah),
          credit: 0,
          description: `Permohonan dana - ${formData.nama_pemohon} - ${formData.keterangan}`,
        },
        {
          transaction_id: permohonan.id,
          transaction_date: formData.tanggal_permohonan,
          account_code: "5-1100",
          account_name: "Beban Operasional",
          debit: 0,
          credit: parseFloat(formData.jumlah),
          description: `Permohonan dana - ${formData.nama_pemohon} - ${formData.keterangan}`,
        },
      ];

      // Use RPC function to insert journal entries
      const { error: journalError } = await supabase.rpc(
        "insert_journal_entries",
        {
          entries: journalEntries,
        },
      );

      if (journalError) {
        console.error("Journal error:", journalError);
        toast({
          title: "Warning",
          description: "Permohonan dana tersimpan tapi jurnal gagal dibuat",
          variant: "destructive",
        });
      }

      toast({
        title: "Berhasil!",
        description:
          "Permohonan dana berhasil dibuat dan jurnal entries telah dicatat.",
      });

      // Reset form
      setFormData({
        nama_pemohon: "",
        departemen: "",
        tanggal_permohonan: "",
        jumlah: "",
        keterangan: "",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Terjadi kesalahan saat membuat permohonan dana",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-8">
        Form Permohonan Dana
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label
            htmlFor="nama_pemohon"
            className="text-slate-700 font-medium mb-2 block"
          >
            Nama Pemohon
          </Label>
          <Input
            id="nama_pemohon"
            type="text"
            value={formData.nama_pemohon}
            onChange={(e) =>
              setFormData({ ...formData, nama_pemohon: e.target.value })
            }
            required
            className="w-full border-slate-200 rounded-xl py-6 text-base"
            placeholder=""
          />
        </div>

        <div>
          <Label
            htmlFor="departemen"
            className="text-slate-700 font-medium mb-2 block"
          >
            Departemen
          </Label>
          <Input
            id="departemen"
            type="text"
            value={formData.departemen}
            onChange={(e) =>
              setFormData({ ...formData, departemen: e.target.value })
            }
            required
            className="w-full border-slate-200 rounded-xl py-6 text-base"
            placeholder=""
          />
        </div>

        <div>
          <Label
            htmlFor="tanggal_permohonan"
            className="text-slate-700 font-medium mb-2 block"
          >
            Tanggal Permohonan
          </Label>
          <div className="relative">
            <Input
              id="tanggal_permohonan"
              type="date"
              value={formData.tanggal_permohonan}
              onChange={(e) =>
                setFormData({ ...formData, tanggal_permohonan: e.target.value })
              }
              required
              className="w-full border-slate-200 rounded-xl py-6 text-base"
              placeholder="DD/MM/YYYY"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="jumlah"
            className="text-slate-700 font-medium mb-2 block"
          >
            Jumlah
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
              Rp
            </span>
            <Input
              id="jumlah"
              type="number"
              step="0.01"
              value={formData.jumlah}
              onChange={(e) =>
                setFormData({ ...formData, jumlah: e.target.value })
              }
              required
              className="w-full border-slate-200 rounded-xl py-6 pl-12 text-base"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="keterangan"
            className="text-slate-700 font-medium mb-2 block"
          >
            Keterangan
          </Label>
          <Textarea
            id="keterangan"
            value={formData.keterangan}
            onChange={(e) =>
              setFormData({ ...formData, keterangan: e.target.value })
            }
            className="w-full border-slate-200 rounded-xl py-4 text-base min-h-[100px]"
            placeholder="Masukkan keterangan"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-6 rounded-xl text-lg shadow-lg"
        >
          {loading ? "Mengirim..." : "Kirim"}
        </Button>
      </form>
    </div>
  );
}
