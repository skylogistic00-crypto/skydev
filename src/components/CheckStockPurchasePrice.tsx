import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CheckStockPurchasePrice() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const checkData = async () => {
      const { data, error } = await supabase
        .from("stock")
        .select("id, item_name, purchase_price, cost_per_unit, selling_price")
        .eq("item_name", "TOP Kopi Susu")
        .single();

      console.log("Direct query result:", data);
      console.log("Error:", error);
      setResult({ data, error });
    };

    checkData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Check Stock Purchase Price</h2>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
