import { useState } from "react";
import { FileText, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface OCRResultCardProps {
  extractedText: string;
  imageUrl?: string;
  timestamp?: string;
  onClose?: () => void;
  onApply?: (text: string) => void;
}

export default function OCRResultCard({
  extractedText = "",
  imageUrl,
  timestamp,
  onClose,
  onApply,
}: OCRResultCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Tersalin",
      description: "Teks berhasil disalin ke clipboard",
    });
  };

  const handleApply = () => {
    if (onApply) {
      onApply(extractedText);
      toast({
        title: "Diterapkan",
        description: "Teks OCR telah diterapkan ke form",
      });
    }
  };

  return (
    <Card className="bg-white shadow-lg border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Hasil OCR</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Berhasil
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {timestamp && (
          <CardDescription className="text-xs">
            {new Date(timestamp).toLocaleString("id-ID")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-slate-200">
            <img
              src={imageUrl}
              alt="Scanned document"
              className="w-full h-auto max-h-48 object-contain bg-slate-50"
            />
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">
            Teks Terekstrak:
          </p>
          <div className="bg-white rounded p-3 border border-slate-200 max-h-48 overflow-y-auto">
            <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
              {extractedText || "Tidak ada teks terdeteksi"}
            </pre>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Salin Teks
              </>
            )}
          </Button>
          {onApply && (
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleApply}
            >
              Terapkan ke Form
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
