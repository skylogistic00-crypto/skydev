import { useState, useRef } from "react";
import {
  ShoppingCart,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  X,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { usePOS, CartItem, ReceiptData } from "@/hooks/usePOS";
import BarcodeScannerModal from "./BarcodeScannerModal";
import { navigateBack } from "@/utils/navigation";

export default function POSTerminal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    cart,
    totalAmount,
    totalItems,
    isLoading,
    scanAndAddToCart,
    updateQuantity,
    updatePrice,
    removeFromCart,
    clearCart,
    checkout,
  } = usePOS();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);

  const changeAmount = parseFloat(paymentAmount || "0") - totalAmount;

  const handleScanSuccess = async (codeText: string, format: string) => {
    await scanAndAddToCart(codeText);
    setIsScannerOpen(false);
  };

  const handleManualBarcode = async () => {
    if (!manualBarcode.trim()) return;
    await scanAndAddToCart(manualBarcode.trim());
    setManualBarcode("");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang kosong",
        variant: "destructive",
      });
      return;
    }

    const payment = parseFloat(paymentAmount || "0");
    if (payment < totalAmount) {
      toast({
        title: "Error",
        description: "Pembayaran kurang dari total",
        variant: "destructive",
      });
      return;
    }

    const result = await checkout(paymentMethod, payment, customerName, notes);
    if (result) {
      setReceiptData(result.receipt);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      setPaymentAmount("");
      setCustomerName("");
      setNotes("");
    }
  };

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Struk - ${receiptData?.transaction_number}</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; }
                .header { text-align: center; margin-bottom: 10px; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; }
                .item { display: flex; justify-content: space-between; }
                .total { font-weight: bold; font-size: 14px; }
                .footer { text-align: center; margin-top: 10px; font-size: 10px; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleEditPrice = (item: CartItem) => {
    setEditingItemId(item.id);
    setEditPrice(item.price.toString());
  };

  const saveEditPrice = (itemId: string) => {
    const newPrice = parseFloat(editPrice);
    if (!isNaN(newPrice) && newPrice >= 0) {
      updatePrice(itemId, newPrice);
    }
    setEditingItemId(null);
    setEditPrice("");
  };

  const quickPaymentAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateBack(navigate)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                POS Terminal
              </h1>
              <p className="text-emerald-100 text-sm">Point of Sale System</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsScannerOpen(true)}
              className="gap-2"
            >
              <Barcode className="h-4 w-4" />
              Scan Barcode
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Scanner & Product Entry */}
          <div className="lg:col-span-2 space-y-4">
            {/* Manual Barcode Input */}
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Barcode className="h-5 w-5" />
                  Input Barcode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik atau scan barcode..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleManualBarcode();
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleManualBarcode}
                    disabled={isLoading || !manualBarcode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isLoading ? "Loading..." : "Tambah"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsScannerOpen(true)}
                    className="gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Kamera
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart Items */}
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Keranjang ({totalItems} item)
                  </span>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Kosongkan
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Keranjang kosong</p>
                    <p className="text-sm">Scan barcode untuk menambah produk</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-500">
                            SKU: {item.sku}
                          </p>
                          {editingItemId === item.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-32 h-8"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEditPrice(item.id);
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => saveEditPrice(item.id)}
                              >
                                OK
                              </Button>
                            </div>
                          ) : (
                            <p
                              className="text-emerald-600 font-semibold cursor-pointer hover:underline"
                              onClick={() => handleEditPrice(item)}
                            >
                              Rp {item.price.toLocaleString("id-ID")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right w-28">
                          <p className="font-semibold">
                            Rp {item.subtotal.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Summary & Checkout */}
          <div className="space-y-4">
            <Card className="bg-white shadow-md">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardTitle className="text-lg">Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Diskon</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-emerald-600">
                        Rp {totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                  disabled={cart.length === 0 || isLoading}
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Bayar
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Barcode className="h-4 w-4 mr-2" />
                  Scan
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pembayaran
            </DialogTitle>
            <DialogDescription>
              Total: Rp {totalAmount.toLocaleString("id-ID")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <span className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Tunai
                    </span>
                  </SelectItem>
                  <SelectItem value="card">
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Kartu
                    </span>
                  </SelectItem>
                  <SelectItem value="qris">
                    <span className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QRIS
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jumlah Bayar</Label>
              <Input
                type="number"
                placeholder="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {quickPaymentAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(amount.toString())}
                  >
                    {(amount / 1000).toFixed(0)}K
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount(totalAmount.toString())}
                >
                  Pas
                </Button>
              </div>
            </div>

            {changeAmount >= 0 && paymentAmount && (
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">Kembalian</p>
                <p className="text-xl font-bold text-emerald-600">
                  Rp {changeAmount.toLocaleString("id-ID")}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nama Pelanggan (Opsional)</Label>
              <Input
                placeholder="Nama pelanggan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Input
                placeholder="Catatan transaksi"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={
                isLoading ||
                !paymentAmount ||
                parseFloat(paymentAmount) < totalAmount
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? "Processing..." : "Konfirmasi Bayar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Struk Pembayaran
            </DialogTitle>
          </DialogHeader>

          {receiptData && (
            <div ref={receiptRef} className="bg-white p-4 font-mono text-sm">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">STRUK PEMBAYARAN</h3>
                <p className="text-xs text-slate-500">
                  {new Date(receiptData.date).toLocaleString("id-ID")}
                </p>
                <p className="font-semibold">{receiptData.transaction_number}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="w-16 text-right">x{item.qty}</span>
                    <span className="w-24 text-right">
                      {item.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 my-2" />

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{receiptData.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span>{receiptData.total.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar ({receiptData.payment_method})</span>
                  <span>
                    {receiptData.payment_amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kembalian</span>
                  <span>{receiptData.change.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {receiptData.customer_name && (
                <>
                  <div className="border-t border-dashed border-slate-300 my-2" />
                  <p className="text-center">
                    Pelanggan: {receiptData.customer_name}
                  </p>
                </>
              )}

              <div className="border-t border-dashed border-slate-300 my-2" />
              <p className="text-center text-xs text-slate-500">
                Terima kasih atas kunjungan Anda!
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handlePrintReceipt} className="gap-2">
              <Printer className="h-4 w-4" />
              Cetak Struk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
