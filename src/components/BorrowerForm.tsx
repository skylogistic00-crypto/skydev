import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface BorrowerFormProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function BorrowerForm({
  open,
  onClose,
  onAdded,
}: BorrowerFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerType, setBorrowerType] = useState("");
  const [identityType, setIdentityType] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [notes, setNotes] = useState("");
  const [lateFeePercentage, setLateFeePercentage] = useState("0.1");
  const [taxType, setTaxType] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [loanCalculationMethod, setLoanCalculationMethod] = useState("Anuitas");

  const resetForm = () => {
    setBorrowerName("");
    setBorrowerType("");
    setIdentityType("");
    setIdentityNumber("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBankName("");
    setBankAccountNumber("");
    setBankAccountName("");
    setCreditLimit("");
    setNotes("");
    setLateFeePercentage("0.1");
    setTaxType("");
    setTaxPercentage("0");
    setLoanCalculationMethod("Anuitas");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerName || !borrowerType) {
      toast({
        title: "⚠️ Peringatan",
        description: "Nama dan tipe peminjam wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("borrowers").insert({
        borrower_name: borrowerName,
        borrower_type: borrowerType,
        identity_type: identityType || null,
        identity_number: identityNumber || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        bank_name: bankName || null,
        bank_account_number: bankAccountNumber || null,
        bank_account_name: bankAccountName || null,
        credit_limit: creditLimit ? Number(creditLimit) : null,
        default_late_fee_percentage: lateFeePercentage
          ? Number(lateFeePercentage)
          : 0.1,
        default_tax_type: taxType || null,
        default_tax_percentage: taxPercentage ? Number(taxPercentage) : 0,
        loan_calculation_method: loanCalculationMethod,
        notes: notes || null,
        status: "Aktif",
      });

      if (error) throw error;

      toast({
        title: "✅ Berhasil",
        description: "Peminjam berhasil ditambahkan",
      });

      resetForm();
      onAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding borrower:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Gagal menambahkan peminjam",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Tambah Peminjam Baru</DialogTitle>
          <DialogDescription>
            Isi informasi peminjam untuk menambahkan data baru
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Informasi Dasar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="borrower_name">Nama Peminjam *</Label>
                <Input
                  id="borrower_name"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="PT. ABC / John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="borrower_type">Tipe Peminjam *</Label>
                <Select value={borrowerType} onValueChange={setBorrowerType}>
                  <SelectTrigger id="borrower_type">
                    <SelectValue placeholder="-- pilih --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individu">Individu</SelectItem>
                    <SelectItem value="Perusahaan">Perusahaan</SelectItem>
                    <SelectItem value="Lembaga">Lembaga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="identity_type">Tipe Identitas</Label>
                <Select value={identityType} onValueChange={setIdentityType}>
                  <SelectTrigger id="identity_type">
                    <SelectValue placeholder="-- pilih --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KTP">KTP</SelectItem>
                    <SelectItem value="NPWP">NPWP</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                    <SelectItem value="SIUP">SIUP</SelectItem>
                    <SelectItem value="NIB">NIB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identity_number">Nomor Identitas</Label>
                <Input
                  id="identity_number"
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  placeholder="1234567890123456"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Informasi Kontak
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat lengkap"
                rows={2}
              />
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Informasi Bank
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Nama Bank</Label>
                <Input
                  id="bank_name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="BCA, Mandiri, BNI, dll"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Nomor Rekening</Label>
                <Input
                  id="bank_account_number"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_name">Nama Pemilik Rekening</Label>
              <Input
                id="bank_account_name"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="Nama sesuai rekening"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Informasi Tambahan
            </h3>

            <div className="space-y-2">
              <Label htmlFor="credit_limit">Limit Kredit (Rp)</Label>
              <Input
                id="credit_limit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan"
                rows={3}
              />
            </div>
          </div>

          {/* Late Fee & Tax Settings */}
          <div className="space-y-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-orange-900">
              ⚙️ Pengaturan Default Denda & Pajak
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan_calculation_method">
                  Metode Perhitungan Pinjaman
                </Label>
                <Select
                  value={loanCalculationMethod}
                  onValueChange={setLoanCalculationMethod}
                >
                  <SelectTrigger id="loan_calculation_method">
                    <SelectValue placeholder="-- pilih --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Anuitas">
                      Anuitas (Total Cicilan Tetap)
                    </SelectItem>
                    <SelectItem value="Flat Rate">
                      Flat Rate (Pokok Tetap)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">Default: Anuitas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="late_fee_percentage">
                  Denda Keterlambatan per Hari (%)
                </Label>
                <Input
                  id="late_fee_percentage"
                  type="number"
                  step="0.01"
                  value={lateFeePercentage}
                  onChange={(e) => setLateFeePercentage(e.target.value)}
                  placeholder="0.1"
                />
                <p className="text-xs text-gray-600">Default: 0.1% per hari</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_type">Jenis Pajak Default</Label>
                <Select value={taxType} onValueChange={setTaxType}>
                  <SelectTrigger id="tax_type">
                    <SelectValue placeholder="-- pilih --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PPh21">PPh 21 (Gaji)</SelectItem>
                    <SelectItem value="PPh23">PPh 23 (Jasa)</SelectItem>
                    <SelectItem value="PPh4(2)">PPh 4(2) (Final)</SelectItem>
                    <SelectItem value="PPN">PPN</SelectItem>
                    <SelectItem value="PPnBM">PPnBM</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_percentage">
                  Persentase Pajak Default (%)
                </Label>
                <Input
                  id="tax_percentage"
                  type="number"
                  step="0.01"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-orange-100 p-3 rounded">
              <p className="text-xs text-orange-800">
                💡 Pengaturan ini akan digunakan sebagai default saat membuat
                pinjaman untuk peminjam ini
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
