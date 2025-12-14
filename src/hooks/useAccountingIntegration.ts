import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

export interface JournalLine {
  account_code: string;
  account_name?: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalPayload {
  ref: string;
  type: "SALE" | "PURCHASE" | "STOCK_ADJ";
  lines: JournalLine[];
  memo?: string;
}

export interface AccountMapping {
  id: string;
  account_type: string;
  account_code: string;
  account_name: string;
  description: string;
  is_active: boolean;
}

export interface IntegrationLog {
  id: string;
  source: string;
  action: string;
  reference_type: string;
  reference_id: string;
  reference_number: string;
  request_payload: any;
  response_payload: any;
  status: "success" | "error" | "skipped";
  error_message: string;
  created_at: string;
}

export function useAccountingIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [accountMappings, setAccountMappings] = useState<AccountMapping[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const { toast } = useToast();

  const fetchAccountMappings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("account_mappings")
        .select("*")
        .eq("is_active", true)
        .order("account_type");

      if (error) throw error;
      setAccountMappings(data || []);
      return data || [];
    } catch (err: any) {
      console.error("Fetch account mappings error:", err);
      toast({
        title: "Error",
        description: "Gagal mengambil data mapping akun",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateAccountMapping = useCallback(
    async (accountType: string, accountCode: string, accountName: string) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("account_mappings")
          .update({ account_code: accountCode, account_name: accountName })
          .eq("account_type", accountType)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: `Mapping akun ${accountType} berhasil diperbarui`,
        });

        return data;
      } catch (err: any) {
        console.error("Update account mapping error:", err);
        toast({
          title: "Error",
          description: "Gagal memperbarui mapping akun",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const createJournalFromPayload = useCallback(
    async (payload: JournalPayload) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc("create_journal_from_payload", {
          p_ref: payload.ref,
          p_type: payload.type,
          p_lines: JSON.stringify(payload.lines),
          p_memo: payload.memo || null,
          p_source: "manual",
        });

        if (error) throw error;

        if (data.success) {
          toast({
            title: "Jurnal Dibuat",
            description: `Jurnal ${payload.ref} berhasil dibuat`,
          });
        } else if (data.error === "duplicate") {
          toast({
            title: "Duplikat",
            description: data.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          });
        }

        return data;
      } catch (err: any) {
        console.error("Create journal error:", err);
        toast({
          title: "Error",
          description: "Gagal membuat jurnal",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const fetchIntegrationLogs = useCallback(
    async (filters?: {
      source?: string;
      status?: string;
      reference_type?: string;
      limit?: number;
    }) => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("integration_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (filters?.source) {
          query = query.eq("source", filters.source);
        }
        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.reference_type) {
          query = query.eq("reference_type", filters.reference_type);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        setIntegrationLogs(data || []);
        return data || [];
      } catch (err: any) {
        console.error("Fetch integration logs error:", err);
        toast({
          title: "Error",
          description: "Gagal mengambil log integrasi",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const getAccountCode = useCallback(
    (accountType: string): string | null => {
      const mapping = accountMappings.find((m) => m.account_type === accountType);
      return mapping?.account_code || null;
    },
    [accountMappings]
  );

  return {
    isLoading,
    accountMappings,
    integrationLogs,
    fetchAccountMappings,
    updateAccountMapping,
    createJournalFromPayload,
    fetchIntegrationLogs,
    getAccountCode,
  };
}
