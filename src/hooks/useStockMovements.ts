import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export interface StockMovement {
  id: string;
  sku: string;
  stock_id: string;
  movement_type: "in" | "out" | "adjustment";
  quantity: number;
  unit: string;
  cost_per_unit: number | null;
  total_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  batch_number: string | null;
  expired_date: string | null;
  location: string | null;
  warehouse_id: string | null;
  zone_id: string | null;
  rack_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncreaseStockParams {
  sku: string;
  qty: number;
  cost?: number;
  batch_number?: string;
  expired_date?: string;
  location?: string;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  notes?: string;
}

export interface DecreaseStockParams {
  sku: string;
  qty: number;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  notes?: string;
}

export interface StockOperationResult {
  success: boolean;
  stock_id: string;
  movement_id: string;
  previous_qty: number;
  new_qty: number;
  quantity_added?: number;
  quantity_removed?: number;
  total_cost?: number;
}

export function useStockMovements() {
  const [isLoading, setIsLoading] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const { toast } = useToast();

  const increaseStock = useCallback(
    async (params: IncreaseStockParams): Promise<StockOperationResult | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc("increase_stock", {
          p_sku: params.sku,
          p_qty: params.qty,
          p_cost: params.cost || null,
          p_batch_number: params.batch_number || null,
          p_expired_date: params.expired_date || null,
          p_location: params.location || null,
          p_reference_type: params.reference_type || null,
          p_reference_id: params.reference_id || null,
          p_reference_number: params.reference_number || null,
          p_notes: params.notes || null,
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Stok Berhasil Ditambah",
          description: `SKU: ${params.sku}, Qty: +${params.qty}`,
        });

        return data as StockOperationResult;
      } catch (err: any) {
        console.error("Increase stock error:", err);
        toast({
          title: "Error",
          description: err.message || "Gagal menambah stok",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const decreaseStock = useCallback(
    async (params: DecreaseStockParams): Promise<StockOperationResult | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc("decrease_stock", {
          p_sku: params.sku,
          p_qty: params.qty,
          p_reference_type: params.reference_type || null,
          p_reference_id: params.reference_id || null,
          p_reference_number: params.reference_number || null,
          p_notes: params.notes || null,
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Stok Berhasil Dikurangi",
          description: `SKU: ${params.sku}, Qty: -${params.qty}`,
        });

        return data as StockOperationResult;
      } catch (err: any) {
        console.error("Decrease stock error:", err);
        toast({
          title: "Error",
          description: err.message || "Gagal mengurangi stok",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const fetchMovements = useCallback(
    async (filters?: {
      sku?: string;
      movement_type?: "in" | "out" | "adjustment";
      start_date?: string;
      end_date?: string;
      limit?: number;
    }) => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("stock_movements")
          .select("*")
          .order("created_at", { ascending: false });

        if (filters?.sku) {
          query = query.eq("sku", filters.sku);
        }

        if (filters?.movement_type) {
          query = query.eq("movement_type", filters.movement_type);
        }

        if (filters?.start_date) {
          query = query.gte("created_at", filters.start_date);
        }

        if (filters?.end_date) {
          query = query.lte("created_at", filters.end_date);
        }

        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setMovements(data || []);
        return data || [];
      } catch (err: any) {
        console.error("Fetch movements error:", err);
        toast({
          title: "Error",
          description: "Gagal mengambil data pergerakan stok",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const getStockHistory = useCallback(
    async (sku: string, limit: number = 50) => {
      return fetchMovements({ sku, limit });
    },
    [fetchMovements]
  );

  return {
    isLoading,
    movements,
    increaseStock,
    decreaseStock,
    fetchMovements,
    getStockHistory,
  };
}
