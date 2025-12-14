import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface TestComponentProps {
  title?: string;
  description?: string;
  showButton?: boolean;
}

export default function TestComponent({ 
  title = "Test Component", 
  description = "This is a simple test component",
  showButton = true 
}: TestComponentProps) {
  return (
    <div className="bg-white min-h-screen p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Component berhasil dibuat dan siap digunakan!
          </p>
          {showButton && (
            <Button className="w-full">
              Click Me
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
