import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library";
import { X, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (codeText: string, format: string) => void;
}

export default function BarcodeScannerModal({
  isOpen = false,
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      setError("");
      
      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Get available video devices
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(device => device.kind === "videoinput");
      setDevices(cameras);
      
      if (cameras.length > 0) {
        // Prefer back camera on mobile
        const backCamera = cameras.find(d => 
          d.label.toLowerCase().includes("back") || 
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
        );
        setSelectedDeviceId(backCamera?.deviceId || cameras[0].deviceId);
      }
    } catch (err: any) {
      console.error("Camera initialization error:", err);
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      toast({
        title: "Error",
        description: "Tidak dapat mengakses kamera",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedDeviceId && isOpen) {
      startScanning();
    }
  }, [selectedDeviceId, isOpen]);

  const startScanning = async () => {
    if (!selectedDeviceId || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError("");

      // Configure hints for supported formats
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.DATA_MATRIX,
      ]);

      codeReaderRef.current = new BrowserMultiFormatReader(hints);

      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const codeText = result.getText();
            const format = BarcodeFormat[result.getBarcodeFormat()];
            
            stopScanning();
            onScanSuccess(codeText, format);
            onClose();
            
            toast({
              title: "Barcode Terdeteksi",
              description: `Format: ${format}`,
            });
          }
        }
      );
    } catch (err: any) {
      console.error("Scanning error:", err);
      setError("Gagal memulai scanner. Coba lagi.");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    setIsScanning(false);
  };

  const switchCamera = () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    stopScanning();
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Arahkan kamera ke barcode (EAN, UPC, QR, Code128, Code39)
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={initializeScanner}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          ) : (
            <>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-40 border-2 border-green-500 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 rounded-tl" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 rounded-br" />
                    
                    {/* Scanning line animation */}
                    {isScanning && (
                      <div className="absolute left-0 right-0 h-0.5 bg-green-500 animate-pulse" 
                           style={{ top: '50%' }} />
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded ${isScanning ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
                    {isScanning ? "Scanning..." : "Initializing..."}
                  </span>
                  
                  {devices.length > 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={switchCamera}
                      className="h-8"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Switch
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-2">
                Posisikan barcode di dalam kotak hijau
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
