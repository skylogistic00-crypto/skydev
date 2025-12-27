export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_mappings: {
        Row: {
          category: string
          created_at: string | null
          credit_account: string | null
          debit_account: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          credit_account?: string | null
          debit_account?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          credit_account?: string | null
          debit_account?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      accounting_events: {
        Row: {
          amount: number
          created_at: string | null
          credit_account: string | null
          debit_account: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          processed: boolean | null
          processed_at: string | null
          reference_id: string | null
          reference_number: string | null
          reference_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_account?: string | null
          debit_account?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_account?: string | null
          debit_account?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          processed?: boolean | null
          processed_at?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string
        }
        Relationships: []
      }
      ai_allowed_tables: {
        Row: {
          allowed_columns: string[] | null
          id: number
          schema_name: string | null
          table_name: string | null
        }
        Insert: {
          allowed_columns?: string[] | null
          id?: number
          schema_name?: string | null
          table_name?: string | null
        }
        Update: {
          allowed_columns?: string[] | null
          id?: number
          schema_name?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      ai_chat_logs: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          message: string | null
          meta: Json | null
          model: string | null
          role: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          meta?: Json | null
          model?: string | null
          role?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          meta?: Json | null
          model?: string | null
          role?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_keywords: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_credit_account: string | null
          default_debit_account: string | null
          default_transaction_type: string | null
          description: string | null
          id: string
          is_pph: boolean | null
          is_ppn: boolean | null
          keyword: string
          pph_type: string | null
          tax_profile_id: string | null
          tax_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_credit_account?: string | null
          default_debit_account?: string | null
          default_transaction_type?: string | null
          description?: string | null
          id?: string
          is_pph?: boolean | null
          is_ppn?: boolean | null
          keyword: string
          pph_type?: string | null
          tax_profile_id?: string | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_credit_account?: string | null
          default_debit_account?: string | null
          default_transaction_type?: string | null
          description?: string | null
          id?: string
          is_pph?: boolean | null
          is_ppn?: boolean | null
          keyword?: string
          pph_type?: string | null
          tax_profile_id?: string | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_learning_data: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          suggested_account_id: string | null
          transaction_id: string | null
          user_selected_account_id: string | null
          vendor_name: string | null
          was_accepted: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          suggested_account_id?: string | null
          transaction_id?: string | null
          user_selected_account_id?: string | null
          vendor_name?: string | null
          was_accepted?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          suggested_account_id?: string | null
          transaction_id?: string | null
          user_selected_account_id?: string | null
          vendor_name?: string | null
          was_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_data_suggested_account_id_fkey"
            columns: ["suggested_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_data_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_data_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transaction_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_data_user_selected_account_id_fkey"
            columns: ["user_selected_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          ai_result: Json | null
          confidence: number | null
          created_at: string | null
          id: string
          matched_account_code: string | null
          matched_account_name: string | null
          ocr_text: string | null
          process_type: string | null
          raw_input: string | null
          source_id: string | null
          source_table: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_result?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          matched_account_code?: string | null
          matched_account_name?: string | null
          ocr_text?: string | null
          process_type?: string | null
          raw_input?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_result?: Json | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          matched_account_code?: string | null
          matched_account_name?: string | null
          ocr_text?: string | null
          process_type?: string | null
          raw_input?: string | null
          source_id?: string | null
          source_table?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_mapping_logs: {
        Row: {
          confidence: number | null
          created_at: string | null
          credit_account_id: string | null
          debit_account_id: string | null
          id: string
          matches: Json | null
          payload: Json | null
          scope: string | null
          winner: Json | null
          winner_reason: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          credit_account_id?: string | null
          debit_account_id?: string | null
          id?: string
          matches?: Json | null
          payload?: Json | null
          scope?: string | null
          winner?: Json | null
          winner_reason?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          credit_account_id?: string | null
          debit_account_id?: string | null
          id?: string
          matches?: Json | null
          payload?: Json | null
          scope?: string | null
          winner?: Json | null
          winner_reason?: string | null
        }
        Relationships: []
      }
      ai_mapping_rules: {
        Row: {
          account_id: string
          account_role: string
          account_value: string | null
          created_at: string | null
          id: string
          match_field: string
          match_score: number | null
          match_value: string
          priority: number | null
          scope: string
        }
        Insert: {
          account_id: string
          account_role: string
          account_value?: string | null
          created_at?: string | null
          id?: string
          match_field: string
          match_score?: number | null
          match_value: string
          priority?: number | null
          scope: string
        }
        Update: {
          account_id?: string
          account_role?: string
          account_value?: string | null
          created_at?: string | null
          id?: string
          match_field?: string
          match_score?: number | null
          match_value?: string
          priority?: number | null
          scope?: string
        }
        Relationships: []
      }
      ai_query_logs: {
        Row: {
          allowed: boolean | null
          created_at: string | null
          error_text: string | null
          generated_sql: string | null
          id: string
          prompt: string | null
          rows_returned: number | null
          sanitized_sql: string | null
          user_id: string | null
        }
        Insert: {
          allowed?: boolean | null
          created_at?: string | null
          error_text?: string | null
          generated_sql?: string | null
          id?: string
          prompt?: string | null
          rows_returned?: number | null
          sanitized_sql?: string | null
          user_id?: string | null
        }
        Update: {
          allowed?: boolean | null
          created_at?: string | null
          error_text?: string | null
          generated_sql?: string | null
          id?: string
          prompt?: string | null
          rows_returned?: number | null
          sanitized_sql?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_role_whitelist: {
        Row: {
          allow_delete: boolean | null
          allow_insert: boolean | null
          allow_update: boolean | null
          allowed_columns: string[]
          id: number
          role: string
          table_name: string
        }
        Insert: {
          allow_delete?: boolean | null
          allow_insert?: boolean | null
          allow_update?: boolean | null
          allowed_columns: string[]
          id?: number
          role: string
          table_name: string
        }
        Update: {
          allow_delete?: boolean | null
          allow_insert?: boolean | null
          allow_update?: boolean | null
          allowed_columns?: string[]
          id?: number
          role?: string
          table_name?: string
        }
        Relationships: []
      }
      airwaybills: {
        Row: {
          arrival_airport_code: string
          arrival_date: string | null
          awb_number: string
          chargeable_weight_kg: number | null
          commodity_description: string | null
          consignee_address: string | null
          consignee_contact: string | null
          consignee_name: string | null
          consignee_npwp: string | null
          created_at: string
          created_by: string | null
          currency: string
          customs_clearance_date: string | null
          customs_declaration_number: string | null
          customs_status: Database["public"]["Enums"]["customs_status"] | null
          delivery_date: string | null
          delivery_order_number: string | null
          excise_duty: number
          flight_date: string | null
          flight_number: string | null
          freight_charge: number
          gross_weight_kg: number
          handling_fee: number
          hawb_number: string | null
          height_cm: number | null
          hs_code: string | null
          id: string
          import_duty: number
          import_type: Database["public"]["Enums"]["import_type"]
          incoterm: Database["public"]["Enums"]["incoterm_type"]
          insurance_fee: number
          invoice_number: string | null
          length_cm: number | null
          notify_party: string | null
          number_of_packages: number
          origin_airport_code: string
          other_charge: number
          other_taxes: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          pph_import: number
          ppn_import: number
          shipper_address: string | null
          shipper_name: string | null
          status: Database["public"]["Enums"]["airwaybill_status"]
          storage_fee: number
          storage_location: string | null
          total_charge: number | null
          total_taxes: number | null
          unloading_date: string | null
          updated_at: string
          updated_by: string | null
          value_of_goods: number | null
          volume_weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          arrival_airport_code: string
          arrival_date?: string | null
          awb_number: string
          chargeable_weight_kg?: number | null
          commodity_description?: string | null
          consignee_address?: string | null
          consignee_contact?: string | null
          consignee_name?: string | null
          consignee_npwp?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customs_clearance_date?: string | null
          customs_declaration_number?: string | null
          customs_status?: Database["public"]["Enums"]["customs_status"] | null
          delivery_date?: string | null
          delivery_order_number?: string | null
          excise_duty?: number
          flight_date?: string | null
          flight_number?: string | null
          freight_charge?: number
          gross_weight_kg: number
          handling_fee?: number
          hawb_number?: string | null
          height_cm?: number | null
          hs_code?: string | null
          id?: string
          import_duty?: number
          import_type?: Database["public"]["Enums"]["import_type"]
          incoterm?: Database["public"]["Enums"]["incoterm_type"]
          insurance_fee?: number
          invoice_number?: string | null
          length_cm?: number | null
          notify_party?: string | null
          number_of_packages: number
          origin_airport_code: string
          other_charge?: number
          other_taxes?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pph_import?: number
          ppn_import?: number
          shipper_address?: string | null
          shipper_name?: string | null
          status?: Database["public"]["Enums"]["airwaybill_status"]
          storage_fee?: number
          storage_location?: string | null
          total_charge?: number | null
          total_taxes?: number | null
          unloading_date?: string | null
          updated_at?: string
          updated_by?: string | null
          value_of_goods?: number | null
          volume_weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          arrival_airport_code?: string
          arrival_date?: string | null
          awb_number?: string
          chargeable_weight_kg?: number | null
          commodity_description?: string | null
          consignee_address?: string | null
          consignee_contact?: string | null
          consignee_name?: string | null
          consignee_npwp?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customs_clearance_date?: string | null
          customs_declaration_number?: string | null
          customs_status?: Database["public"]["Enums"]["customs_status"] | null
          delivery_date?: string | null
          delivery_order_number?: string | null
          excise_duty?: number
          flight_date?: string | null
          flight_number?: string | null
          freight_charge?: number
          gross_weight_kg?: number
          handling_fee?: number
          hawb_number?: string | null
          height_cm?: number | null
          hs_code?: string | null
          id?: string
          import_duty?: number
          import_type?: Database["public"]["Enums"]["import_type"]
          incoterm?: Database["public"]["Enums"]["incoterm_type"]
          insurance_fee?: number
          invoice_number?: string | null
          length_cm?: number | null
          notify_party?: string | null
          number_of_packages?: number
          origin_airport_code?: string
          other_charge?: number
          other_taxes?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pph_import?: number
          ppn_import?: number
          shipper_address?: string | null
          shipper_name?: string | null
          status?: Database["public"]["Enums"]["airwaybill_status"]
          storage_fee?: number
          storage_location?: string | null
          total_charge?: number | null
          total_taxes?: number | null
          unloading_date?: string | null
          updated_at?: string
          updated_by?: string | null
          value_of_goods?: number | null
          volume_weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: []
      }
      anomalies: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          reason?: string | null
        }
        Relationships: []
      }
      approval_transaksi: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_number: string | null
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bank_name: string | null
          bukti: string | null
          bukti_url: string | null
          coa_cash_code: string | null
          coa_expense_code: string | null
          coa_payable_code: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          description: string | null
          document_number: string | null
          entity_id: string | null
          id: string
          item_name: string | null
          jenis: string | null
          journal_ref: string | null
          notes: string | null
          ocr_data: string | null
          payment_method: string | null
          payment_type: string | null
          ppn_amount: number | null
          ppn_percentage: number | null
          quantity: number | null
          rejection_reason: string | null
          service_category: string | null
          service_type: string | null
          source: string | null
          subtotal: number | null
          supplier_name: string | null
          target_table: string | null
          total_amount: number | null
          transaction_date: string
          transaction_type: string | null
          type: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          bukti?: string | null
          bukti_url?: string | null
          coa_cash_code?: string | null
          coa_expense_code?: string | null
          coa_payable_code?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          description?: string | null
          document_number?: string | null
          entity_id?: string | null
          id?: string
          item_name?: string | null
          jenis?: string | null
          journal_ref?: string | null
          notes?: string | null
          ocr_data?: string | null
          payment_method?: string | null
          payment_type?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          rejection_reason?: string | null
          service_category?: string | null
          service_type?: string | null
          source?: string | null
          subtotal?: number | null
          supplier_name?: string | null
          target_table?: string | null
          total_amount?: number | null
          transaction_date: string
          transaction_type?: string | null
          type?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          account_number?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string | null
          bukti?: string | null
          bukti_url?: string | null
          coa_cash_code?: string | null
          coa_expense_code?: string | null
          coa_payable_code?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          description?: string | null
          document_number?: string | null
          entity_id?: string | null
          id?: string
          item_name?: string | null
          jenis?: string | null
          journal_ref?: string | null
          notes?: string | null
          ocr_data?: string | null
          payment_method?: string | null
          payment_type?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          rejection_reason?: string | null
          service_category?: string | null
          service_type?: string | null
          source?: string | null
          subtotal?: number | null
          supplier_name?: string | null
          target_table?: string | null
          total_amount?: number | null
          transaction_date?: string
          transaction_type?: string | null
          type?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_depreciation: {
        Row: {
          accumulated_depreciation: number | null
          asset_id: string
          book_value: number | null
          created_at: string | null
          created_by: string | null
          depreciation_amount: number
          depreciation_method: string | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          period: string
          period_month: number
          period_year: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accumulated_depreciation?: number | null
          asset_id: string
          book_value?: number | null
          created_at?: string | null
          created_by?: string | null
          depreciation_amount: number
          depreciation_method?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period: string
          period_month: number
          period_year: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accumulated_depreciation?: number | null
          asset_id?: string
          book_value?: number | null
          created_at?: string | null
          created_by?: string | null
          depreciation_amount?: number
          depreciation_method?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          period?: string
          period_month?: number
          period_year?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciation_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciation_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_depreciation_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "v_wms_reversal_audit"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "asset_depreciation_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "view_general_ledger"
            referencedColumns: ["journal_id"]
          },
          {
            foreignKeyName: "asset_depreciation_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "vw_journal_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_depreciation_schedule: {
        Row: {
          amount: number
          asset_id: string | null
          created_at: string | null
          id: string
          period: string
          posted: boolean | null
        }
        Insert: {
          amount: number
          asset_id?: string | null
          created_at?: string | null
          id?: string
          period: string
          posted?: boolean | null
        }
        Update: {
          amount?: number
          asset_id?: string | null
          created_at?: string | null
          id?: string
          period?: string
          posted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciation_schedule_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_disposals: {
        Row: {
          asset_id: string | null
          book_value: number | null
          created_at: string | null
          disposal_amount: number | null
          disposal_date: string | null
          gain_loss: number | null
          id: string
        }
        Insert: {
          asset_id?: string | null
          book_value?: number | null
          created_at?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          gain_loss?: number | null
          id?: string
        }
        Update: {
          asset_id?: string | null
          book_value?: number | null
          created_at?: string | null
          disposal_amount?: number | null
          disposal_date?: string | null
          gain_loss?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_disposals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisition_cost: number | null
          acquisition_date: string | null
          asset_category: string
          asset_name: string
          coa_account_code: string | null
          created_at: string | null
          created_by: string | null
          current_book_value: number | null
          depreciation_method: string | null
          depreciation_start_date: string | null
          description: string | null
          id: string
          location: string | null
          salvage_value: number | null
          serial_number: string | null
          status: string | null
          total_depreciation: number | null
          updated_at: string | null
          useful_life_years: number | null
        }
        Insert: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          asset_category: string
          asset_name: string
          coa_account_code?: string | null
          created_at?: string | null
          created_by?: string | null
          current_book_value?: number | null
          depreciation_method?: string | null
          depreciation_start_date?: string | null
          description?: string | null
          id?: string
          location?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          total_depreciation?: number | null
          updated_at?: string | null
          useful_life_years?: number | null
        }
        Update: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          asset_category?: string
          asset_name?: string
          coa_account_code?: string | null
          created_at?: string | null
          created_by?: string | null
          current_book_value?: number | null
          depreciation_method?: string | null
          depreciation_start_date?: string | null
          description?: string | null
          id?: string
          location?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          total_depreciation?: number | null
          updated_at?: string | null
          useful_life_years?: number | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          attendance_date: string
          clock_in: string | null
          clock_in_location: string | null
          clock_in_photo_url: string | null
          clock_out: string | null
          clock_out_location: string | null
          clock_out_photo_url: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          notes: string | null
          overtime_hours: number | null
          status: string | null
          updated_at: string | null
          work_hours: number | null
        }
        Insert: {
          attendance_date: string
          clock_in?: string | null
          clock_in_location?: string | null
          clock_in_photo_url?: string | null
          clock_out?: string | null
          clock_out_location?: string | null
          clock_out_photo_url?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          updated_at?: string | null
          work_hours?: number | null
        }
        Update: {
          attendance_date?: string
          clock_in?: string | null
          clock_in_location?: string | null
          clock_in_photo_url?: string | null
          clock_out?: string | null
          clock_out_location?: string | null
          clock_out_photo_url?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          status?: string | null
          updated_at?: string | null
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          payload: Json | null
          resource: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json | null
          resource?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          payload?: Json | null
          resource?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bank_mutasi_mapping: {
        Row: {
          akun: string | null
          bank_name: string | null
          coa_account_code: string | null
          created_at: string | null
          dk: string | null
          file_type: string | null
          id: string
          is_active: boolean | null
          kategori: string | null
          keyword: string | null
          pic: string | null
          pos: string | null
          priority: number | null
          sub_akun: string | null
        }
        Insert: {
          akun?: string | null
          bank_name?: string | null
          coa_account_code?: string | null
          created_at?: string | null
          dk?: string | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          kategori?: string | null
          keyword?: string | null
          pic?: string | null
          pos?: string | null
          priority?: number | null
          sub_akun?: string | null
        }
        Update: {
          akun?: string | null
          bank_name?: string | null
          coa_account_code?: string | null
          created_at?: string | null
          dk?: string | null
          file_type?: string | null
          id?: string
          is_active?: boolean | null
          kategori?: string | null
          keyword?: string | null
          pic?: string | null
          pos?: string | null
          priority?: number | null
          sub_akun?: string | null
        }
        Relationships: []
      }
      bank_mutation_approvals: {
        Row: {
          approval_status: string
          approver_id: string
          comments: string | null
          created_at: string | null
          id: string
          upload_id: string
        }
        Insert: {
          approval_status: string
          approver_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          upload_id: string
        }
        Update: {
          approval_status?: string
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_mutation_approvals_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "bank_mutation_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_mutation_uploads: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bank_account_code: string | null
          bank_account_id: string | null
          bank_account_name: string | null
          bank_name: string | null
          created_at: string | null
          created_by: string | null
          duplicate_records: number | null
          error_records: number | null
          file_name: string | null
          file_path: string | null
          file_size: number
          file_type: string | null
          id: string
          metadata: Json | null
          mime_type: string
          original_filename: string
          processed_records: number | null
          processing_error: string | null
          rejection_reason: string | null
          status: string | null
          total_records: number | null
          total_rows: number | null
          updated_at: string | null
          upload_status: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_code?: string | null
          bank_account_id?: string | null
          bank_account_name?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          duplicate_records?: number | null
          error_records?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number
          file_type?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          original_filename: string
          processed_records?: number | null
          processing_error?: string | null
          rejection_reason?: string | null
          status?: string | null
          total_records?: number | null
          total_rows?: number | null
          updated_at?: string | null
          upload_status?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_code?: string | null
          bank_account_id?: string | null
          bank_account_name?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          duplicate_records?: number | null
          error_records?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number
          file_type?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          original_filename?: string
          processed_records?: number | null
          processing_error?: string | null
          rejection_reason?: string | null
          status?: string | null
          total_records?: number | null
          total_rows?: number | null
          updated_at?: string | null
          upload_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_mutations: {
        Row: {
          akun: string | null
          amount: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          balance: number | null
          bank_account_code: string | null
          bank_account_id: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string
          bank_reference_id: string | null
          created_at: string | null
          created_by: string | null
          credit: string | null
          debit: string | null
          description: string | null
          duplicate_of: string | null
          id: string
          is_duplicate: boolean | null
          journal_entry_id: string | null
          kas_bank: string | null
          mapping_status: string | null
          matched: string | null
          matched_at: string | null
          matched_transaction_id: string | null
          mutation_date: string | null
          ocr_confidence: number | null
          ocr_data: Json | null
          pic: string | null
          pos: string | null
          posted_at: string | null
          pp: string | null
          processed: string | null
          raw_data: Json | null
          raw_payload: string | null
          source: string | null
          status: string | null
          sub_akun: string | null
          transaction_date: string
          transaction_type: string
          type: string | null
          updated_at: string | null
          upload_id: string
          user_id: string
        }
        Insert: {
          akun?: string | null
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          balance?: number | null
          bank_account_code?: string | null
          bank_account_id?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name: string
          bank_reference_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit?: string | null
          debit?: string | null
          description?: string | null
          duplicate_of?: string | null
          id?: string
          is_duplicate?: boolean | null
          journal_entry_id?: string | null
          kas_bank?: string | null
          mapping_status?: string | null
          matched?: string | null
          matched_at?: string | null
          matched_transaction_id?: string | null
          mutation_date?: string | null
          ocr_confidence?: number | null
          ocr_data?: Json | null
          pic?: string | null
          pos?: string | null
          posted_at?: string | null
          pp?: string | null
          processed?: string | null
          raw_data?: Json | null
          raw_payload?: string | null
          source?: string | null
          status?: string | null
          sub_akun?: string | null
          transaction_date: string
          transaction_type: string
          type?: string | null
          updated_at?: string | null
          upload_id: string
          user_id: string
        }
        Update: {
          akun?: string | null
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          balance?: number | null
          bank_account_code?: string | null
          bank_account_id?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string
          bank_reference_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit?: string | null
          debit?: string | null
          description?: string | null
          duplicate_of?: string | null
          id?: string
          is_duplicate?: boolean | null
          journal_entry_id?: string | null
          kas_bank?: string | null
          mapping_status?: string | null
          matched?: string | null
          matched_at?: string | null
          matched_transaction_id?: string | null
          mutation_date?: string | null
          ocr_confidence?: number | null
          ocr_data?: Json | null
          pic?: string | null
          pos?: string | null
          posted_at?: string | null
          pp?: string | null
          processed?: string | null
          raw_data?: Json | null
          raw_payload?: string | null
          source?: string | null
          status?: string | null
          sub_akun?: string | null
          transaction_date?: string
          transaction_type?: string
          type?: string | null
          updated_at?: string | null
          upload_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_mutations_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "bank_mutations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_mutations_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "bank_mutation_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_mutations_staging: {
        Row: {
          amount: number | null
          category: string | null
          confidence: number | null
          created_at: string | null
          credit_account_code: string | null
          debit_account_code: string | null
          description: string | null
          direction: string | null
          id: string
          mutation_date: string | null
          payment_type: string | null
          reconciliation_status: string | null
          review_status: string | null
          skip_employee_advance: boolean | null
          source: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          credit_account_code?: string | null
          debit_account_code?: string | null
          description?: string | null
          direction?: string | null
          id?: string
          mutation_date?: string | null
          payment_type?: string | null
          reconciliation_status?: string | null
          review_status?: string | null
          skip_employee_advance?: boolean | null
          source?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          credit_account_code?: string | null
          debit_account_code?: string | null
          description?: string | null
          direction?: string | null
          id?: string
          mutation_date?: string | null
          payment_type?: string | null
          reconciliation_status?: string | null
          review_status?: string | null
          skip_employee_advance?: boolean | null
          source?: string | null
        }
        Relationships: []
      }
      bank_statements: {
        Row: {
          account_code: string | null
          balance: number | null
          bank_account_id: string | null
          created_at: string | null
          created_by: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          is_taxable: boolean | null
          mapped_coa_credit: string | null
          mapped_coa_debit: string | null
          mapped_table: string | null
          mapping_result: Json | null
          raw_data: Json | null
          status: string | null
          tax_result: Json | null
          tax_status: string | null
          transaction_date: string | null
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          balance?: number | null
          bank_account_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          is_taxable?: boolean | null
          mapped_coa_credit?: string | null
          mapped_coa_debit?: string | null
          mapped_table?: string | null
          mapping_result?: Json | null
          raw_data?: Json | null
          status?: string | null
          tax_result?: Json | null
          tax_status?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          balance?: number | null
          bank_account_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          is_taxable?: boolean | null
          mapped_coa_credit?: string | null
          mapped_coa_debit?: string | null
          mapped_table?: string | null
          mapping_result?: Json | null
          raw_data?: Json | null
          status?: string | null
          tax_result?: Json | null
          tax_status?: string | null
          transaction_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      barang_keluar: {
        Row: {
          awb: string | null
          created_at: string | null
          final_price: number | null
          id: string
          item_arrival_date: string | null
          item_arrival_date_lini_2: string | null
          item_name: string | null
          item_quantity: number | null
          lots: string | null
          notes: string | null
          payment: string | null
          payment_status: string | null
          pick_up_date: string | null
          picked_up_by: string | null
          racks: string | null
          sku: string | null
          status: string | null
          storage_duration: number | null
          storage_duration_lini_2: number | null
          total_price: number | null
          total_price_lini_2: number | null
          unit: string | null
          updated_at: string | null
          warehouses: string | null
          zones: string | null
        }
        Insert: {
          awb?: string | null
          created_at?: string | null
          final_price?: number | null
          id?: string
          item_arrival_date?: string | null
          item_arrival_date_lini_2?: string | null
          item_name?: string | null
          item_quantity?: number | null
          lots?: string | null
          notes?: string | null
          payment?: string | null
          payment_status?: string | null
          pick_up_date?: string | null
          picked_up_by?: string | null
          racks?: string | null
          sku?: string | null
          status?: string | null
          storage_duration?: number | null
          storage_duration_lini_2?: number | null
          total_price?: number | null
          total_price_lini_2?: number | null
          unit?: string | null
          updated_at?: string | null
          warehouses?: string | null
          zones?: string | null
        }
        Update: {
          awb?: string | null
          created_at?: string | null
          final_price?: number | null
          id?: string
          item_arrival_date?: string | null
          item_arrival_date_lini_2?: string | null
          item_name?: string | null
          item_quantity?: number | null
          lots?: string | null
          notes?: string | null
          payment?: string | null
          payment_status?: string | null
          pick_up_date?: string | null
          picked_up_by?: string | null
          racks?: string | null
          sku?: string | null
          status?: string | null
          storage_duration?: number | null
          storage_duration_lini_2?: number | null
          total_price?: number | null
          total_price_lini_2?: number | null
          unit?: string | null
          updated_at?: string | null
          warehouses?: string | null
          zones?: string | null
        }
        Relationships: []
      }
      barang_lini_1: {
        Row: {
          awb: string | null
          created_at: string | null
          id: string
          item_arrival_date: string | null
          item_name: string
          item_quantity: number | null
          lots: string | null
          racks: string | null
          sku: string | null
          status: string | null
          stock_id: string | null
          storage_duration: number | null
          total_price: number
          unit: string | null
          updated_at: string | null
          warehouses: string | null
          zones: string | null
        }
        Insert: {
          awb?: string | null
          created_at?: string | null
          id?: string
          item_arrival_date?: string | null
          item_name: string
          item_quantity?: number | null
          lots?: string | null
          racks?: string | null
          sku?: string | null
          status?: string | null
          stock_id?: string | null
          storage_duration?: number | null
          total_price: number
          unit?: string | null
          updated_at?: string | null
          warehouses?: string | null
          zones?: string | null
        }
        Update: {
          awb?: string | null
          created_at?: string | null
          id?: string
          item_arrival_date?: string | null
          item_name?: string
          item_quantity?: number | null
          lots?: string | null
          racks?: string | null
          sku?: string | null
          status?: string | null
          stock_id?: string | null
          storage_duration?: number | null
          total_price?: number
          unit?: string | null
          updated_at?: string | null
          warehouses?: string | null
          zones?: string | null
        }
        Relationships: []
      }
      barang_lini_2: {
        Row: {
          awb: string | null
          created_at: string | null
          final_price: number | null
          id: string
          item_arrival_date: string | null
          item_arrival_date_lini_2: string | null
          item_name: string
          item_quantity: number | null
          lots: string | null
          racks: string | null
          sku: string
          status: string | null
          storage_duration: number | null
          storage_duration_lini_2: number | null
          total_price: number | null
          total_price_lini_2: number
          unit: string | null
          updated_at: string | null
          warehouses: string | null
          zones: string | null
        }
        Insert: {
          awb?: string | null
          created_at?: string | null
          final_price?: number | null
          id?: string
          item_arrival_date?: string | null
          item_arrival_date_lini_2?: string | null
          item_name: string
          item_quantity?: number | null
          lots?: string | null
          racks?: string | null
          sku: string
          status?: string | null
          storage_duration?: number | null
          storage_duration_lini_2?: number | null
          total_price?: number | null
          total_price_lini_2: number
          unit?: string | null
          updated_at?: string | null
          warehouses?: string | null
          zones?: string | null
        }
        Update: {
          awb?: string | null
          created_at?: string | null
          final_price?: number | null
          id?: string
          item_arrival_date?: string | null
          item_arrival_date_lini_2?: string | null
          item_name?: string
          item_quantity?: number | null
          lots?: string | null
          racks?: string | null
          sku?: string
          status?: string | null
          storage_duration?: number | null
          storage_duration_lini_2?: number | null
          total_price?: number | null
          total_price_lini_2?: number
          unit?: string | null
          updated_at?: string | null
          warehouses?: string | null
          zones?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          facility_id: string | null
          id: string
          metadata: Json | null
          price: number | null
          start_time: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          facility_id?: string | null
          id?: string
          metadata?: Json | null
          price?: number | null
          start_time: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          facility_id?: string | null
          id?: string
          metadata?: Json | null
          price?: number | null
          start_time?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      borrowers: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          borrower_code: string | null
          borrower_name: string
          borrower_type: string | null
          created_at: string | null
          credit_limit: number | null
          default_late_fee_percentage: number | null
          default_tax_percentage: number | null
          default_tax_type: string | null
          email: string | null
          id: string
          identity_number: string | null
          identity_type: string | null
          loan_calculation_method: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          borrower_code?: string | null
          borrower_name: string
          borrower_type?: string | null
          created_at?: string | null
          credit_limit?: number | null
          default_late_fee_percentage?: number | null
          default_tax_percentage?: number | null
          default_tax_type?: string | null
          email?: string | null
          id?: string
          identity_number?: string | null
          identity_type?: string | null
          loan_calculation_method?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          borrower_code?: string | null
          borrower_name?: string
          borrower_type?: string | null
          created_at?: string | null
          credit_limit?: number | null
          default_late_fee_percentage?: number | null
          default_tax_percentage?: number | null
          default_tax_type?: string | null
          email?: string | null
          id?: string
          identity_number?: string | null
          identity_type?: string | null
          loan_calculation_method?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          berat: number | null
          brand_name: string
          category: string
          coa_account_code: string | null
          coa_account_name: string | null
          created_at: string | null
          description: string | null
          id: string
          jenis_layanan: string | null
          kategori_layanan: string | null
          satuan: string | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          berat?: number | null
          brand_name: string
          category: string
          coa_account_code?: string | null
          coa_account_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          satuan?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          berat?: number | null
          brand_name?: string
          category?: string
          coa_account_code?: string | null
          coa_account_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          satuan?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      cash_and_bank_receipts: {
        Row: {
          account_code: string | null
          account_code_credit: string | null
          account_name: string | null
          account_name_credit: string | null
          account_type: string | null
          account_type_credit: string | null
          amount: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bank_account: string | null
          bukti: string | null
          coa_cash_code: string | null
          coa_cash_id: string | null
          coa_contra_code: string | null
          coa_revenue_account: string | null
          coa_revenue_code: string | null
          created_at: string | null
          created_by: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          debit_account_code: string | null
          debit_account_name: string | null
          description: string | null
          id: string
          journal_ref: string | null
          nama_penerima: string | null
          notes: string | null
          ocr_data: Json | null
          ocr_id: string | null
          payer_name: string | null
          payment_method: string | null
          reference_number: string | null
          source_destination: string | null
          source_table: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_code_credit?: string | null
          account_name?: string | null
          account_name_credit?: string | null
          account_type?: string | null
          account_type_credit?: string | null
          amount: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          bukti?: string | null
          coa_cash_code?: string | null
          coa_cash_id?: string | null
          coa_contra_code?: string | null
          coa_revenue_account?: string | null
          coa_revenue_code?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description?: string | null
          id?: string
          journal_ref?: string | null
          nama_penerima?: string | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payer_name?: string | null
          payment_method?: string | null
          reference_number?: string | null
          source_destination?: string | null
          source_table?: string | null
          transaction_date: string
          transaction_type?: string
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_code_credit?: string | null
          account_name?: string | null
          account_name_credit?: string | null
          account_type?: string | null
          account_type_credit?: string | null
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          bukti?: string | null
          coa_cash_code?: string | null
          coa_cash_id?: string | null
          coa_contra_code?: string | null
          coa_revenue_account?: string | null
          coa_revenue_code?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description?: string | null
          id?: string
          journal_ref?: string | null
          nama_penerima?: string | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payer_name?: string | null
          payment_method?: string | null
          reference_number?: string | null
          source_destination?: string | null
          source_table?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_disbursement: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          bank_account: string | null
          bank_account_id: string | null
          bukti: string | null
          cash_account_id: string | null
          category: string | null
          coa_cash_account_code: string | null
          coa_cash_id: string | null
          coa_expense_account_code: string | null
          coa_expense_id: string | null
          coa_id: string | null
          cost_center_id: string | null
          created_at: string | null
          created_by: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          currency_code: string | null
          debit_account_code: string | null
          debit_account_name: string | null
          description: string
          document_number: string | null
          evidence_url: string | null
          exchange_rate: number | null
          id: string
          journal_ref: string | null
          normalized_amount: number | null
          notes: string | null
          ocr_data: Json | null
          ocr_id: string | null
          payee_name: string | null
          payment_method: string | null
          reference_number: string | null
          rejection_reason: string | null
          source_table: string | null
          status: string | null
          tanggal: string | null
          tax_amount: number | null
          tax_code: string | null
          tax_type: string | null
          transaction_date: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          bank_account?: string | null
          bank_account_id?: string | null
          bukti?: string | null
          cash_account_id?: string | null
          category?: string | null
          coa_cash_account_code?: string | null
          coa_cash_id?: string | null
          coa_expense_account_code?: string | null
          coa_expense_id?: string | null
          coa_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          currency_code?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description: string
          document_number?: string | null
          evidence_url?: string | null
          exchange_rate?: number | null
          id?: string
          journal_ref?: string | null
          normalized_amount?: number | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payee_name?: string | null
          payment_method?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          source_table?: string | null
          status?: string | null
          tanggal?: string | null
          tax_amount?: number | null
          tax_code?: string | null
          tax_type?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          bank_account?: string | null
          bank_account_id?: string | null
          bukti?: string | null
          cash_account_id?: string | null
          category?: string | null
          coa_cash_account_code?: string | null
          coa_cash_id?: string | null
          coa_expense_account_code?: string | null
          coa_expense_id?: string | null
          coa_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          currency_code?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description?: string
          document_number?: string | null
          evidence_url?: string | null
          exchange_rate?: number | null
          id?: string
          journal_ref?: string | null
          normalized_amount?: number | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payee_name?: string | null
          payment_method?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          source_table?: string | null
          status?: string | null
          tanggal?: string | null
          tax_amount?: number | null
          tax_code?: string | null
          tax_type?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cd_coa_cash"
            columns: ["coa_cash_account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
        ]
      }
      cash_receipts_payments: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string | null
          category: string | null
          coa_cash_code: string
          coa_contra_code: string
          created_at: string | null
          description: string | null
          id: string
          journal_ref: string | null
          payment_method: string | null
          reference_number: string | null
          source_destination: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_name?: string | null
          category?: string | null
          coa_cash_code: string
          coa_contra_code: string
          created_at?: string | null
          description?: string | null
          id?: string
          journal_ref?: string | null
          payment_method?: string | null
          reference_number?: string | null
          source_destination?: string | null
          transaction_date: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          category?: string | null
          coa_cash_code?: string
          coa_contra_code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          journal_ref?: string | null
          payment_method?: string | null
          reference_number?: string | null
          source_destination?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          allow_manual_posting: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_from_intent: string | null
          description: string | null
          entity_id: string | null
          flow_type: string | null
          id: string
          is_active: boolean | null
          is_depreciable: boolean | null
          is_header: boolean | null
          is_postable: boolean | null
          level: number
          normal_balance: string | null
          parent_code: string | null
          parent_id: string | null
          saldo: number | null
          status: string | null
          total_credit: number | null
          total_debit: number | null
          trans_type: string | null
          updated_at: string | null
          usage_role: string | null
          user_id: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          allow_manual_posting?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_from_intent?: string | null
          description?: string | null
          entity_id?: string | null
          flow_type?: string | null
          id?: string
          is_active?: boolean | null
          is_depreciable?: boolean | null
          is_header?: boolean | null
          is_postable?: boolean | null
          level?: number
          normal_balance?: string | null
          parent_code?: string | null
          parent_id?: string | null
          saldo?: number | null
          status?: string | null
          total_credit?: number | null
          total_debit?: number | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
          user_id?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          allow_manual_posting?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_from_intent?: string | null
          description?: string | null
          entity_id?: string | null
          flow_type?: string | null
          id?: string
          is_active?: boolean | null
          is_depreciable?: boolean | null
          is_header?: boolean | null
          is_postable?: boolean | null
          level?: number
          normal_balance?: string | null
          parent_code?: string | null
          parent_id?: string | null
          saldo?: number | null
          status?: string | null
          total_credit?: number | null
          total_debit?: number | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_coa_parent_id"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts_backup: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string
          balance: number | null
          created_at: string | null
          created_by: string | null
          current_balance: number | null
          description: string | null
          flow_type: string | null
          id: string
          is_active: boolean | null
          is_header: boolean | null
          jenis_layanan: string | null
          kategori_layanan: string | null
          level: number | null
          normal_balance: string | null
          parent_code: string | null
          parent_id: string | null
          trans_type: string | null
          updated_at: string | null
          usage_role: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          account_type: string
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          description?: string | null
          flow_type?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          level?: number | null
          normal_balance?: string | null
          parent_code?: string | null
          parent_id?: string | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          description?: string | null
          flow_type?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          level?: number | null
          normal_balance?: string | null
          parent_code?: string | null
          parent_id?: string | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
        }
        Relationships: []
      }
      chart_of_accounts_staging: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string | null
          created_at: string | null
          description: string | null
          error_message: string | null
          id: string
          is_active: boolean | null
          is_header: boolean | null
          level: number | null
          normal_balance: string | null
          parent_code: string | null
          raw_payload: Json | null
          source: string | null
          status: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          level?: number | null
          normal_balance?: string | null
          parent_code?: string | null
          raw_payload?: Json | null
          source?: string | null
          status?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          created_at?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          level?: number | null
          normal_balance?: string | null
          parent_code?: string | null
          raw_payload?: Json | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          created_at: string | null
          hs_code_suggestions: Json | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          hs_code_suggestions?: Json | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          hs_code_suggestions?: Json | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      coa_category_mapping: {
        Row: {
          asset_account_code: string | null
          cogs_account_code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          revenue_account_code: string | null
          service_category: string
          service_type: string
          updated_at: string | null
        }
        Insert: {
          asset_account_code?: string | null
          cogs_account_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          revenue_account_code?: string | null
          service_category: string
          service_type: string
          updated_at?: string | null
        }
        Update: {
          asset_account_code?: string | null
          cogs_account_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          revenue_account_code?: string | null
          service_category?: string
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coa_change_log: {
        Row: {
          changed_at: string | null
          id: string | null
          new_account_code: string | null
          note: string | null
          old_account_code: string | null
        }
        Insert: {
          changed_at?: string | null
          id?: string | null
          new_account_code?: string | null
          note?: string | null
          old_account_code?: string | null
        }
        Update: {
          changed_at?: string | null
          id?: string | null
          new_account_code?: string | null
          note?: string | null
          old_account_code?: string | null
        }
        Relationships: []
      }
      coa_embeddings: {
        Row: {
          account_code: string
          account_name: string
          embedding: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          embedding?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          embedding?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coa_intent_rules: {
        Row: {
          account_type: string | null
          approval_status: string | null
          confidence_base: number | null
          created_at: string | null
          default_account_name: string | null
          default_parent_code: string | null
          direction: string | null
          id: string
          intent_code: string
          intent_name: string
          is_asset: boolean | null
          is_depreciable: boolean | null
          keywords: string[]
        }
        Insert: {
          account_type?: string | null
          approval_status?: string | null
          confidence_base?: number | null
          created_at?: string | null
          default_account_name?: string | null
          default_parent_code?: string | null
          direction?: string | null
          id?: string
          intent_code: string
          intent_name: string
          is_asset?: boolean | null
          is_depreciable?: boolean | null
          keywords: string[]
        }
        Update: {
          account_type?: string | null
          approval_status?: string | null
          confidence_base?: number | null
          created_at?: string | null
          default_account_name?: string | null
          default_parent_code?: string | null
          direction?: string | null
          id?: string
          intent_code?: string
          intent_name?: string
          is_asset?: boolean | null
          is_depreciable?: boolean | null
          keywords?: string[]
        }
        Relationships: []
      }
      coa_mapping: {
        Row: {
          account_code: string
          account_name: string
          category: string
          created_at: string | null
          id: string
        }
        Insert: {
          account_code: string
          account_name: string
          category: string
          created_at?: string | null
          id?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          category?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      coa_normalization_log: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string | null
          balance: number | null
          created_at: string | null
          created_by: string | null
          current_balance: number | null
          description: string | null
          flow_type: string | null
          id: string | null
          is_active: boolean | null
          is_header: boolean | null
          jenis_layanan: string | null
          kategori_layanan: string | null
          level: number | null
          normal_balance: string | null
          parent_code: string | null
          parent_id: string | null
          trans_type: string | null
          updated_at: string | null
          usage_role: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          description?: string | null
          flow_type?: string | null
          id?: string | null
          is_active?: boolean | null
          is_header?: boolean | null
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          level?: number | null
          normal_balance?: string | null
          parent_code?: string | null
          parent_id?: string | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          current_balance?: number | null
          description?: string | null
          flow_type?: string | null
          id?: string | null
          is_active?: boolean | null
          is_header?: boolean | null
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          level?: number | null
          normal_balance?: string | null
          parent_code?: string | null
          parent_id?: string | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
        }
        Relationships: []
      }
      coa_suggestions: {
        Row: {
          action_taken: string | null
          approved_at: string | null
          approved_by: string | null
          confidence: number | null
          created_at: string | null
          description: string
          financial_category: string | null
          flow_type: string | null
          id: string
          intent: string | null
          intent_code: string | null
          parent_account: string | null
          reasoning: string | null
          selected_account_code: string | null
          status: string | null
          suggested_account_code: string | null
          suggested_account_name: string | null
          trans_type: string | null
          updated_at: string | null
          usage_role: string | null
        }
        Insert: {
          action_taken?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          created_at?: string | null
          description: string
          financial_category?: string | null
          flow_type?: string | null
          id?: string
          intent?: string | null
          intent_code?: string | null
          parent_account?: string | null
          reasoning?: string | null
          selected_account_code?: string | null
          status?: string | null
          suggested_account_code?: string | null
          suggested_account_name?: string | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
        }
        Update: {
          action_taken?: string | null
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string
          financial_category?: string | null
          flow_type?: string | null
          id?: string
          intent?: string | null
          intent_code?: string | null
          parent_account?: string | null
          reasoning?: string | null
          selected_account_code?: string | null
          status?: string | null
          suggested_account_code?: string | null
          suggested_account_name?: string | null
          trans_type?: string | null
          updated_at?: string | null
          usage_role?: string | null
        }
        Relationships: []
      }
      consignees: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_name: string | null
          category: string | null
          city: string | null
          consignee_code: string
          consignee_name: string
          contact_person: string
          country: string | null
          created_at: string | null
          currency: string
          email: string
          id: string
          is_pkp: string | null
          npwp: number | null
          payment_terms: string | null
          phone_number: string
          status: string
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_name?: string | null
          category?: string | null
          city?: string | null
          consignee_code: string
          consignee_name: string
          contact_person: string
          country?: string | null
          created_at?: string | null
          currency?: string
          email: string
          id?: string
          is_pkp?: string | null
          npwp?: number | null
          payment_terms?: string | null
          phone_number: string
          status?: string
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_name?: string | null
          category?: string | null
          city?: string | null
          consignee_code?: string
          consignee_name?: string
          contact_person?: string
          country?: string | null
          created_at?: string | null
          currency?: string
          email?: string
          id?: string
          is_pkp?: string | null
          npwp?: number | null
          payment_terms?: string | null
          phone_number?: string
          status?: string
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consignees_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coretax_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          notes: string | null
          period_month: number
          period_year: number
          status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          birth_date: string | null
          birth_place: string | null
          category: string | null
          city: string | null
          company: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          credit_limit: number | null
          currency: string | null
          customer_code: string | null
          customer_name: string | null
          email: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_pkp: string | null
          ktp_address: string | null
          ktp_number: number | null
          name: string
          payment_term_id: string | null
          phone: string | null
          phone_number: number | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          category?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          customer_code?: string | null
          customer_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_pkp?: string | null
          ktp_address?: string | null
          ktp_number?: number | null
          name?: string
          payment_term_id?: string | null
          phone?: string | null
          phone_number?: number | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          birth_date?: string | null
          birth_place?: string | null
          category?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          customer_code?: string | null
          customer_name?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_pkp?: string | null
          ktp_address?: string | null
          ktp_number?: number | null
          name?: string
          payment_term_id?: string | null
          phone?: string | null
          phone_number?: number | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_karyawan: {
        Row: {
          agama: string | null
          alamat: string | null
          alasan_bergabung: string | null
          alasan_tidak_medical: string | null
          anak1_nama: string | null
          anak1_pendidikan_pekerjaan: string | null
          anak1_tanggal_lahir: string | null
          anak1_tempat_lahir: string | null
          anak2_nama: string | null
          anak2_pendidikan_pekerjaan: string | null
          anak2_tanggal_lahir: string | null
          anak2_tempat_lahir: string | null
          anak3_nama: string | null
          anak3_pendidikan_pekerjaan: string | null
          anak3_tanggal_lahir: string | null
          anak3_tempat_lahir: string | null
          ayah_nama: string | null
          ayah_pekerjaan: string | null
          ayah_pendidikan: string | null
          ayah_tanggal_lahir: string | null
          bahasa1_lisan: string | null
          bahasa1_nama: string | null
          bahasa1_tulisan: string | null
          bahasa2_lisan: string | null
          bahasa2_nama: string | null
          bahasa2_tulisan: string | null
          bahasa3_lisan: string | null
          bahasa3_nama: string | null
          bahasa3_tulisan: string | null
          bersedia_medical_checkup: boolean | null
          buku: string | null
          cara_mengisi_waktu: string | null
          created_at: string
          gaji_all_in_terakhir: number | null
          gaji_diharapkan: number | null
          golongan_darah: string | null
          hobi: string | null
          hukum_kapan_dimana: string | null
          hukum_perkara: string | null
          ibu_nama: string | null
          ibu_pekerjaan: string | null
          ibu_pendidikan: string | null
          ibu_tanggal_lahir: string | null
          id: string
          jenis_tempat_tinggal: string | null
          jenis_transportasi: string | null
          kebangsaan: string | null
          kenalan1_jabatan: string | null
          kenalan1_nama: string | null
          kenalan2_jabatan: string | null
          kenalan2_nama: string | null
          kerja1_alamat_perusahaan: string | null
          kerja1_alasan_pindah: string | null
          kerja1_jabatan: string | null
          kerja1_nama_perusahaan: string | null
          kerja1_periode_mulai: string | null
          kerja1_periode_selesai: string | null
          kerja2_alamat_perusahaan: string | null
          kerja2_alasan_pindah: string | null
          kerja2_jabatan: string | null
          kerja2_nama_perusahaan: string | null
          kerja2_periode_mulai: string | null
          kerja2_periode_selesai: string | null
          kerja3_alamat_perusahaan: string | null
          kerja3_alasan_pindah: string | null
          kerja3_jabatan: string | null
          kerja3_nama_perusahaan: string | null
          kerja3_periode_mulai: string | null
          kerja3_periode_selesai: string | null
          majalah: string | null
          masih_bekerja: boolean | null
          memakai_kacamata: boolean | null
          minus_kanan: string | null
          minus_kiri: string | null
          nama_lengkap: string
          nama_pasangan: string | null
          nama_tanda_tangan: string | null
          no_ktp_paspor: string | null
          no_telepon: string | null
          nonformal1_jenis: string | null
          nonformal1_penyelenggara: string | null
          nonformal1_sertifikat: boolean | null
          nonformal1_tahun: number | null
          nonformal1_tempat: string | null
          nonformal2_jenis: string | null
          nonformal2_penyelenggara: string | null
          nonformal2_sertifikat: boolean | null
          nonformal2_tahun: number | null
          nonformal2_tempat: string | null
          nonformal3_jenis: string | null
          nonformal3_penyelenggara: string | null
          nonformal3_sertifikat: boolean | null
          nonformal3_tahun: number | null
          nonformal3_tempat: string | null
          organisasi1_jabatan: string | null
          organisasi1_nama: string | null
          organisasi2_jabatan: string | null
          organisasi2_nama: string | null
          pekerjaan_membantu: string | null
          pekerjaan_mirip: string | null
          pekerjaan_pasangan: string | null
          pelajaran_favorit_sma: string | null
          pelajaran_favorit_smp: string | null
          pelajaran_favorit_univ: string | null
          pend1_lulus: boolean | null
          pend1_nama_sekolah: string | null
          pend1_periode_mulai: string | null
          pend1_periode_selesai: string | null
          pend1_tempat: string | null
          pend2_lulus: boolean | null
          pend2_nama_sekolah: string | null
          pend2_periode_mulai: string | null
          pend2_periode_selesai: string | null
          pend2_tempat: string | null
          pend3_lulus: boolean | null
          pend3_nama_sekolah: string | null
          pend3_periode_mulai: string | null
          pend3_periode_selesai: string | null
          pend3_tempat: string | null
          penjelasan_struktur_org: string | null
          pernah_berurusan_hukum: boolean | null
          pernah_organisasi: boolean | null
          pernah_sakit_keras: boolean | null
          posisi_dilamar: string
          sakit_keras_jenis_waktu: string | null
          sakit_keras_lama_rawat: string | null
          saudara1_jk: string | null
          saudara1_nama: string | null
          saudara1_pekerjaan: string | null
          saudara1_pendidikan: string | null
          saudara1_tanggal_lahir: string | null
          saudara2_jk: string | null
          saudara2_nama: string | null
          saudara2_pekerjaan: string | null
          saudara2_pendidikan: string | null
          saudara2_tanggal_lahir: string | null
          sim_a_berlaku_sampai: string | null
          sim_a_dikeluarkan_oleh: string | null
          sim_b1_berlaku_sampai: string | null
          sim_b1_dikeluarkan_oleh: string | null
          sim_b2_berlaku_sampai: string | null
          sim_b2_dikeluarkan_oleh: string | null
          sim_c_berlaku_sampai: string | null
          sim_c_dikeluarkan_oleh: string | null
          status_pernikahan: string | null
          struktur_gaji_terakhir: string | null
          surat_kabar: string | null
          tanggal_form: string | null
          tanggal_lahir: string | null
          tanggal_lahir_pasangan: string | null
          tanggal_mulai_bersedia: string | null
          tempat_lahir: string | null
          tempat_lahir_pasangan: string | null
          tunjangan_diharapkan: string | null
          updated_at: string
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          alasan_bergabung?: string | null
          alasan_tidak_medical?: string | null
          anak1_nama?: string | null
          anak1_pendidikan_pekerjaan?: string | null
          anak1_tanggal_lahir?: string | null
          anak1_tempat_lahir?: string | null
          anak2_nama?: string | null
          anak2_pendidikan_pekerjaan?: string | null
          anak2_tanggal_lahir?: string | null
          anak2_tempat_lahir?: string | null
          anak3_nama?: string | null
          anak3_pendidikan_pekerjaan?: string | null
          anak3_tanggal_lahir?: string | null
          anak3_tempat_lahir?: string | null
          ayah_nama?: string | null
          ayah_pekerjaan?: string | null
          ayah_pendidikan?: string | null
          ayah_tanggal_lahir?: string | null
          bahasa1_lisan?: string | null
          bahasa1_nama?: string | null
          bahasa1_tulisan?: string | null
          bahasa2_lisan?: string | null
          bahasa2_nama?: string | null
          bahasa2_tulisan?: string | null
          bahasa3_lisan?: string | null
          bahasa3_nama?: string | null
          bahasa3_tulisan?: string | null
          bersedia_medical_checkup?: boolean | null
          buku?: string | null
          cara_mengisi_waktu?: string | null
          created_at?: string
          gaji_all_in_terakhir?: number | null
          gaji_diharapkan?: number | null
          golongan_darah?: string | null
          hobi?: string | null
          hukum_kapan_dimana?: string | null
          hukum_perkara?: string | null
          ibu_nama?: string | null
          ibu_pekerjaan?: string | null
          ibu_pendidikan?: string | null
          ibu_tanggal_lahir?: string | null
          id?: string
          jenis_tempat_tinggal?: string | null
          jenis_transportasi?: string | null
          kebangsaan?: string | null
          kenalan1_jabatan?: string | null
          kenalan1_nama?: string | null
          kenalan2_jabatan?: string | null
          kenalan2_nama?: string | null
          kerja1_alamat_perusahaan?: string | null
          kerja1_alasan_pindah?: string | null
          kerja1_jabatan?: string | null
          kerja1_nama_perusahaan?: string | null
          kerja1_periode_mulai?: string | null
          kerja1_periode_selesai?: string | null
          kerja2_alamat_perusahaan?: string | null
          kerja2_alasan_pindah?: string | null
          kerja2_jabatan?: string | null
          kerja2_nama_perusahaan?: string | null
          kerja2_periode_mulai?: string | null
          kerja2_periode_selesai?: string | null
          kerja3_alamat_perusahaan?: string | null
          kerja3_alasan_pindah?: string | null
          kerja3_jabatan?: string | null
          kerja3_nama_perusahaan?: string | null
          kerja3_periode_mulai?: string | null
          kerja3_periode_selesai?: string | null
          majalah?: string | null
          masih_bekerja?: boolean | null
          memakai_kacamata?: boolean | null
          minus_kanan?: string | null
          minus_kiri?: string | null
          nama_lengkap: string
          nama_pasangan?: string | null
          nama_tanda_tangan?: string | null
          no_ktp_paspor?: string | null
          no_telepon?: string | null
          nonformal1_jenis?: string | null
          nonformal1_penyelenggara?: string | null
          nonformal1_sertifikat?: boolean | null
          nonformal1_tahun?: number | null
          nonformal1_tempat?: string | null
          nonformal2_jenis?: string | null
          nonformal2_penyelenggara?: string | null
          nonformal2_sertifikat?: boolean | null
          nonformal2_tahun?: number | null
          nonformal2_tempat?: string | null
          nonformal3_jenis?: string | null
          nonformal3_penyelenggara?: string | null
          nonformal3_sertifikat?: boolean | null
          nonformal3_tahun?: number | null
          nonformal3_tempat?: string | null
          organisasi1_jabatan?: string | null
          organisasi1_nama?: string | null
          organisasi2_jabatan?: string | null
          organisasi2_nama?: string | null
          pekerjaan_membantu?: string | null
          pekerjaan_mirip?: string | null
          pekerjaan_pasangan?: string | null
          pelajaran_favorit_sma?: string | null
          pelajaran_favorit_smp?: string | null
          pelajaran_favorit_univ?: string | null
          pend1_lulus?: boolean | null
          pend1_nama_sekolah?: string | null
          pend1_periode_mulai?: string | null
          pend1_periode_selesai?: string | null
          pend1_tempat?: string | null
          pend2_lulus?: boolean | null
          pend2_nama_sekolah?: string | null
          pend2_periode_mulai?: string | null
          pend2_periode_selesai?: string | null
          pend2_tempat?: string | null
          pend3_lulus?: boolean | null
          pend3_nama_sekolah?: string | null
          pend3_periode_mulai?: string | null
          pend3_periode_selesai?: string | null
          pend3_tempat?: string | null
          penjelasan_struktur_org?: string | null
          pernah_berurusan_hukum?: boolean | null
          pernah_organisasi?: boolean | null
          pernah_sakit_keras?: boolean | null
          posisi_dilamar: string
          sakit_keras_jenis_waktu?: string | null
          sakit_keras_lama_rawat?: string | null
          saudara1_jk?: string | null
          saudara1_nama?: string | null
          saudara1_pekerjaan?: string | null
          saudara1_pendidikan?: string | null
          saudara1_tanggal_lahir?: string | null
          saudara2_jk?: string | null
          saudara2_nama?: string | null
          saudara2_pekerjaan?: string | null
          saudara2_pendidikan?: string | null
          saudara2_tanggal_lahir?: string | null
          sim_a_berlaku_sampai?: string | null
          sim_a_dikeluarkan_oleh?: string | null
          sim_b1_berlaku_sampai?: string | null
          sim_b1_dikeluarkan_oleh?: string | null
          sim_b2_berlaku_sampai?: string | null
          sim_b2_dikeluarkan_oleh?: string | null
          sim_c_berlaku_sampai?: string | null
          sim_c_dikeluarkan_oleh?: string | null
          status_pernikahan?: string | null
          struktur_gaji_terakhir?: string | null
          surat_kabar?: string | null
          tanggal_form?: string | null
          tanggal_lahir?: string | null
          tanggal_lahir_pasangan?: string | null
          tanggal_mulai_bersedia?: string | null
          tempat_lahir?: string | null
          tempat_lahir_pasangan?: string | null
          tunjangan_diharapkan?: string | null
          updated_at?: string
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          alasan_bergabung?: string | null
          alasan_tidak_medical?: string | null
          anak1_nama?: string | null
          anak1_pendidikan_pekerjaan?: string | null
          anak1_tanggal_lahir?: string | null
          anak1_tempat_lahir?: string | null
          anak2_nama?: string | null
          anak2_pendidikan_pekerjaan?: string | null
          anak2_tanggal_lahir?: string | null
          anak2_tempat_lahir?: string | null
          anak3_nama?: string | null
          anak3_pendidikan_pekerjaan?: string | null
          anak3_tanggal_lahir?: string | null
          anak3_tempat_lahir?: string | null
          ayah_nama?: string | null
          ayah_pekerjaan?: string | null
          ayah_pendidikan?: string | null
          ayah_tanggal_lahir?: string | null
          bahasa1_lisan?: string | null
          bahasa1_nama?: string | null
          bahasa1_tulisan?: string | null
          bahasa2_lisan?: string | null
          bahasa2_nama?: string | null
          bahasa2_tulisan?: string | null
          bahasa3_lisan?: string | null
          bahasa3_nama?: string | null
          bahasa3_tulisan?: string | null
          bersedia_medical_checkup?: boolean | null
          buku?: string | null
          cara_mengisi_waktu?: string | null
          created_at?: string
          gaji_all_in_terakhir?: number | null
          gaji_diharapkan?: number | null
          golongan_darah?: string | null
          hobi?: string | null
          hukum_kapan_dimana?: string | null
          hukum_perkara?: string | null
          ibu_nama?: string | null
          ibu_pekerjaan?: string | null
          ibu_pendidikan?: string | null
          ibu_tanggal_lahir?: string | null
          id?: string
          jenis_tempat_tinggal?: string | null
          jenis_transportasi?: string | null
          kebangsaan?: string | null
          kenalan1_jabatan?: string | null
          kenalan1_nama?: string | null
          kenalan2_jabatan?: string | null
          kenalan2_nama?: string | null
          kerja1_alamat_perusahaan?: string | null
          kerja1_alasan_pindah?: string | null
          kerja1_jabatan?: string | null
          kerja1_nama_perusahaan?: string | null
          kerja1_periode_mulai?: string | null
          kerja1_periode_selesai?: string | null
          kerja2_alamat_perusahaan?: string | null
          kerja2_alasan_pindah?: string | null
          kerja2_jabatan?: string | null
          kerja2_nama_perusahaan?: string | null
          kerja2_periode_mulai?: string | null
          kerja2_periode_selesai?: string | null
          kerja3_alamat_perusahaan?: string | null
          kerja3_alasan_pindah?: string | null
          kerja3_jabatan?: string | null
          kerja3_nama_perusahaan?: string | null
          kerja3_periode_mulai?: string | null
          kerja3_periode_selesai?: string | null
          majalah?: string | null
          masih_bekerja?: boolean | null
          memakai_kacamata?: boolean | null
          minus_kanan?: string | null
          minus_kiri?: string | null
          nama_lengkap?: string
          nama_pasangan?: string | null
          nama_tanda_tangan?: string | null
          no_ktp_paspor?: string | null
          no_telepon?: string | null
          nonformal1_jenis?: string | null
          nonformal1_penyelenggara?: string | null
          nonformal1_sertifikat?: boolean | null
          nonformal1_tahun?: number | null
          nonformal1_tempat?: string | null
          nonformal2_jenis?: string | null
          nonformal2_penyelenggara?: string | null
          nonformal2_sertifikat?: boolean | null
          nonformal2_tahun?: number | null
          nonformal2_tempat?: string | null
          nonformal3_jenis?: string | null
          nonformal3_penyelenggara?: string | null
          nonformal3_sertifikat?: boolean | null
          nonformal3_tahun?: number | null
          nonformal3_tempat?: string | null
          organisasi1_jabatan?: string | null
          organisasi1_nama?: string | null
          organisasi2_jabatan?: string | null
          organisasi2_nama?: string | null
          pekerjaan_membantu?: string | null
          pekerjaan_mirip?: string | null
          pekerjaan_pasangan?: string | null
          pelajaran_favorit_sma?: string | null
          pelajaran_favorit_smp?: string | null
          pelajaran_favorit_univ?: string | null
          pend1_lulus?: boolean | null
          pend1_nama_sekolah?: string | null
          pend1_periode_mulai?: string | null
          pend1_periode_selesai?: string | null
          pend1_tempat?: string | null
          pend2_lulus?: boolean | null
          pend2_nama_sekolah?: string | null
          pend2_periode_mulai?: string | null
          pend2_periode_selesai?: string | null
          pend2_tempat?: string | null
          pend3_lulus?: boolean | null
          pend3_nama_sekolah?: string | null
          pend3_periode_mulai?: string | null
          pend3_periode_selesai?: string | null
          pend3_tempat?: string | null
          penjelasan_struktur_org?: string | null
          pernah_berurusan_hukum?: boolean | null
          pernah_organisasi?: boolean | null
          pernah_sakit_keras?: boolean | null
          posisi_dilamar?: string
          sakit_keras_jenis_waktu?: string | null
          sakit_keras_lama_rawat?: string | null
          saudara1_jk?: string | null
          saudara1_nama?: string | null
          saudara1_pekerjaan?: string | null
          saudara1_pendidikan?: string | null
          saudara1_tanggal_lahir?: string | null
          saudara2_jk?: string | null
          saudara2_nama?: string | null
          saudara2_pekerjaan?: string | null
          saudara2_pendidikan?: string | null
          saudara2_tanggal_lahir?: string | null
          sim_a_berlaku_sampai?: string | null
          sim_a_dikeluarkan_oleh?: string | null
          sim_b1_berlaku_sampai?: string | null
          sim_b1_dikeluarkan_oleh?: string | null
          sim_b2_berlaku_sampai?: string | null
          sim_b2_dikeluarkan_oleh?: string | null
          sim_c_berlaku_sampai?: string | null
          sim_c_dikeluarkan_oleh?: string | null
          status_pernikahan?: string | null
          struktur_gaji_terakhir?: string | null
          surat_kabar?: string | null
          tanggal_form?: string | null
          tanggal_lahir?: string | null
          tanggal_lahir_pasangan?: string | null
          tanggal_mulai_bersedia?: string | null
          tempat_lahir?: string | null
          tempat_lahir_pasangan?: string | null
          tunjangan_diharapkan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          city: string | null
          created_at: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: string
          delivery_date: string | null
          delivery_number: string
          id: string
          notes: string | null
          postal_code: string | null
          province: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address: string
          delivery_date?: string | null
          delivery_number: string
          id?: string
          notes?: string | null
          postal_code?: string | null
          province?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string
          delivery_date?: string | null
          delivery_number?: string
          id?: string
          notes?: string | null
          postal_code?: string | null
          province?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string | null
          created_at: string | null
          department_name: string
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          department_name: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          department_name?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      depreciation_period_lock: {
        Row: {
          completed_at: string | null
          period: string
          reversed_at: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          period: string
          reversed_at?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          period?: string
          reversed_at?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          address: string | null
          birth_place: string | null
          city: string | null
          country: string | null
          created_at: string | null
          driver_code: string | null
          driver_type: string | null
          email: string | null
          ethnicity: string | null
          family_card_url: string | null
          full_name: string | null
          gender: string | null
          id: string
          kontak_referensi_nama: string | null
          kontak_referensi_nomor: string | null
          ktp_address: string | null
          ktp_document_url: string | null
          ktp_number: number | null
          license_expiry: string | null
          license_number: string | null
          license_type: string | null
          nama_perusahaan_mitra: string | null
          nib: string | null
          nomor_kk: string | null
          npwp: string | null
          phone: string | null
          pic_name: string | null
          pic_phone: string | null
          plate_number: string | null
          religion: string | null
          selfie_url: string | null
          sensitive_encrypted: boolean | null
          sim_url: string | null
          skck_url: string | null
          status: string | null
          tipe_driver: string | null
          updated_at: string | null
          upload_stnk_url: string | null
          user_id: string | null
          vehicle_brand: string | null
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_photo: string | null
          vehicle_year: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          birth_place?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          driver_code?: string | null
          driver_type?: string | null
          email?: string | null
          ethnicity?: string | null
          family_card_url?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          kontak_referensi_nama?: string | null
          kontak_referensi_nomor?: string | null
          ktp_address?: string | null
          ktp_document_url?: string | null
          ktp_number?: number | null
          license_expiry?: string | null
          license_number?: string | null
          license_type?: string | null
          nama_perusahaan_mitra?: string | null
          nib?: string | null
          nomor_kk?: string | null
          npwp?: string | null
          phone?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          plate_number?: string | null
          religion?: string | null
          selfie_url?: string | null
          sensitive_encrypted?: boolean | null
          sim_url?: string | null
          skck_url?: string | null
          status?: string | null
          tipe_driver?: string | null
          updated_at?: string | null
          upload_stnk_url?: string | null
          user_id?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_photo?: string | null
          vehicle_year?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          birth_place?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          driver_code?: string | null
          driver_type?: string | null
          email?: string | null
          ethnicity?: string | null
          family_card_url?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          kontak_referensi_nama?: string | null
          kontak_referensi_nomor?: string | null
          ktp_address?: string | null
          ktp_document_url?: string | null
          ktp_number?: number | null
          license_expiry?: string | null
          license_number?: string | null
          license_type?: string | null
          nama_perusahaan_mitra?: string | null
          nib?: string | null
          nomor_kk?: string | null
          npwp?: string | null
          phone?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          plate_number?: string | null
          religion?: string | null
          selfie_url?: string | null
          sensitive_encrypted?: boolean | null
          sim_url?: string | null
          skck_url?: string | null
          status?: string | null
          tipe_driver?: string | null
          updated_at?: string | null
          upload_stnk_url?: string | null
          user_id?: string | null
          vehicle_brand?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_photo?: string | null
          vehicle_year?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_function_logs: {
        Row: {
          created_at: string | null
          function_name: string | null
          id: string
          message: string | null
          ref_id: string | null
        }
        Insert: {
          created_at?: string | null
          function_name?: string | null
          id?: string
          message?: string | null
          ref_id?: string | null
        }
        Update: {
          created_at?: string | null
          function_name?: string | null
          id?: string
          message?: string | null
          ref_id?: string | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      employee_advance_movements: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          employee_id: string
          id: string
          movement_type: string
          notes: string | null
          reference_number: string | null
          transaction_date: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          employee_id: string
          id?: string
          movement_type: string
          notes?: string | null
          reference_number?: string | null
          transaction_date?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          employee_id?: string
          id?: string
          movement_type?: string
          notes?: string | null
          reference_number?: string | null
          transaction_date?: string | null
        }
        Relationships: []
      }
      employee_advance_returns: {
        Row: {
          advance_id: string | null
          amount: number
          bukti: string | null
          bukti_url: string | null
          created_at: string | null
          created_by: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          debit_account_code: string | null
          debit_account_name: string | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          payment_method: string | null
          return_date: string
        }
        Insert: {
          advance_id?: string | null
          amount: number
          bukti?: string | null
          bukti_url?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_method?: string | null
          return_date?: string
        }
        Update: {
          advance_id?: string | null
          amount?: number
          bukti?: string | null
          bukti_url?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          payment_method?: string | null
          return_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_advance_returns_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "employee_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_advance_returns_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "vw_employee_advance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_advance_returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_advance_settlements: {
        Row: {
          advance_id: string | null
          amount: number
          bukti: string | null
          bukti_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          debit_account_code: string | null
          debit_account_name: string | null
          description: string | null
          expense_account_code: string
          expense_account_name: string | null
          file_url: string | null
          id: string
          journal_entry_id: string | null
          merchant: string | null
          ocr_data: Json | null
          ppn: number | null
          receipt_number: string | null
          settlement_date: string
          total: number
          updated_at: string | null
        }
        Insert: {
          advance_id?: string | null
          amount: number
          bukti?: string | null
          bukti_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description?: string | null
          expense_account_code: string
          expense_account_name?: string | null
          file_url?: string | null
          id?: string
          journal_entry_id?: string | null
          merchant?: string | null
          ocr_data?: Json | null
          ppn?: number | null
          receipt_number?: string | null
          settlement_date?: string
          total: number
          updated_at?: string | null
        }
        Update: {
          advance_id?: string | null
          amount?: number
          bukti?: string | null
          bukti_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description?: string | null
          expense_account_code?: string
          expense_account_name?: string | null
          file_url?: string | null
          id?: string
          journal_entry_id?: string | null
          merchant?: string | null
          ocr_data?: Json | null
          ppn?: number | null
          receipt_number?: string | null
          settlement_date?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_advance_settlements_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "employee_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_advance_settlements_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "vw_employee_advance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_advance_settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_advances: {
        Row: {
          advance_date: string
          advance_number: string
          amount: number
          bukti: string | null
          bukti_url: string | null
          coa_account_code: string
          created_at: string | null
          created_by: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          debit_account_code: string | null
          debit_account_name: string | null
          disbursement_account_id: string | null
          disbursement_date: string | null
          disbursement_method: string | null
          employee_id: string | null
          employee_name: string
          finance_approval: string | null
          id: string
          journal_ref: string | null
          manager_approval: string | null
          notes: string | null
          reference_number: string | null
          remaining_balance: number
          status: string
          updated_at: string | null
        }
        Insert: {
          advance_date?: string
          advance_number: string
          amount: number
          bukti?: string | null
          bukti_url?: string | null
          coa_account_code: string
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          disbursement_account_id?: string | null
          disbursement_date?: string | null
          disbursement_method?: string | null
          employee_id?: string | null
          employee_name: string
          finance_approval?: string | null
          id?: string
          journal_ref?: string | null
          manager_approval?: string | null
          notes?: string | null
          reference_number?: string | null
          remaining_balance: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          advance_date?: string
          advance_number?: string
          amount?: number
          bukti?: string | null
          bukti_url?: string | null
          coa_account_code?: string
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          disbursement_account_id?: string | null
          disbursement_date?: string | null
          disbursement_method?: string | null
          employee_id?: string | null
          employee_name?: string
          finance_approval?: string | null
          id?: string
          journal_ref?: string | null
          manager_approval?: string | null
          notes?: string | null
          reference_number?: string | null
          remaining_balance?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bank_account_id"
            columns: ["disbursement_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          employee_id: string | null
          expiry_date: string | null
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          employee_id?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          employee_id?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_training: {
        Row: {
          certificate_url: string | null
          cost: number | null
          created_at: string | null
          duration_hours: number | null
          employee_id: string | null
          end_date: string | null
          id: string
          notes: string | null
          provider: string | null
          start_date: string
          status: string | null
          training_name: string
          training_type: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_url?: string | null
          cost?: number | null
          created_at?: string | null
          duration_hours?: number | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_date: string
          status?: string | null
          training_name: string
          training_type?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_url?: string | null
          cost?: number | null
          created_at?: string | null
          duration_hours?: number | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          start_date?: string
          status?: string | null
          training_name?: string
          training_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          basic_salary: number | null
          birth_date: string | null
          birth_place: string | null
          bpjs_kesehatan: string | null
          bpjs_ketenagakerjaan: string | null
          city: string | null
          contract_file_url: string | null
          country: string | null
          created_at: string | null
          cv_file_url: string | null
          departemen: string | null
          department: string | null
          department_id: string | null
          education: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employee_code: string | null
          employee_number: string | null
          employment_status: string | null
          ethnicity: string | null
          family_card_url: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          graduation_year: string | null
          id: string
          institution_name: string | null
          jabatan: string | null
          join_date: string | null
          kontak_referensi_nama: string | null
          kontak_referensi_nomor: string | null
          ktp_address: string | null
          ktp_document_url: string | null
          ktp_number: number | null
          last_education: string | null
          last_name: string | null
          license_expiry_date: string | null
          license_number: string | null
          major: string | null
          marital_status: string | null
          name: string | null
          nik: string | null
          nomor_kk: string | null
          notes: string | null
          npwp_file_url: string | null
          npwp_number: string | null
          phone: string | null
          position: string | null
          position_id: string | null
          postal_code: string | null
          province: string | null
          religion: string | null
          selfie_url: string | null
          sensitive_encrypted: boolean | null
          sim_url: string | null
          skck_url: string | null
          status: string | null
          updated_at: string | null
          upload_ijasah: string | null
          user_id: string | null
          "users.entity": string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          birth_date?: string | null
          birth_place?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          city?: string | null
          contract_file_url?: string | null
          country?: string | null
          created_at?: string | null
          cv_file_url?: string | null
          departemen?: string | null
          department?: string | null
          department_id?: string | null
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_code?: string | null
          employee_number?: string | null
          employment_status?: string | null
          ethnicity?: string | null
          family_card_url?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          graduation_year?: string | null
          id?: string
          institution_name?: string | null
          jabatan?: string | null
          join_date?: string | null
          kontak_referensi_nama?: string | null
          kontak_referensi_nomor?: string | null
          ktp_address?: string | null
          ktp_document_url?: string | null
          ktp_number?: number | null
          last_education?: string | null
          last_name?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          major?: string | null
          marital_status?: string | null
          name?: string | null
          nik?: string | null
          nomor_kk?: string | null
          notes?: string | null
          npwp_file_url?: string | null
          npwp_number?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          postal_code?: string | null
          province?: string | null
          religion?: string | null
          selfie_url?: string | null
          sensitive_encrypted?: boolean | null
          sim_url?: string | null
          skck_url?: string | null
          status?: string | null
          updated_at?: string | null
          upload_ijasah?: string | null
          user_id?: string | null
          "users.entity"?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          birth_date?: string | null
          birth_place?: string | null
          bpjs_kesehatan?: string | null
          bpjs_ketenagakerjaan?: string | null
          city?: string | null
          contract_file_url?: string | null
          country?: string | null
          created_at?: string | null
          cv_file_url?: string | null
          departemen?: string | null
          department?: string | null
          department_id?: string | null
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employee_code?: string | null
          employee_number?: string | null
          employment_status?: string | null
          ethnicity?: string | null
          family_card_url?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          graduation_year?: string | null
          id?: string
          institution_name?: string | null
          jabatan?: string | null
          join_date?: string | null
          kontak_referensi_nama?: string | null
          kontak_referensi_nomor?: string | null
          ktp_address?: string | null
          ktp_document_url?: string | null
          ktp_number?: number | null
          last_education?: string | null
          last_name?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          major?: string | null
          marital_status?: string | null
          name?: string | null
          nik?: string | null
          nomor_kk?: string | null
          notes?: string | null
          npwp_file_url?: string | null
          npwp_number?: string | null
          phone?: string | null
          position?: string | null
          position_id?: string | null
          postal_code?: string | null
          province?: string | null
          religion?: string | null
          selfie_url?: string | null
          sensitive_encrypted?: boolean | null
          sim_url?: string | null
          skck_url?: string | null
          status?: string | null
          updated_at?: string | null
          upload_ijasah?: string | null
          user_id?: string | null
          "users.entity"?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_contracts: {
        Row: {
          allowances: Json | null
          basic_salary: number | null
          benefits: string | null
          contract_file_url: string | null
          contract_number: string | null
          contract_type: string | null
          created_at: string | null
          employee_id: string | null
          end_date: string | null
          id: string
          salary: number | null
          start_date: string
          status: string | null
          terms: string | null
          updated_at: string | null
        }
        Insert: {
          allowances?: Json | null
          basic_salary?: number | null
          benefits?: string | null
          contract_file_url?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          salary?: number | null
          start_date: string
          status?: string | null
          terms?: string | null
          updated_at?: string | null
        }
        Update: {
          allowances?: Json | null
          basic_salary?: number | null
          benefits?: string | null
          contract_file_url?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          employee_id?: string | null
          end_date?: string | null
          id?: string
          salary?: number | null
          start_date?: string
          status?: string | null
          terms?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_items: {
        Row: {
          coa_account_code: string | null
          equity_name: string
          id: string
        }
        Insert: {
          coa_account_code?: string | null
          equity_name: string
          id?: string
        }
        Update: {
          coa_account_code?: string | null
          equity_name?: string
          id?: string
        }
        Relationships: []
      }
      expense_items: {
        Row: {
          coa_account_code: string | null
          created_at: string | null
          expense_category: string | null
          expense_name: string
          id: string
        }
        Insert: {
          coa_account_code?: string | null
          created_at?: string | null
          expense_category?: string | null
          expense_name: string
          id?: string
        }
        Update: {
          coa_account_code?: string | null
          created_at?: string | null
          expense_category?: string | null
          expense_name?: string
          id?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          id: string
          is_active: boolean | null
          name: string
          operating_hours: Json | null
          price_per_hour: number | null
          price_per_visit: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          operating_hours?: Json | null
          price_per_hour?: number | null
          price_per_visit?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          operating_hours?: Json | null
          price_per_hour?: number | null
          price_per_visit?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      facility_slots: {
        Row: {
          booked_count: number | null
          created_at: string | null
          end_time: string
          facility_id: string | null
          id: string
          is_available: boolean | null
          max_capacity: number | null
          slot_date: string
          start_time: string
        }
        Insert: {
          booked_count?: number | null
          created_at?: string | null
          end_time: string
          facility_id?: string | null
          id?: string
          is_available?: boolean | null
          max_capacity?: number | null
          slot_date: string
          start_time: string
        }
        Update: {
          booked_count?: number | null
          created_at?: string | null
          end_time?: string
          facility_id?: string | null
          id?: string
          is_available?: boolean | null
          max_capacity?: number | null
          slot_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_slots_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_approvals: {
        Row: {
          approved_by: string | null
          approved_by_name: string | null
          approved_name: string | null
          created_at: string | null
          id: string
          level: string | null
          notes: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_by_name?: string | null
          approved_name?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          notes?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_by_name?: string | null
          approved_name?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          notes?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_approvals_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transaction_breakdown: {
        Row: {
          account_code: string | null
          created_at: string | null
          description: string | null
          id: string
          item_name: string | null
          price: number | null
          qty: number | null
          raw_text: string | null
          subtotal: number | null
          transaction_id: string | null
        }
        Insert: {
          account_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string | null
          price?: number | null
          qty?: number | null
          raw_text?: string | null
          subtotal?: number | null
          transaction_id?: string | null
        }
        Update: {
          account_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string | null
          price?: number | null
          qty?: number | null
          raw_text?: string | null
          subtotal?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transaction_breakdown_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transaction_items: {
        Row: {
          created_at: string | null
          description: string | null
          finance_transaction_id: string | null
          id: string
          line_total: number | null
          qty: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          finance_transaction_id?: string | null
          id?: string
          line_total?: number | null
          qty?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          finance_transaction_id?: string | null
          id?: string
          line_total?: number | null
          qty?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transaction_items_finance_transaction_id_fkey"
            columns: ["finance_transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bukti_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          date_trans: string | null
          description: string | null
          document_number: string | null
          employee_id: string | null
          employee_name: string | null
          entity_id: string | null
          file_url: string | null
          id: string
          jenis: string | null
          journal_ref: string | null
          merchant: string | null
          ocr_data: Json | null
          ocr_date: string | null
          ocr_id: string | null
          ocr_merchant: string | null
          ocr_raw: Json | null
          ocr_raw_json: Json | null
          ocr_total: number | null
          payment_method: string | null
          ppn: number | null
          rejection_reason: string | null
          status: string | null
          total: number | null
          transaction_date: string | null
          transaction_type: string | null
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bukti_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date_trans?: string | null
          description?: string | null
          document_number?: string | null
          employee_id?: string | null
          employee_name?: string | null
          entity_id?: string | null
          file_url?: string | null
          id?: string
          jenis?: string | null
          journal_ref?: string | null
          merchant?: string | null
          ocr_data?: Json | null
          ocr_date?: string | null
          ocr_id?: string | null
          ocr_merchant?: string | null
          ocr_raw?: Json | null
          ocr_raw_json?: Json | null
          ocr_total?: number | null
          payment_method?: string | null
          ppn?: number | null
          rejection_reason?: string | null
          status?: string | null
          total?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          amount?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bukti_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date_trans?: string | null
          description?: string | null
          document_number?: string | null
          employee_id?: string | null
          employee_name?: string | null
          entity_id?: string | null
          file_url?: string | null
          id?: string
          jenis?: string | null
          journal_ref?: string | null
          merchant?: string | null
          ocr_data?: Json | null
          ocr_date?: string | null
          ocr_id?: string | null
          ocr_merchant?: string | null
          ocr_raw?: Json | null
          ocr_raw_json?: Json | null
          ocr_total?: number | null
          payment_method?: string | null
          ppn?: number | null
          rejection_reason?: string | null
          status?: string | null
          total?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_ocr_id_fkey"
            columns: ["ocr_id"]
            isOneToOne: false
            referencedRelation: "ocr_results"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          detected_tax: number | null
          finance_transaction_id: string | null
          id: string
          line_total: number | null
          qty: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          detected_tax?: number | null
          finance_transaction_id?: string | null
          id?: string
          line_total?: number | null
          qty?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          detected_tax?: number | null
          finance_transaction_id?: string | null
          id?: string
          line_total?: number | null
          qty?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_line_items_finance_transaction_id_fkey"
            columns: ["finance_transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          account_code: string | null
          accumulated_depreciation: number | null
          acquisition_cost: number | null
          asset_name: string | null
          created_at: string | null
          id: string
          last_depreciation_date: string | null
          residual_value: number | null
          status: string | null
          useful_life_years: number | null
        }
        Insert: {
          account_code?: string | null
          accumulated_depreciation?: number | null
          acquisition_cost?: number | null
          asset_name?: string | null
          created_at?: string | null
          id?: string
          last_depreciation_date?: string | null
          residual_value?: number | null
          status?: string | null
          useful_life_years?: number | null
        }
        Update: {
          account_code?: string | null
          accumulated_depreciation?: number | null
          acquisition_cost?: number | null
          asset_name?: string | null
          created_at?: string | null
          id?: string
          last_depreciation_date?: string | null
          residual_value?: number | null
          status?: string | null
          useful_life_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_account_code_fkey"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
        ]
      }
      general_journal: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          reference_no: string | null
          transaction_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_no?: string | null
          transaction_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_no?: string | null
          transaction_date?: string
        }
        Relationships: []
      }
      general_journal_lines: {
        Row: {
          account_code: string
          account_name: string
          created_at: string | null
          credit: number | null
          debit: number | null
          id: string
          journal_id: string | null
          note: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_id?: string | null
          note?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_id?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_journal_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "general_journal"
            referencedColumns: ["id"]
          },
        ]
      }
      general_ledger: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          Account_name: string | null
          account_type: string | null
          bukti_url: string | null
          created_at: string | null
          credit: number | null
          credit_account: string | null
          date: string | null
          debit: number | null
          debit_account: string | null
          description: string | null
          id: string
          jenis_transaksi: string | null
          journal_entry_id: string | null
          journal_id: string | null
          journal_number: number | null
          parent_id: string | null
          status: string | null
          transaction_date: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          Account_name?: string | null
          account_type?: string | null
          bukti_url?: string | null
          created_at?: string | null
          credit?: number | null
          credit_account?: string | null
          date?: string | null
          debit?: number | null
          debit_account?: string | null
          description?: string | null
          id?: string
          jenis_transaksi?: string | null
          journal_entry_id?: string | null
          journal_id?: string | null
          journal_number?: number | null
          parent_id?: string | null
          status?: string | null
          transaction_date?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          Account_name?: string | null
          account_type?: string | null
          bukti_url?: string | null
          created_at?: string | null
          credit?: number | null
          credit_account?: string | null
          date?: string | null
          debit?: number | null
          debit_account?: string | null
          description?: string | null
          id?: string
          jenis_transaksi?: string | null
          journal_entry_id?: string | null
          journal_id?: string | null
          journal_number?: number | null
          parent_id?: string | null
          status?: string | null
          transaction_date?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_gl_journal"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_gl_journal"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "v_wms_reversal_audit"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "fk_gl_journal"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "view_general_ledger"
            referencedColumns: ["journal_id"]
          },
          {
            foreignKeyName: "fk_gl_journal"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "vw_journal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "v_wms_reversal_audit"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "view_general_ledger"
            referencedColumns: ["journal_id"]
          },
          {
            foreignKeyName: "general_ledger_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "vw_journal_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      hrd_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrd_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hs_code_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          hs_code_id: string | null
          id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          hs_code_id?: string | null
          id?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          hs_code_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hs_code_embeddings_hs_code_id_fkey"
            columns: ["hs_code_id"]
            isOneToOne: false
            referencedRelation: "hs_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      hs_codes: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          export_duty_rate: number | null
          export_restriction: string | null
          hs_code: string
          id: string
          import_duty_rate: number | null
          import_restriction: string | null
          is_active: boolean | null
          notes: string | null
          pph_rate: number | null
          sub_category: string | null
          unit: string | null
          updated_at: string | null
          vat_rate: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          export_duty_rate?: number | null
          export_restriction?: string | null
          hs_code: string
          id?: string
          import_duty_rate?: number | null
          import_restriction?: string | null
          is_active?: boolean | null
          notes?: string | null
          pph_rate?: number | null
          sub_category?: string | null
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          export_duty_rate?: number | null
          export_restriction?: string | null
          hs_code?: string
          id?: string
          import_duty_rate?: number | null
          import_restriction?: string | null
          is_active?: boolean | null
          notes?: string | null
          pph_rate?: number | null
          sub_category?: string | null
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      ijazah_results: {
        Row: {
          created_at: string | null
          id: string
          jenjang: string | null
          jurusan: string | null
          nama: string | null
          nama_sekolah: string | null
          nomor_ijazah: string | null
          nomor_peserta_ujian: string | null
          processed_at: string | null
          raw_text: string | null
          tahun_lulus: string | null
          tanggal_lahir: string | null
          tanggal_lulus: string | null
          tempat_lahir: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          jenjang?: string | null
          jurusan?: string | null
          nama?: string | null
          nama_sekolah?: string | null
          nomor_ijazah?: string | null
          nomor_peserta_ujian?: string | null
          processed_at?: string | null
          raw_text?: string | null
          tahun_lulus?: string | null
          tanggal_lahir?: string | null
          tanggal_lulus?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          jenjang?: string | null
          jurusan?: string | null
          nama?: string | null
          nama_sekolah?: string | null
          nomor_ijazah?: string | null
          nomor_peserta_ujian?: string | null
          processed_at?: string | null
          raw_text?: string | null
          tahun_lulus?: string | null
          tanggal_lahir?: string | null
          tanggal_lulus?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      internal_usage: {
        Row: {
          coa_account_code: string
          coa_account_name: string
          coa_expense_code: string | null
          coa_inventory_code: string | null
          created_at: string | null
          created_by: string | null
          department_id: string | null
          department_name: string | null
          id: string
          item_id: string | null
          item_name: string
          notes: string | null
          purpose: string
          quantity: number
          stock_after: number
          stock_before: number
          total_cost: number
          unit_cost: number
          updated_at: string | null
          usage_date: string
          usage_location: string | null
          verified_by: string | null
          verified_by_name: string | null
        }
        Insert: {
          coa_account_code: string
          coa_account_name: string
          coa_expense_code?: string | null
          coa_inventory_code?: string | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          department_name?: string | null
          id?: string
          item_id?: string | null
          item_name: string
          notes?: string | null
          purpose: string
          quantity: number
          stock_after: number
          stock_before: number
          total_cost: number
          unit_cost: number
          updated_at?: string | null
          usage_date?: string
          usage_location?: string | null
          verified_by?: string | null
          verified_by_name?: string | null
        }
        Update: {
          coa_account_code?: string
          coa_account_name?: string
          coa_expense_code?: string | null
          coa_inventory_code?: string | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          department_name?: string | null
          id?: string
          item_id?: string | null
          item_name?: string
          notes?: string | null
          purpose?: string
          quantity?: number
          stock_after?: number
          stock_before?: number
          total_cost?: number
          unit_cost?: number
          updated_at?: string | null
          usage_date?: string
          usage_location?: string | null
          verified_by?: string | null
          verified_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_usage_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_usage_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_cost_layers: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          id: string
          qty_remaining: number | null
          sku: string | null
          source_ref: string | null
          source_type: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          id: string
          qty_remaining?: number | null
          sku?: string | null
          source_ref?: string | null
          source_type?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          id?: string
          qty_remaining?: number | null
          sku?: string | null
          source_ref?: string | null
          source_type?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          akun_persediaan: string | null
          asal_barang: string | null
          berat: number | null
          coa_cogs_code: string | null
          coa_inventory_code: string | null
          cost_per_unit: number | null
          created_at: string | null
          dibuat_oleh: string | null
          harga_per_unit: number | null
          id: string
          item_id: string | null
          jenis_barang: string | null
          keterangan: string | null
          kode_barang: string | null
          lama_simpan: number | null
          line: string | null
          lokasi: string | null
          mata_uang: string | null
          nama_barang: string
          nomor_batch_lot: string | null
          nomor_dokumen_pabean: string | null
          nomor_seri: string | null
          qty_available: number | null
          sku: string
          status: string
          sync_status: string | null
          tanggal_masuk: string
          tanggal_posting_ceisa: string | null
          total_biaya: number | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          akun_persediaan?: string | null
          asal_barang?: string | null
          berat?: number | null
          coa_cogs_code?: string | null
          coa_inventory_code?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          dibuat_oleh?: string | null
          harga_per_unit?: number | null
          id?: string
          item_id?: string | null
          jenis_barang?: string | null
          keterangan?: string | null
          kode_barang?: string | null
          lama_simpan?: number | null
          line?: string | null
          lokasi?: string | null
          mata_uang?: string | null
          nama_barang: string
          nomor_batch_lot?: string | null
          nomor_dokumen_pabean?: string | null
          nomor_seri?: string | null
          qty_available?: number | null
          sku: string
          status: string
          sync_status?: string | null
          tanggal_masuk: string
          tanggal_posting_ceisa?: string | null
          total_biaya?: number | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          akun_persediaan?: string | null
          asal_barang?: string | null
          berat?: number | null
          coa_cogs_code?: string | null
          coa_inventory_code?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          dibuat_oleh?: string | null
          harga_per_unit?: number | null
          id?: string
          item_id?: string | null
          jenis_barang?: string | null
          keterangan?: string | null
          kode_barang?: string | null
          lama_simpan?: number | null
          line?: string | null
          lokasi?: string | null
          mata_uang?: string | null
          nama_barang?: string
          nomor_batch_lot?: string | null
          nomor_dokumen_pabean?: string | null
          nomor_seri?: string | null
          qty_available?: number | null
          sku?: string
          status?: string
          sync_status?: string | null
          tanggal_masuk?: string
          tanggal_posting_ceisa?: string | null
          total_biaya?: number | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements_accounting: {
        Row: {
          created_at: string | null
          id: string
          journal_entry_id: string | null
          movement_type: string | null
          qty: number | null
          value: number | null
          wms_transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          journal_entry_id?: string | null
          movement_type?: string | null
          qty?: number | null
          value?: number | null
          wms_transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          journal_entry_id?: string | null
          movement_type?: string | null
          qty?: number | null
          value?: number | null
          wms_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_accounting_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_accounting_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "v_wms_reversal_audit"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "inventory_movements_accounting_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "view_general_ledger"
            referencedColumns: ["journal_id"]
          },
          {
            foreignKeyName: "inventory_movements_accounting_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "vw_journal_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_accounting_wms_transaction_id_fkey"
            columns: ["wms_transaction_id"]
            isOneToOne: false
            referencedRelation: "v_wms_reversal_audit"
            referencedColumns: ["wms_transaction_id"]
          },
          {
            foreignKeyName: "inventory_movements_accounting_wms_transaction_id_fkey"
            columns: ["wms_transaction_id"]
            isOneToOne: false
            referencedRelation: "wms_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number | null
          bank_mutation_id: string | null
          id: string
          invoice_id: string | null
          invoice_type: string | null
          payment_date: string | null
        }
        Insert: {
          amount?: number | null
          bank_mutation_id?: string | null
          id?: string
          invoice_id?: string | null
          invoice_type?: string | null
          payment_date?: string | null
        }
        Update: {
          amount?: number | null
          bank_mutation_id?: string | null
          id?: string
          invoice_id?: string | null
          invoice_type?: string | null
          payment_date?: string | null
        }
        Relationships: []
      }
      item_brand_mapping: {
        Row: {
          brand_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          item_name: string
          updated_at: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_name: string
          updated_at?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      item_master: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          item_name: string
          jenis_barang: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_name: string
          jenis_barang: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string
          jenis_barang?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sku: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sku?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sku?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      jenis_barang: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          account_number: string | null
          account_type: string | null
          amount: number | null
          approval_log: Json | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          bank_mutation_id: string | null
          bukti: string | null
          bukti_url: string | null
          code_booking: string | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          credit: number | null
          credit_account: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          date: string | null
          debit: number | null
          debit_account: string | null
          debit_account_code: string | null
          debit_account_name: string | null
          description: string | null
          disbursement_id: string | null
          entry_date: string | null
          entry_type: string | null
          handled_by_user_id: string | null
          id: string
          is_void: boolean | null
          jenis_transaksi: string | null
          journal_date: string | null
          journal_number: string | null
          journal_ref: string | null
          kategori: string | null
          keterangan: string | null
          license_plate: string | null
          make: string | null
          memo: string | null
          model: string | null
          nama: string | null
          note: string | null
          payee_name: string | null
          payer_name: string | null
          posting_date: string | null
          reference: string | null
          reference_id: string | null
          reference_number: string | null
          reference_type: string | null
          sales_transactions_id: string | null
          service_type: string | null
          source_file: string | null
          source_id: string | null
          source_ref: string | null
          source_reference: string | null
          source_table: string | null
          source_type: string | null
          status: string | null
          stock_adjustment_id: string | null
          stock_movement_id: string | null
          sumber_penerimaan: string | null
          sumber_pengeluaran: string | null
          tanggal: string | null
          total_credit: number | null
          total_debit: number | null
          transaction_date: string | null
          transaction_id: string | null
          transaction_type: string | null
          updated_at: string | null
          vehicle_type: string | null
          void_date: string | null
          void_reason: string | null
        }
        Insert: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          amount?: number | null
          approval_log?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          bank_mutation_id?: string | null
          bukti?: string | null
          bukti_url?: string | null
          code_booking?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          credit?: number | null
          credit_account?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          date?: string | null
          debit?: number | null
          debit_account?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description?: string | null
          disbursement_id?: string | null
          entry_date?: string | null
          entry_type?: string | null
          handled_by_user_id?: string | null
          id?: string
          is_void?: boolean | null
          jenis_transaksi?: string | null
          journal_date?: string | null
          journal_number?: string | null
          journal_ref?: string | null
          kategori?: string | null
          keterangan?: string | null
          license_plate?: string | null
          make?: string | null
          memo?: string | null
          model?: string | null
          nama?: string | null
          note?: string | null
          payee_name?: string | null
          payer_name?: string | null
          posting_date?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          sales_transactions_id?: string | null
          service_type?: string | null
          source_file?: string | null
          source_id?: string | null
          source_ref?: string | null
          source_reference?: string | null
          source_table?: string | null
          source_type?: string | null
          status?: string | null
          stock_adjustment_id?: string | null
          stock_movement_id?: string | null
          sumber_penerimaan?: string | null
          sumber_pengeluaran?: string | null
          tanggal?: string | null
          total_credit?: number | null
          total_debit?: number | null
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          void_date?: string | null
          void_reason?: string | null
        }
        Update: {
          account_code?: string | null
          account_id?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          amount?: number | null
          approval_log?: Json | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          bank_mutation_id?: string | null
          bukti?: string | null
          bukti_url?: string | null
          code_booking?: string | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          credit?: number | null
          credit_account?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          date?: string | null
          debit?: number | null
          debit_account?: string | null
          debit_account_code?: string | null
          debit_account_name?: string | null
          description?: string | null
          disbursement_id?: string | null
          entry_date?: string | null
          entry_type?: string | null
          handled_by_user_id?: string | null
          id?: string
          is_void?: boolean | null
          jenis_transaksi?: string | null
          journal_date?: string | null
          journal_number?: string | null
          journal_ref?: string | null
          kategori?: string | null
          keterangan?: string | null
          license_plate?: string | null
          make?: string | null
          memo?: string | null
          model?: string | null
          nama?: string | null
          note?: string | null
          payee_name?: string | null
          payer_name?: string | null
          posting_date?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_number?: string | null
          reference_type?: string | null
          sales_transactions_id?: string | null
          service_type?: string | null
          source_file?: string | null
          source_id?: string | null
          source_ref?: string | null
          source_reference?: string | null
          source_table?: string | null
          source_type?: string | null
          status?: string | null
          stock_adjustment_id?: string | null
          stock_movement_id?: string | null
          sumber_penerimaan?: string | null
          sumber_pengeluaran?: string | null
          tanggal?: string | null
          total_credit?: number | null
          total_debit?: number | null
          transaction_date?: string | null
          transaction_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          void_date?: string | null
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_entries_account"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
          {
            foreignKeyName: "fk_journal_stock_adj"
            columns: ["stock_adjustment_id"]
            isOneToOne: false
            referencedRelation: "stock_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_journal_stock_adj"
            columns: ["stock_adjustment_id"]
            isOneToOne: false
            referencedRelation: "stock_adjustments_with_supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_sales_transactions_fk"
            columns: ["sales_transactions_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_stock_movement_id_fkey"
            columns: ["stock_movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movement"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_items: {
        Row: {
          account_code: string | null
          account_id: string
          account_type: string | null
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_code?: string | null
          account_id: string
          account_type?: string | null
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_code?: string | null
          account_id?: string
          account_type?: string | null
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "v_wms_reversal_audit"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "view_general_ledger"
            referencedColumns: ["journal_id"]
          },
          {
            foreignKeyName: "journal_entry_items_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "vw_journal_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_code: string
          account_id: string | null
          account_name: string | null
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          journal_entry_id: string | null
          journal_id: string | null
          note: string | null
        }
        Insert: {
          account_code: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          journal_id?: string | null
          note?: string | null
        }
        Update: {
          account_code?: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string | null
          journal_id?: string | null
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "v_wms_reversal_audit"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "view_general_ledger"
            referencedColumns: ["journal_id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "vw_journal_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      kas_transaksi: {
        Row: {
          account_code: string | null
          account_name: string
          account_number: string
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          bukti: string | null
          bukti_url: string | null
          created_at: string | null
          created_by: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          description: string | null
          deskripsi: string | null
          document_number: string | null
          employee_id: string | null
          entity_id: string | null
          id: string
          jenis_transaksi: string | null
          journal_ref: string | null
          kategori: string | null
          keterangan: string | null
          metode_pembayaran: string | null
          nama_pemilik: string | null
          nama_penerima: string | null
          nama_pengeluaran: string | null
          nama_penyumbang: string | null
          nominal: number
          notes: string | null
          ocr_data: string | null
          ocr_id: string | null
          payment_type: string
          rejection_reason: string | null
          service_category: string | null
          service_type: string | null
          sumber_penerimaan: string | null
          tanggal: string
          tax_amount: number | null
          tax_percentage: number | null
          tax_type: string | null
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_name: string
          account_number: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bukti?: string | null
          bukti_url?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          description?: string | null
          deskripsi?: string | null
          document_number?: string | null
          employee_id?: string | null
          entity_id?: string | null
          id?: string
          jenis_transaksi?: string | null
          journal_ref?: string | null
          kategori?: string | null
          keterangan?: string | null
          metode_pembayaran?: string | null
          nama_pemilik?: string | null
          nama_penerima?: string | null
          nama_pengeluaran?: string | null
          nama_penyumbang?: string | null
          nominal: number
          notes?: string | null
          ocr_data?: string | null
          ocr_id?: string | null
          payment_type: string
          rejection_reason?: string | null
          service_category?: string | null
          service_type?: string | null
          sumber_penerimaan?: string | null
          tanggal: string
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string
          account_number?: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bukti?: string | null
          bukti_url?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          description?: string | null
          deskripsi?: string | null
          document_number?: string | null
          employee_id?: string | null
          entity_id?: string | null
          id?: string
          jenis_transaksi?: string | null
          journal_ref?: string | null
          kategori?: string | null
          keterangan?: string | null
          metode_pembayaran?: string | null
          nama_pemilik?: string | null
          nama_penerima?: string | null
          nama_pengeluaran?: string | null
          nama_penyumbang?: string | null
          nominal?: number
          notes?: string | null
          ocr_data?: string | null
          ocr_id?: string | null
          payment_type?: string
          rejection_reason?: string | null
          service_category?: string | null
          service_type?: string | null
          sumber_penerimaan?: string | null
          tanggal?: string
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kk_results: {
        Row: {
          alamat: string | null
          anggota_keluarga: Json | null
          created_at: string | null
          id: string
          kabupaten_kota: string | null
          kecamatan: string | null
          kelurahan_desa: string | null
          kode_pos: string | null
          nama_kepala_keluarga: string | null
          nomor_kk: string | null
          processed_at: string | null
          provinsi: string | null
          raw_text: string | null
          rt_rw: string | null
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          anggota_keluarga?: Json | null
          created_at?: string | null
          id?: string
          kabupaten_kota?: string | null
          kecamatan?: string | null
          kelurahan_desa?: string | null
          kode_pos?: string | null
          nama_kepala_keluarga?: string | null
          nomor_kk?: string | null
          processed_at?: string | null
          provinsi?: string | null
          raw_text?: string | null
          rt_rw?: string | null
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          anggota_keluarga?: Json | null
          created_at?: string | null
          id?: string
          kabupaten_kota?: string | null
          kecamatan?: string | null
          kelurahan_desa?: string | null
          kode_pos?: string | null
          nama_kepala_keluarga?: string | null
          nomor_kk?: string | null
          processed_at?: string | null
          provinsi?: string | null
          raw_text?: string | null
          rt_rw?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ktp_results: {
        Row: {
          agama: string | null
          alamat: string | null
          berlaku_hingga: string | null
          created_at: string | null
          golongan_darah: string | null
          id: string
          jenis_kelamin: string | null
          kabupaten_kota: string | null
          kecamatan: string | null
          kelurahan_desa: string | null
          kewarganegaraan: string | null
          nama: string | null
          nik: string | null
          pekerjaan: string | null
          processed_at: string | null
          provinsi: string | null
          raw_text: string | null
          rt_rw: string | null
          status_perkawinan: string | null
          tanggal_lahir: string | null
          tempat_lahir: string | null
          user_id: string | null
        }
        Insert: {
          agama?: string | null
          alamat?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          golongan_darah?: string | null
          id?: string
          jenis_kelamin?: string | null
          kabupaten_kota?: string | null
          kecamatan?: string | null
          kelurahan_desa?: string | null
          kewarganegaraan?: string | null
          nama?: string | null
          nik?: string | null
          pekerjaan?: string | null
          processed_at?: string | null
          provinsi?: string | null
          raw_text?: string | null
          rt_rw?: string | null
          status_perkawinan?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Update: {
          agama?: string | null
          alamat?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          golongan_darah?: string | null
          id?: string
          jenis_kelamin?: string | null
          kabupaten_kota?: string | null
          kecamatan?: string | null
          kelurahan_desa?: string | null
          kewarganegaraan?: string | null
          nama?: string | null
          nik?: string | null
          pekerjaan?: string | null
          processed_at?: string | null
          provinsi?: string | null
          raw_text?: string | null
          rt_rw?: string | null
          status_perkawinan?: string | null
          tanggal_lahir?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      laporan_neraca: {
        Row: {
          account_code: string
          account_name: string
          balance: number
          created_at: string
          id: string
          period_end: string
          period_start: string
          section: string
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          balance?: number
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          section: string
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          balance?: number
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_balance: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          leave_type_id: string | null
          remaining_days: number
          total_days: number
          updated_at: string | null
          used_days: number | null
          year: number
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          leave_type_id?: string | null
          remaining_days: number
          total_days: number
          updated_at?: string | null
          used_days?: number | null
          year: number
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          leave_type_id?: string | null
          remaining_days?: number
          total_days?: number
          updated_at?: string | null
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balance_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          document_url: string | null
          employee_id: string | null
          end_date: string
          id: string
          leave_type_id: string | null
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string | null
          total_days: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_url?: string | null
          employee_id?: string | null
          end_date: string
          id?: string
          leave_type_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string | null
          total_days: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          document_url?: string | null
          employee_id?: string | null
          end_date?: string
          id?: string
          leave_type_id?: string | null
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string | null
          total_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_paid: boolean | null
          leave_name: string
          max_days: number | null
          requires_approval: boolean | null
          requires_document: boolean | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          leave_name: string
          max_days?: number | null
          requires_approval?: boolean | null
          requires_document?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_paid?: boolean | null
          leave_name?: string
          max_days?: number | null
          requires_approval?: boolean | null
          requires_document?: boolean | null
        }
        Relationships: []
      }
      loan_installments: {
        Row: {
          actual_payment_date: string | null
          created_at: string | null
          days_late: number | null
          due_date: string
          id: string
          installment_number: number
          interest_amount: number
          late_fee: number | null
          late_fee_percentage: number | null
          loan_id: string
          notes: string | null
          paid_amount: number | null
          payment_date: string | null
          principal_amount: number
          remaining_balance: number | null
          status: string | null
          tax_amount: number | null
          tax_percentage: number | null
          tax_type: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          actual_payment_date?: string | null
          created_at?: string | null
          days_late?: number | null
          due_date: string
          id?: string
          installment_number: number
          interest_amount?: number
          late_fee?: number | null
          late_fee_percentage?: number | null
          loan_id: string
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          principal_amount?: number
          remaining_balance?: number | null
          status?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          actual_payment_date?: string | null
          created_at?: string | null
          days_late?: number | null
          due_date?: string
          id?: string
          installment_number?: number
          interest_amount?: number
          late_fee?: number | null
          late_fee_percentage?: number | null
          loan_id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          principal_amount?: number
          remaining_balance?: number | null
          status?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_installments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_installments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "vw_loan_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          borrower_id: string | null
          coa_cash_code: string
          coa_interest_code: string | null
          coa_loan_code: string
          created_at: string | null
          id: string
          interest_rate: number | null
          journal_ref: string | null
          late_fee_per_day: number | null
          late_fee_percentage: number | null
          lender_name: string
          lender_type: string | null
          loan_date: string
          loan_number: string | null
          loan_term_months: number | null
          maturity_date: string | null
          notes: string | null
          payment_history: Json | null
          payment_schedule: string | null
          principal_amount: number
          purpose: string | null
          remaining_balance: number | null
          status: string | null
          tax_amount: number | null
          tax_percentage: number | null
          tax_type: string | null
          total_interest_paid: number | null
          total_paid: number | null
          updated_at: string | null
        }
        Insert: {
          borrower_id?: string | null
          coa_cash_code: string
          coa_interest_code?: string | null
          coa_loan_code: string
          created_at?: string | null
          id?: string
          interest_rate?: number | null
          journal_ref?: string | null
          late_fee_per_day?: number | null
          late_fee_percentage?: number | null
          lender_name: string
          lender_type?: string | null
          loan_date: string
          loan_number?: string | null
          loan_term_months?: number | null
          maturity_date?: string | null
          notes?: string | null
          payment_history?: Json | null
          payment_schedule?: string | null
          principal_amount: number
          purpose?: string | null
          remaining_balance?: number | null
          status?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_interest_paid?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Update: {
          borrower_id?: string | null
          coa_cash_code?: string
          coa_interest_code?: string | null
          coa_loan_code?: string
          created_at?: string | null
          id?: string
          interest_rate?: number | null
          journal_ref?: string | null
          late_fee_per_day?: number | null
          late_fee_percentage?: number | null
          lender_name?: string
          lender_type?: string | null
          loan_date?: string
          loan_number?: string | null
          loan_term_months?: number | null
          maturity_date?: string | null
          notes?: string | null
          payment_history?: Json | null
          payment_schedule?: string | null
          principal_amount?: number
          purpose?: string | null
          remaining_balance?: number | null
          status?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_interest_paid?: number | null
          total_paid?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_borrower"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      lots: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          item_name: string | null
          lot_number: string
          manufacturing_date: string | null
          quantity: number | null
          rack_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string | null
          lot_number: string
          manufacturing_date?: string | null
          quantity?: number | null
          rack_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string | null
          lot_number?: string
          manufacturing_date?: string | null
          quantity?: number | null
          rack_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lots_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "racks"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string | null
          description: string | null
          duration_months: number
          entity_id: string | null
          facility_type: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
          visits_per_month: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_months: number
          entity_id?: string | null
          facility_type: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
          visits_per_month?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_months?: number
          entity_id?: string | null
          facility_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
          visits_per_month?: number | null
        }
        Relationships: []
      }
      monthly_inventory_closing: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          locked: boolean
          notes: string | null
          period: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          locked?: boolean
          notes?: string | null
          period: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          locked?: boolean
          notes?: string | null
          period?: string
        }
        Relationships: []
      }
      noa_documents: {
        Row: {
          arrival_date: string | null
          bl_number: string | null
          cbm: string | null
          charges: Json | null
          consignee: string | null
          container_no: string | null
          created_at: string | null
          created_by: string | null
          file_url: string | null
          full_json: Json | null
          goods_description: string | null
          gross_weight: string | null
          hs_code: string | null
          id: string
          port_discharge: string | null
          port_loading: string | null
          shipper: string | null
          status: string | null
          vessel: string | null
          voyage: string | null
        }
        Insert: {
          arrival_date?: string | null
          bl_number?: string | null
          cbm?: string | null
          charges?: Json | null
          consignee?: string | null
          container_no?: string | null
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          full_json?: Json | null
          goods_description?: string | null
          gross_weight?: string | null
          hs_code?: string | null
          id?: string
          port_discharge?: string | null
          port_loading?: string | null
          shipper?: string | null
          status?: string | null
          vessel?: string | null
          voyage?: string | null
        }
        Update: {
          arrival_date?: string | null
          bl_number?: string | null
          cbm?: string | null
          charges?: Json | null
          consignee?: string | null
          container_no?: string | null
          created_at?: string | null
          created_by?: string | null
          file_url?: string | null
          full_json?: Json | null
          goods_description?: string | null
          gross_weight?: string | null
          hs_code?: string | null
          id?: string
          port_discharge?: string | null
          port_loading?: string | null
          shipper?: string | null
          status?: string | null
          vessel?: string | null
          voyage?: string | null
        }
        Relationships: []
      }
      npwp_results: {
        Row: {
          alamat: string | null
          created_at: string | null
          id: string
          kabupaten_kota: string | null
          kecamatan: string | null
          kelurahan_desa: string | null
          kode_pos: string | null
          nama: string | null
          nik: string | null
          npwp: string | null
          processed_at: string | null
          provinsi: string | null
          raw_text: string | null
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string | null
          id?: string
          kabupaten_kota?: string | null
          kecamatan?: string | null
          kelurahan_desa?: string | null
          kode_pos?: string | null
          nama?: string | null
          nik?: string | null
          npwp?: string | null
          processed_at?: string | null
          provinsi?: string | null
          raw_text?: string | null
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string | null
          id?: string
          kabupaten_kota?: string | null
          kecamatan?: string | null
          kelurahan_desa?: string | null
          kode_pos?: string | null
          nama?: string | null
          nik?: string | null
          npwp?: string | null
          processed_at?: string | null
          provinsi?: string | null
          raw_text?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ocr_documents: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          ocr_provider: string | null
          ocr_raw_text: string | null
          ocr_structured_data: Json | null
          processing_status: string | null
          storage_path: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          ocr_provider?: string | null
          ocr_raw_text?: string | null
          ocr_structured_data?: Json | null
          processing_status?: string | null
          storage_path?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          ocr_provider?: string | null
          ocr_raw_text?: string | null
          ocr_structured_data?: Json | null
          processing_status?: string | null
          storage_path?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_documents_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transaction_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_results: {
        Row: {
          autofill_status: string | null
          confidence: string | null
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          extracted_data: Json | null
          extracted_text: string | null
          file_name: string | null
          file_path: string | null
          file_url: string | null
          id: string
          image_url: string | null
          invoice: string | null
          json_data: Json | null
          nama_karyawan: string | null
          nominal: number | null
          nomor_nota: string | null
          ocr_data: string | null
          raw_text: string | null
          supplier: string | null
          tanggal: string | null
          toko: string | null
          updated_at: string | null
          user_id: string | null
          "users.entity": string | null
        }
        Insert: {
          autofill_status?: string | null
          confidence?: string | null
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          extracted_data?: Json | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          invoice?: string | null
          json_data?: Json | null
          nama_karyawan?: string | null
          nominal?: number | null
          nomor_nota?: string | null
          ocr_data?: string | null
          raw_text?: string | null
          supplier?: string | null
          tanggal?: string | null
          toko?: string | null
          updated_at?: string | null
          user_id?: string | null
          "users.entity"?: string | null
        }
        Update: {
          autofill_status?: string | null
          confidence?: string | null
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          extracted_data?: Json | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          invoice?: string | null
          json_data?: Json | null
          nama_karyawan?: string | null
          nominal?: number | null
          nomor_nota?: string | null
          ocr_data?: string | null
          raw_text?: string | null
          supplier?: string | null
          tanggal?: string | null
          toko?: string | null
          updated_at?: string | null
          user_id?: string | null
          "users.entity"?: string | null
        }
        Relationships: []
      }
      other_income_items: {
        Row: {
          coa_account_code: string | null
          created_at: string | null
          id: string
          income_category: string | null
          income_name: string
        }
        Insert: {
          coa_account_code?: string | null
          created_at?: string | null
          id?: string
          income_category?: string | null
          income_name: string
        }
        Update: {
          coa_account_code?: string | null
          created_at?: string | null
          id?: string
          income_category?: string | null
          income_name?: string
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          coa_code: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_bank: boolean | null
          is_cash: boolean | null
          is_credit: boolean | null
          method_name: string | null
          method_type: string | null
          name: string
        }
        Insert: {
          coa_code?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_bank?: boolean | null
          is_cash?: boolean | null
          is_credit?: boolean | null
          method_name?: string | null
          method_type?: string | null
          name: string
        }
        Update: {
          coa_code?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_bank?: boolean | null
          is_cash?: boolean | null
          is_credit?: boolean | null
          method_name?: string | null
          method_type?: string | null
          name?: string
        }
        Relationships: []
      }
      payment_terms: {
        Row: {
          created_at: string | null
          days: number
          description: string | null
          id: string
          is_active: boolean | null
          term_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          term_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          term_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_reference: string | null
          channel: string | null
          created_at: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          status: string | null
        }
        Insert: {
          amount: number
          booking_reference?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          booking_reference?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Relationships: []
      }
      payroll: {
        Row: {
          absence_deduction: number | null
          basic_salary: number
          bpjs_kesehatan_deduction: number | null
          bpjs_ketenagakerjaan_deduction: number | null
          created_at: string | null
          employee_id: string | null
          gross_salary: number
          id: string
          late_deduction: number | null
          loan_deduction: number | null
          meal_allowance: number | null
          net_salary: number
          notes: string | null
          other_allowances: Json | null
          other_deductions: Json | null
          overtime_hours: number | null
          overtime_pay: number | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          period_month: number
          period_year: number
          position_allowance: number | null
          slip_file_url: string | null
          tax_pph21: number | null
          total_deductions: number
          transport_allowance: number | null
          updated_at: string | null
        }
        Insert: {
          absence_deduction?: number | null
          basic_salary: number
          bpjs_kesehatan_deduction?: number | null
          bpjs_ketenagakerjaan_deduction?: number | null
          created_at?: string | null
          employee_id?: string | null
          gross_salary: number
          id?: string
          late_deduction?: number | null
          loan_deduction?: number | null
          meal_allowance?: number | null
          net_salary: number
          notes?: string | null
          other_allowances?: Json | null
          other_deductions?: Json | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          period_month: number
          period_year: number
          position_allowance?: number | null
          slip_file_url?: string | null
          tax_pph21?: number | null
          total_deductions: number
          transport_allowance?: number | null
          updated_at?: string | null
        }
        Update: {
          absence_deduction?: number | null
          basic_salary?: number
          bpjs_kesehatan_deduction?: number | null
          bpjs_ketenagakerjaan_deduction?: number | null
          created_at?: string | null
          employee_id?: string | null
          gross_salary?: number
          id?: string
          late_deduction?: number | null
          loan_deduction?: number | null
          meal_allowance?: number | null
          net_salary?: number
          notes?: string | null
          other_allowances?: Json | null
          other_deductions?: Json | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          period_month?: number
          period_year?: number
          position_allowance?: number | null
          slip_file_url?: string | null
          tax_pph21?: number | null
          total_deductions?: number
          transport_allowance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          achievements: string | null
          areas_for_improvement: string | null
          attendance_punctuality: string | null
          comments: string | null
          communication: string | null
          created_at: string | null
          criteria: Json | null
          employee_id: string | null
          goals: string | null
          id: string
          initiative: string | null
          leadership: string | null
          overall_rating: number | null
          problem_solving: string | null
          productivity: string | null
          quality_of_work: string | null
          review_date: string
          review_period_end: string
          review_period_start: string
          reviewer_id: string | null
          status: string | null
          strengths: string | null
          teamwork: string | null
          training_needs: string | null
          updated_at: string | null
        }
        Insert: {
          achievements?: string | null
          areas_for_improvement?: string | null
          attendance_punctuality?: string | null
          comments?: string | null
          communication?: string | null
          created_at?: string | null
          criteria?: Json | null
          employee_id?: string | null
          goals?: string | null
          id?: string
          initiative?: string | null
          leadership?: string | null
          overall_rating?: number | null
          problem_solving?: string | null
          productivity?: string | null
          quality_of_work?: string | null
          review_date: string
          review_period_end: string
          review_period_start: string
          reviewer_id?: string | null
          status?: string | null
          strengths?: string | null
          teamwork?: string | null
          training_needs?: string | null
          updated_at?: string | null
        }
        Update: {
          achievements?: string | null
          areas_for_improvement?: string | null
          attendance_punctuality?: string | null
          comments?: string | null
          communication?: string | null
          created_at?: string | null
          criteria?: Json | null
          employee_id?: string | null
          goals?: string | null
          id?: string
          initiative?: string | null
          leadership?: string | null
          overall_rating?: number | null
          problem_solving?: string | null
          productivity?: string | null
          quality_of_work?: string | null
          review_date?: string
          review_period_end?: string
          review_period_start?: string
          reviewer_id?: string | null
          status?: string | null
          strengths?: string | null
          teamwork?: string | null
          training_needs?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      perpindahan_lini: {
        Row: {
          berat: number | null
          created_at: string | null
          hari_di_lini_1: number | null
          id: string
          kode_barang: string | null
          lokasi: string | null
          nama_barang: string
          nomor_dokumen_pabean: string | null
          sku: string
          tanggal_masuk_lini_1: string | null
          tanggal_pindah_lini_2: string
          total_biaya_lini_1: number | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          berat?: number | null
          created_at?: string | null
          hari_di_lini_1?: number | null
          id?: string
          kode_barang?: string | null
          lokasi?: string | null
          nama_barang: string
          nomor_dokumen_pabean?: string | null
          sku: string
          tanggal_masuk_lini_1?: string | null
          tanggal_pindah_lini_2: string
          total_biaya_lini_1?: number | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          berat?: number | null
          created_at?: string | null
          hari_di_lini_1?: number | null
          id?: string
          kode_barang?: string | null
          lokasi?: string | null
          nama_barang?: string
          nomor_dokumen_pabean?: string | null
          sku?: string
          tanggal_masuk_lini_1?: string | null
          tanggal_pindah_lini_2?: string
          total_biaya_lini_1?: number | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string | null
          department_id: string | null
          description: string | null
          id: string
          level: string | null
          position_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          level?: string | null
          position_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          description?: string | null
          id?: string
          level?: string | null
          position_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reference: {
        Row: {
          berat: number | null
          brand: string | null
          coa_account_code: string | null
          coa_account_name: string | null
          created_at: string | null
          description: string | null
          hs_code: string | null
          id: string
          item_name: string
          jenis_layanan: string | null
          kategori_layanan: string | null
          satuan: string | null
          service_category: string | null
          service_type: string | null
          typical_weight: string | null
          unit: string | null
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          berat?: number | null
          brand?: string | null
          coa_account_code?: string | null
          coa_account_name?: string | null
          created_at?: string | null
          description?: string | null
          hs_code?: string | null
          id?: string
          item_name: string
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          satuan?: string | null
          service_category?: string | null
          service_type?: string | null
          typical_weight?: string | null
          unit?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          berat?: number | null
          brand?: string | null
          coa_account_code?: string | null
          coa_account_name?: string | null
          created_at?: string | null
          description?: string | null
          hs_code?: string | null
          id?: string
          item_name?: string
          jenis_layanan?: string | null
          kategori_layanan?: string | null
          satuan?: string | null
          service_category?: string | null
          service_type?: string | null
          typical_weight?: string | null
          unit?: string | null
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      profit_centers: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      purchase_invoices: {
        Row: {
          id: string
          invoice_date: string | null
          invoice_no: string | null
          outstanding_amount: number | null
          paid_amount: number | null
          status: string | null
          total_amount: number | null
          vendor_name: string | null
        }
        Insert: {
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
          vendor_name?: string | null
        }
        Update: {
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          barcode: string | null
          code: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          email: string | null
          foto_barang: string | null
          id: string
          item_description: string | null
          item_name: string
          name: string
          notes: string | null
          pph_amount: number | null
          pph_percentage: number | null
          ppn_amount: number | null
          ppn_percentage: number | null
          quantity: number
          request_code: string | null
          request_date: string
          request_number: string | null
          requester_id: string | null
          requester_name: string | null
          shipping_cost: number | null
          status: string | null
          supplier_id: string | null
          tax: number | null
          total_amount: number
          unit: string | null
          unit_price: number
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          barcode?: string | null
          code?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          email?: string | null
          foto_barang?: string | null
          id?: string
          item_description?: string | null
          item_name: string
          name: string
          notes?: string | null
          pph_amount?: number | null
          pph_percentage?: number | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity: number
          request_code?: string | null
          request_date: string
          request_number?: string | null
          requester_id?: string | null
          requester_name?: string | null
          shipping_cost?: number | null
          status?: string | null
          supplier_id?: string | null
          tax?: number | null
          total_amount: number
          unit?: string | null
          unit_price: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          barcode?: string | null
          code?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          email?: string | null
          foto_barang?: string | null
          id?: string
          item_description?: string | null
          item_name?: string
          name?: string
          notes?: string | null
          pph_amount?: number | null
          pph_percentage?: number | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number
          request_code?: string | null
          request_date?: string
          request_number?: string | null
          requester_id?: string | null
          requester_name?: string | null
          shipping_cost?: number | null
          status?: string | null
          supplier_id?: string | null
          tax?: number | null
          total_amount?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skema_PR_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_transactions: {
        Row: {
          account_code: string | null
          account_name: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          brand: string | null
          bukti: string | null
          coa_cash_code: string | null
          coa_expense_code: string | null
          coa_inventory_code: string | null
          coa_payable_code: string | null
          coa_tax_code: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          item_id: string | null
          item_name: string | null
          journal_ref: string | null
          notes: string | null
          ocr_data: Json | null
          ocr_id: string | null
          payment_method: string | null
          ppn_amount: number | null
          ppn_percentage: number | null
          quantity: number | null
          rejection_reason: string | null
          subtotal: number
          supplier_name: string | null
          tax_amount: number | null
          tax_percentage: number | null
          tax_type: string | null
          total_amount: number
          transaction_date: string
          transaction_type: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand?: string | null
          bukti?: string | null
          coa_cash_code?: string | null
          coa_expense_code?: string | null
          coa_inventory_code?: string | null
          coa_payable_code?: string | null
          coa_tax_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          journal_ref?: string | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payment_method?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          rejection_reason?: string | null
          subtotal: number
          supplier_name?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_amount: number
          transaction_date: string
          transaction_type: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand?: string | null
          bukti?: string | null
          coa_cash_code?: string | null
          coa_expense_code?: string | null
          coa_inventory_code?: string | null
          coa_payable_code?: string | null
          coa_tax_code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          item_name?: string | null
          journal_ref?: string | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payment_method?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          rejection_reason?: string | null
          subtotal?: number
          supplier_name?: string | null
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_amount?: number
          transaction_date?: string
          transaction_type?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "vw_stock_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      racks: {
        Row: {
          capacity: number | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          level: number | null
          name: string
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          capacity?: number | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          capacity?: number | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          name?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racks_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          entity_id: string | null
          id: string
          menu_key: string
          role: string
          updated_at: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          menu_key: string
          role: string
          updated_at?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          menu_key?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          entitas: string | null
          entity: string | null
          id: string
          permissions: Json | null
          role_id: number
          role_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entitas?: string | null
          entity?: string | null
          id?: string
          permissions?: Json | null
          role_id: number
          role_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entitas?: string | null
          entity?: string | null
          id?: string
          permissions?: Json | null
          role_id?: number
          role_name?: string
        }
        Relationships: []
      }
      sales_invoices: {
        Row: {
          customer_name: string | null
          id: string
          invoice_date: string | null
          invoice_no: string | null
          outstanding_amount: number | null
          paid_amount: number | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          customer_name?: string | null
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          customer_name?: string | null
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          outstanding_amount?: number | null
          paid_amount?: number | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      sales_transactions: {
        Row: {
          account_code: string | null
          account_name: string | null
          approval_status: string | null
          brand: string | null
          bukti: string | null
          coa_account_code: string | null
          coa_account_name: string | null
          coa_cash_code: string | null
          coa_cogs_code: string | null
          coa_inventory_code: string | null
          coa_revenue_code: string | null
          coa_tax_code: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          description: string | null
          id: string
          item_id: string | null
          item_name: string
          journal_ref: string | null
          notes: string | null
          ocr_data: Json | null
          ocr_id: string | null
          payment_method: string | null
          pph_amount: number | null
          pph_percentage: number | null
          ppn_amount: number | null
          ppn_percentage: number | null
          quantity: number
          stock_after: number | null
          stock_before: number | null
          subtotal: number
          tax_amount: number | null
          tax_percentage: number | null
          tax_type: string | null
          total_amount: number
          transaction_date: string
          transaction_id: string | null
          transaction_type: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          approval_status?: string | null
          brand?: string | null
          bukti?: string | null
          coa_account_code?: string | null
          coa_account_name?: string | null
          coa_cash_code?: string | null
          coa_cogs_code?: string | null
          coa_inventory_code?: string | null
          coa_revenue_code?: string | null
          coa_tax_code?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          item_name: string
          journal_ref?: string | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payment_method?: string | null
          pph_amount?: number | null
          pph_percentage?: number | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity: number
          stock_after?: number | null
          stock_before?: number | null
          subtotal: number
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_amount: number
          transaction_date?: string
          transaction_id?: string | null
          transaction_type: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          approval_status?: string | null
          brand?: string | null
          bukti?: string | null
          coa_account_code?: string | null
          coa_account_name?: string | null
          coa_cash_code?: string | null
          coa_cogs_code?: string | null
          coa_inventory_code?: string | null
          coa_revenue_code?: string | null
          coa_tax_code?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          item_name?: string
          journal_ref?: string | null
          notes?: string | null
          ocr_data?: Json | null
          ocr_id?: string | null
          payment_method?: string | null
          pph_amount?: number | null
          pph_percentage?: number | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number
          stock_after?: number | null
          stock_before?: number | null
          subtotal?: number
          tax_amount?: number | null
          tax_percentage?: number | null
          tax_type?: string | null
          total_amount?: number
          transaction_date?: string
          transaction_id?: string | null
          transaction_type?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_items: {
        Row: {
          coa_cogs_id: string | null
          coa_expense_id: string | null
          coa_sales_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          price: number | null
          service_category: string
          service_name: string
          service_type: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          coa_cogs_id?: string | null
          coa_expense_id?: string | null
          coa_sales_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          service_category: string
          service_name: string
          service_type?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          coa_cogs_id?: string | null
          coa_expense_id?: string | null
          coa_sales_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number | null
          service_category?: string
          service_name?: string
          service_type?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_items_coa_cogs_id_fkey"
            columns: ["coa_cogs_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_coa_expense_id_fkey"
            columns: ["coa_expense_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_items_coa_sales_id_fkey"
            columns: ["coa_sales_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
        ]
      }
      service_purchase: {
        Row: {
          approval_status: string | null
          coa_cash_code: string | null
          coa_expense_code: string | null
          coa_payable_code: string | null
          created_at: string | null
          description: string | null
          id: string
          item_name: string
          journal_ref: string | null
          notes: string | null
          payment_method: string | null
          payment_type: string | null
          ppn_amount: number | null
          ppn_percentage: number | null
          quantity: number | null
          service_category: string | null
          service_type: string | null
          subtotal: number
          supplier_name: string | null
          total_amount: number
          transaction_date: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          coa_cash_code?: string | null
          coa_expense_code?: string | null
          coa_payable_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_name: string
          journal_ref?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_type?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          service_category?: string | null
          service_type?: string | null
          subtotal: number
          supplier_name?: string | null
          total_amount: number
          transaction_date: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          coa_cash_code?: string | null
          coa_expense_code?: string | null
          coa_payable_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string
          journal_ref?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_type?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          service_category?: string | null
          service_type?: string | null
          subtotal?: number
          supplier_name?: string | null
          total_amount?: number
          transaction_date?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shippers: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_name: string | null
          category: string | null
          city: string | null
          contact_person: string
          country: string | null
          created_at: string | null
          currency: string
          email: string
          id: string
          is_pkp: string | null
          payment_terms: string | null
          phone_number: string
          shipper_code: string
          shipper_name: string
          status: string
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_name?: string | null
          category?: string | null
          city?: string | null
          contact_person: string
          country?: string | null
          created_at?: string | null
          currency?: string
          email: string
          id?: string
          is_pkp?: string | null
          payment_terms?: string | null
          phone_number: string
          shipper_code: string
          shipper_name: string
          status?: string
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_name?: string | null
          category?: string | null
          city?: string | null
          contact_person?: string
          country?: string | null
          created_at?: string | null
          currency?: string
          email?: string
          id?: string
          is_pkp?: string | null
          payment_terms?: string | null
          phone_number?: string
          shipper_code?: string
          shipper_name?: string
          status?: string
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shippers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sim_results: {
        Row: {
          alamat: string | null
          berlaku_hingga: string | null
          created_at: string | null
          golongan_darah: string | null
          id: string
          jenis_kelamin: string | null
          jenis_sim: string | null
          nama: string | null
          nomor_sim: string | null
          pekerjaan: string | null
          processed_at: string | null
          raw_text: string | null
          tanggal_lahir: string | null
          tanggal_terbit: string | null
          tempat_lahir: string | null
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          golongan_darah?: string | null
          id?: string
          jenis_kelamin?: string | null
          jenis_sim?: string | null
          nama?: string | null
          nomor_sim?: string | null
          pekerjaan?: string | null
          processed_at?: string | null
          raw_text?: string | null
          tanggal_lahir?: string | null
          tanggal_terbit?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          golongan_darah?: string | null
          id?: string
          jenis_kelamin?: string | null
          jenis_sim?: string | null
          nama?: string | null
          nomor_sim?: string | null
          pekerjaan?: string | null
          processed_at?: string | null
          raw_text?: string | null
          tanggal_lahir?: string | null
          tanggal_terbit?: string | null
          tempat_lahir?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sql_audit_logs: {
        Row: {
          created_at: string | null
          error: string | null
          executed_at: string
          id: string
          query: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          executed_at?: string
          id?: string
          query: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          executed_at?: string
          id?: string
          query?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      stnk_results: {
        Row: {
          alamat_pemilik: string | null
          bahan_bakar: string | null
          berlaku_hingga: string | null
          created_at: string | null
          id: string
          jenis: string | null
          merk: string | null
          model: string | null
          nama_pemilik: string | null
          nomor_mesin: string | null
          nomor_polisi: string | null
          nomor_rangka: string | null
          nomor_registrasi: string | null
          processed_at: string | null
          raw_text: string | null
          tahun_pembuatan: string | null
          tipe: string | null
          user_id: string | null
          warna: string | null
        }
        Insert: {
          alamat_pemilik?: string | null
          bahan_bakar?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          id?: string
          jenis?: string | null
          merk?: string | null
          model?: string | null
          nama_pemilik?: string | null
          nomor_mesin?: string | null
          nomor_polisi?: string | null
          nomor_rangka?: string | null
          nomor_registrasi?: string | null
          processed_at?: string | null
          raw_text?: string | null
          tahun_pembuatan?: string | null
          tipe?: string | null
          user_id?: string | null
          warna?: string | null
        }
        Update: {
          alamat_pemilik?: string | null
          bahan_bakar?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          id?: string
          jenis?: string | null
          merk?: string | null
          model?: string | null
          nama_pemilik?: string | null
          nomor_mesin?: string | null
          nomor_polisi?: string | null
          nomor_rangka?: string | null
          nomor_registrasi?: string | null
          processed_at?: string | null
          raw_text?: string | null
          tahun_pembuatan?: string | null
          tipe?: string | null
          user_id?: string | null
          warna?: string | null
        }
        Relationships: []
      }
      stock: {
        Row: {
          ai_category: string | null
          average_cost: number | null
          barcode: string | null
          brand: string | null
          coa_account_code: string | null
          coa_account_expense: string | null
          coa_account_hpp: string | null
          coa_account_inventory: string | null
          coa_account_name: string | null
          coa_inventory_code: string | null
          cogs_account_code: string | null
          cogs_account_id: string | null
          cost_per_unit: number | null
          created_at: string | null
          description: string | null
          expense_account_id: string | null
          harga_beli_setelah_pajak: number | null
          harga_jual: number | null
          harga_jual_setelah_pajak: number | null
          hawb: string | null
          id: string
          inventory_account_code: string | null
          inventory_account_id: string | null
          is_pajak: boolean | null
          item_arrival_date: string | null
          item_name: string
          item_quantity: number | null
          jenis_barang: string | null
          kode_barang: string | null
          lot_id: string | null
          mawb: string | null
          nominal_barang: number | null
          nomor_plp: string | null
          part_number: string | null
          ppn_type: string | null
          product_name: string | null
          purchase_price: number | null
          quantity: number | null
          rack_id: string | null
          racks: string | null
          sales_account_code: string | null
          sales_account_id: string | null
          selling_price: number | null
          selling_price_after_ppn: number | null
          service_category: string | null
          service_type: string | null
          sku: string | null
          stock_qty: number | null
          supplier_address: string | null
          supplier_email: string | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_phone: string | null
          tanggal_masuk_barang: string | null
          tipe_barang: string | null
          total_value: number | null
          typical_weight: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          warehouse_id: string | null
          warehouses: string | null
          zone_id: string | null
          zones: string | null
        }
        Insert: {
          ai_category?: string | null
          average_cost?: number | null
          barcode?: string | null
          brand?: string | null
          coa_account_code?: string | null
          coa_account_expense?: string | null
          coa_account_hpp?: string | null
          coa_account_inventory?: string | null
          coa_account_name?: string | null
          coa_inventory_code?: string | null
          cogs_account_code?: string | null
          cogs_account_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          description?: string | null
          expense_account_id?: string | null
          harga_beli_setelah_pajak?: number | null
          harga_jual?: number | null
          harga_jual_setelah_pajak?: number | null
          hawb?: string | null
          id?: string
          inventory_account_code?: string | null
          inventory_account_id?: string | null
          is_pajak?: boolean | null
          item_arrival_date?: string | null
          item_name: string
          item_quantity?: number | null
          jenis_barang?: string | null
          kode_barang?: string | null
          lot_id?: string | null
          mawb?: string | null
          nominal_barang?: number | null
          nomor_plp?: string | null
          part_number?: string | null
          ppn_type?: string | null
          product_name?: string | null
          purchase_price?: number | null
          quantity?: number | null
          rack_id?: string | null
          racks?: string | null
          sales_account_code?: string | null
          sales_account_id?: string | null
          selling_price?: number | null
          selling_price_after_ppn?: number | null
          service_category?: string | null
          service_type?: string | null
          sku?: string | null
          stock_qty?: number | null
          supplier_address?: string | null
          supplier_email?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tanggal_masuk_barang?: string | null
          tipe_barang?: string | null
          total_value?: number | null
          typical_weight?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
          warehouses?: string | null
          zone_id?: string | null
          zones?: string | null
        }
        Update: {
          ai_category?: string | null
          average_cost?: number | null
          barcode?: string | null
          brand?: string | null
          coa_account_code?: string | null
          coa_account_expense?: string | null
          coa_account_hpp?: string | null
          coa_account_inventory?: string | null
          coa_account_name?: string | null
          coa_inventory_code?: string | null
          cogs_account_code?: string | null
          cogs_account_id?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          description?: string | null
          expense_account_id?: string | null
          harga_beli_setelah_pajak?: number | null
          harga_jual?: number | null
          harga_jual_setelah_pajak?: number | null
          hawb?: string | null
          id?: string
          inventory_account_code?: string | null
          inventory_account_id?: string | null
          is_pajak?: boolean | null
          item_arrival_date?: string | null
          item_name?: string
          item_quantity?: number | null
          jenis_barang?: string | null
          kode_barang?: string | null
          lot_id?: string | null
          mawb?: string | null
          nominal_barang?: number | null
          nomor_plp?: string | null
          part_number?: string | null
          ppn_type?: string | null
          product_name?: string | null
          purchase_price?: number | null
          quantity?: number | null
          rack_id?: string | null
          racks?: string | null
          sales_account_code?: string | null
          sales_account_id?: string | null
          selling_price?: number | null
          selling_price_after_ppn?: number | null
          service_category?: string | null
          service_type?: string | null
          sku?: string | null
          stock_qty?: number | null
          supplier_address?: string | null
          supplier_email?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tanggal_masuk_barang?: string | null
          tipe_barang?: string | null
          total_value?: number | null
          typical_weight?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          warehouse_id?: string | null
          warehouses?: string | null
          zone_id?: string | null
          zones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_cogs_account_id_fkey"
            columns: ["cogs_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_inventory_account_id_fkey"
            columns: ["inventory_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_rack_id_fkey"
            columns: ["rack_id"]
            isOneToOne: false
            referencedRelation: "racks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_sales_account_id_fkey"
            columns: ["sales_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjustment_value: number | null
          after_quantity: number | null
          approval_date: string | null
          approved_by: string | null
          before_quantity: number | null
          created_at: string | null
          created_by: string | null
          id: string
          item_name: string
          lot: string | null
          notes: string | null
          quantity: number
          quantity_change: number | null
          rack: string | null
          reason: string
          reference_number: string
          selling_price_after_ppn: number | null
          sku: string
          status: string | null
          stock_id: string | null
          stock_id_uuid: string | null
          supplier_id: string | null
          supplier_name: string | null
          transaction_date: string
          transaction_type: string
          unit: string
          updated_at: string | null
          warehouse: string | null
          zone: string | null
        }
        Insert: {
          adjustment_value?: number | null
          after_quantity?: number | null
          approval_date?: string | null
          approved_by?: string | null
          before_quantity?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_name: string
          lot?: string | null
          notes?: string | null
          quantity: number
          quantity_change?: number | null
          rack?: string | null
          reason: string
          reference_number: string
          selling_price_after_ppn?: number | null
          sku: string
          status?: string | null
          stock_id?: string | null
          stock_id_uuid?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          transaction_date?: string
          transaction_type: string
          unit: string
          updated_at?: string | null
          warehouse?: string | null
          zone?: string | null
        }
        Update: {
          adjustment_value?: number | null
          after_quantity?: number | null
          approval_date?: string | null
          approved_by?: string | null
          before_quantity?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_name?: string
          lot?: string | null
          notes?: string | null
          quantity?: number
          quantity_change?: number | null
          rack?: string | null
          reason?: string
          reference_number?: string
          selling_price_after_ppn?: number | null
          sku?: string
          status?: string | null
          stock_id?: string | null
          stock_id_uuid?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          transaction_date?: string
          transaction_type?: string
          unit?: string
          updated_at?: string | null
          warehouse?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_adjustment_supplier"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_adjustment_suppliers"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_balances: {
        Row: {
          account_id: string | null
          id: string
          item_id: string
          period: string | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          id?: string
          item_id: string
          period?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          id?: string
          item_id?: string
          period?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_balances_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_barang_import: {
        Row: {
          berat: number | null
          consignee: string | null
          deskripsi_barang: string | null
          hawb: string | null
          hs_code: string | null
          id: string
          jenis_barang: string | null
          jumlah: number | null
          lots: string | null
          mawb: string | null
          plp: string | null
          racks: string | null
          tanggal_barang_masuk: string | null
          unit: string | null
          volume: number | null
          warehouses: string | null
          zones: string | null
        }
        Insert: {
          berat?: number | null
          consignee?: string | null
          deskripsi_barang?: string | null
          hawb?: string | null
          hs_code?: string | null
          id?: string
          jenis_barang?: string | null
          jumlah?: number | null
          lots?: string | null
          mawb?: string | null
          plp?: string | null
          racks?: string | null
          tanggal_barang_masuk?: string | null
          unit?: string | null
          volume?: number | null
          warehouses?: string | null
          zones?: string | null
        }
        Update: {
          berat?: number | null
          consignee?: string | null
          deskripsi_barang?: string | null
          hawb?: string | null
          hs_code?: string | null
          id?: string
          jenis_barang?: string | null
          jumlah?: number | null
          lots?: string | null
          mawb?: string | null
          plp?: string | null
          racks?: string | null
          tanggal_barang_masuk?: string | null
          unit?: string | null
          volume?: number | null
          warehouses?: string | null
          zones?: string | null
        }
        Relationships: []
      }
      stock_coa_backfill_audit: {
        Row: {
          backup_at: string | null
          coa_account_code: string | null
          coa_account_name: string | null
          id: string | null
        }
        Insert: {
          backup_at?: string | null
          coa_account_code?: string | null
          coa_account_name?: string | null
          id?: string | null
        }
        Update: {
          backup_at?: string | null
          coa_account_code?: string | null
          coa_account_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          unit_of_measure: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit_of_measure?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit_of_measure?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stock_movement: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          from_line: string | null
          from_location_id: string | null
          id: string
          item_id: string
          movement_at: string
          movement_date: string | null
          movement_type: string
          qty: number
          reference_no: string | null
          remarks: string | null
          to_line: string | null
          to_location_id: string | null
          total_value: number | null
          unit_cost: number | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          from_line?: string | null
          from_location_id?: string | null
          id?: string
          item_id: string
          movement_at?: string
          movement_date?: string | null
          movement_type: string
          qty: number
          reference_no?: string | null
          remarks?: string | null
          to_line?: string | null
          to_location_id?: string | null
          total_value?: number | null
          unit_cost?: number | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          from_line?: string | null
          from_location_id?: string | null
          id?: string
          item_id?: string
          movement_at?: string
          movement_date?: string | null
          movement_type?: string
          qty?: number
          reference_no?: string | null
          remarks?: string | null
          to_line?: string | null
          to_location_id?: string | null
          total_value?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movement_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          average_cost: number | null
          created_at: string | null
          destination: string | null
          hpp_amount: number | null
          id: string
          item_name: string | null
          movement_type: string | null
          qty: number | null
          qty_in: number | null
          qty_out: number | null
          sku: string | null
          source: string | null
          total_cost: number | null
        }
        Insert: {
          average_cost?: number | null
          created_at?: string | null
          destination?: string | null
          hpp_amount?: number | null
          id?: string
          item_name?: string | null
          movement_type?: string | null
          qty?: number | null
          qty_in?: number | null
          qty_out?: number | null
          sku?: string | null
          source?: string | null
          total_cost?: number | null
        }
        Update: {
          average_cost?: number | null
          created_at?: string | null
          destination?: string | null
          hpp_amount?: number | null
          id?: string
          item_name?: string | null
          movement_type?: string | null
          qty?: number | null
          qty_in?: number | null
          qty_out?: number | null
          sku?: string | null
          source?: string | null
          total_cost?: number | null
        }
        Relationships: []
      }
      stock_reconciliation: {
        Row: {
          accounting_qty: number | null
          created_at: string | null
          difference: number | null
          id: string
          period: string | null
          sku: string | null
          valuation_difference: number | null
          wms_qty: number | null
        }
        Insert: {
          accounting_qty?: number | null
          created_at?: string | null
          difference?: number | null
          id?: string
          period?: string | null
          sku?: string | null
          valuation_difference?: number | null
          wms_qty?: number | null
        }
        Update: {
          accounting_qty?: number | null
          created_at?: string | null
          difference?: number | null
          id?: string
          period?: string | null
          sku?: string | null
          valuation_difference?: number | null
          wms_qty?: number | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          category: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          email: string | null
          id: string
          is_active: boolean
          is_pkp: string | null
          name: string | null
          npwp: number | null
          payment_terms: string | null
          phone_number: string | null
          status: string | null
          supplier_code: string
          supplier_name: string
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          category?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_pkp?: string | null
          name?: string | null
          npwp?: number | null
          payment_terms?: string | null
          phone_number?: string | null
          status?: string | null
          supplier_code?: string
          supplier_name: string
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          category?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_pkp?: string | null
          name?: string | null
          npwp?: number | null
          payment_terms?: string | null
          phone_number?: string | null
          status?: string | null
          supplier_code?: string
          supplier_name?: string
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_audit: {
        Row: {
          action: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_value: Json | null
          object_id: string | null
          object_type: string | null
          old_value: Json | null
        }
        Insert: {
          action?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          object_id?: string | null
          object_type?: string | null
          old_value?: Json | null
        }
        Update: {
          action?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          object_id?: string | null
          object_type?: string | null
          old_value?: Json | null
        }
        Relationships: []
      }
      tax_config: {
        Row: {
          coa_payable_code: string | null
          coa_receivable_code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          rate: number
          tax_code: string
          tax_name: string
          tax_type: string
        }
        Insert: {
          coa_payable_code?: string | null
          coa_receivable_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rate: number
          tax_code: string
          tax_name: string
          tax_type: string
        }
        Update: {
          coa_payable_code?: string | null
          coa_receivable_code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rate?: number
          tax_code?: string
          tax_name?: string
          tax_type?: string
        }
        Relationships: []
      }
      tax_reminders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          notes: string | null
          period_month: number | null
          period_year: number
          reminder_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          period_month?: number | null
          period_year: number
          reminder_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          period_month?: number | null
          period_year?: number
          reminder_type?: string
        }
        Relationships: []
      }
      tax_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          period_month: number
          period_year: number
          report_type: string
          status: string | null
          total_dpp: number | null
          total_pph: number | null
          total_ppn: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_month: number
          period_year: number
          report_type: string
          status?: string | null
          total_dpp?: number | null
          total_pph?: number | null
          total_ppn?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          period_month?: number
          period_year?: number
          report_type?: string
          status?: string | null
          total_dpp?: number | null
          total_pph?: number | null
          total_ppn?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          akun_dasar: string | null
          akun_pajak: string | null
          created_at: string | null
          id: string
          keyword: string | null
          pajak: string | null
          priority: number | null
          tarif: number | null
        }
        Insert: {
          akun_dasar?: string | null
          akun_pajak?: string | null
          created_at?: string | null
          id?: string
          keyword?: string | null
          pajak?: string | null
          priority?: number | null
          tarif?: number | null
        }
        Update: {
          akun_dasar?: string | null
          akun_pajak?: string | null
          created_at?: string | null
          id?: string
          keyword?: string | null
          pajak?: string | null
          priority?: number | null
          tarif?: number | null
        }
        Relationships: []
      }
      tax_settings: {
        Row: {
          created_at: string | null
          description: string | null
          effective_date: string
          id: string
          is_active: boolean | null
          rate: number
          tax_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          effective_date: string
          id?: string
          is_active?: boolean | null
          rate: number
          tax_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          effective_date?: string
          id?: string
          is_active?: boolean | null
          rate?: number
          tax_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_transactions: {
        Row: {
          amount: number | null
          coa_tax_code: string | null
          coa_tax_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          item_name: string | null
          quantity: number | null
          related_doc_no: string | null
          related_transaction_id: string | null
          sales_transaction_id: string | null
          sales_transactions_id: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_percentage: string | null
          tax_type: string | null
          total_amount: number | null
          transaction_date: string
          transaction_type: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          coa_tax_code?: string | null
          coa_tax_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          item_name?: string | null
          quantity?: number | null
          related_doc_no?: string | null
          related_transaction_id?: string | null
          sales_transaction_id?: string | null
          sales_transactions_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: string | null
          tax_type?: string | null
          total_amount?: number | null
          transaction_date?: string
          transaction_type?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          coa_tax_code?: string | null
          coa_tax_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          item_name?: string | null
          quantity?: number | null
          related_doc_no?: string | null
          related_transaction_id?: string | null
          sales_transaction_id?: string | null
          sales_transactions_id?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_percentage?: string | null
          tax_type?: string | null
          total_amount?: number | null
          transaction_date?: string
          transaction_type?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_transactions_sales_fk"
            columns: ["sales_transactions_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_cart: {
        Row: {
          account_code: string | null
          account_name: string | null
          account_type: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          borrower_name: string | null
          brand: string | null
          bukti: string | null
          coa_selected: string | null
          consignee: string | null
          created_at: string | null
          credit_account_code: string | null
          credit_account_name: string | null
          credit_account_type: string | null
          customer: string | null
          description: string | null
          employee_id: string | null
          employee_name: string | null
          expense_account: string | null
          harga_beli: number | null
          harga_jual: number | null
          id: string
          interest_rate: number | null
          item_name: string | null
          jenis_layanan: string | null
          jenis_transaksi: string
          kas_sumber: string | null
          kas_tujuan: string | null
          kategori: string | null
          kategori_pengeluaran: string | null
          loan_term_months: number | null
          loan_type: string | null
          nominal: number
          payment_type: string | null
          ppn_amount: number | null
          ppn_percentage: number | null
          quantity: number | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          revenue_account: string | null
          selected_bank: string | null
          selected_kas: string | null
          session_id: string | null
          status: string | null
          stock_info: Json | null
          sumber_penerimaan: string | null
          supplier: string | null
          tanggal: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          borrower_name?: string | null
          brand?: string | null
          bukti?: string | null
          coa_selected?: string | null
          consignee?: string | null
          created_at?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          credit_account_type?: string | null
          customer?: string | null
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          expense_account?: string | null
          harga_beli?: number | null
          harga_jual?: number | null
          id?: string
          interest_rate?: number | null
          item_name?: string | null
          jenis_layanan?: string | null
          jenis_transaksi: string
          kas_sumber?: string | null
          kas_tujuan?: string | null
          kategori?: string | null
          kategori_pengeluaran?: string | null
          loan_term_months?: number | null
          loan_type?: string | null
          nominal: number
          payment_type?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revenue_account?: string | null
          selected_bank?: string | null
          selected_kas?: string | null
          session_id?: string | null
          status?: string | null
          stock_info?: Json | null
          sumber_penerimaan?: string | null
          supplier?: string | null
          tanggal: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          account_type?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          borrower_name?: string | null
          brand?: string | null
          bukti?: string | null
          coa_selected?: string | null
          consignee?: string | null
          created_at?: string | null
          credit_account_code?: string | null
          credit_account_name?: string | null
          credit_account_type?: string | null
          customer?: string | null
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          expense_account?: string | null
          harga_beli?: number | null
          harga_jual?: number | null
          id?: string
          interest_rate?: number | null
          item_name?: string | null
          jenis_layanan?: string | null
          jenis_transaksi?: string
          kas_sumber?: string | null
          kas_tujuan?: string | null
          kategori?: string | null
          kategori_pengeluaran?: string | null
          loan_term_months?: number | null
          loan_type?: string | null
          nominal?: number
          payment_type?: string | null
          ppn_amount?: number | null
          ppn_percentage?: number | null
          quantity?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          revenue_account?: string | null
          selected_bank?: string | null
          selected_kas?: string | null
          session_id?: string | null
          status?: string | null
          stock_info?: Json | null
          sumber_penerimaan?: string | null
          supplier?: string | null
          tanggal?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          average_cost: number | null
          coa_expense_code: string | null
          coa_inventory_code: string | null
          coa_revenue_code: string | null
          cogs_account_code: string | null
          created_at: string | null
          discount: number | null
          hpp_amount: number | null
          id: string
          item_id: string | null
          item_name: string
          item_type: string | null
          pph_amount: number | null
          ppn_amount: number | null
          quantity: number
          sku: string | null
          subtotal: number
          transaction_id: string | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          average_cost?: number | null
          coa_expense_code?: string | null
          coa_inventory_code?: string | null
          coa_revenue_code?: string | null
          cogs_account_code?: string | null
          created_at?: string | null
          discount?: number | null
          hpp_amount?: number | null
          id?: string
          item_id?: string | null
          item_name: string
          item_type?: string | null
          pph_amount?: number | null
          ppn_amount?: number | null
          quantity?: number
          sku?: string | null
          subtotal?: number
          transaction_id?: string | null
          unit?: string | null
          unit_price?: number
        }
        Update: {
          average_cost?: number | null
          coa_expense_code?: string | null
          coa_inventory_code?: string | null
          coa_revenue_code?: string | null
          cogs_account_code?: string | null
          created_at?: string | null
          discount?: number | null
          hpp_amount?: number | null
          id?: string
          item_id?: string | null
          item_name?: string
          item_type?: string | null
          pph_amount?: number | null
          ppn_amount?: number | null
          quantity?: number
          sku?: string | null
          subtotal?: number
          transaction_id?: string | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: []
      }
      transaction_keywords: {
        Row: {
          category: string
          coa_credit_code: string | null
          coa_debit_code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          keyword: string
          transaction_type: string
        }
        Insert: {
          category: string
          coa_credit_code?: string | null
          coa_debit_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          transaction_type: string
        }
        Update: {
          category?: string
          coa_credit_code?: string | null
          coa_debit_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          transaction_type?: string
        }
        Relationships: []
      }
      transaction_lines: {
        Row: {
          account_id: string | null
          ai_confidence: number | null
          ai_suggested: boolean | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          line_number: number
          quantity: number | null
          service_id: string | null
          stock_item_id: string | null
          transaction_id: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          ai_confidence?: number | null
          ai_suggested?: boolean | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          line_number: number
          quantity?: number | null
          service_id?: string | null
          stock_item_id?: string | null
          transaction_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          ai_confidence?: number | null
          ai_suggested?: boolean | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          line_number?: number
          quantity?: number | null
          service_id?: string | null
          stock_item_id?: string | null
          transaction_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_lines_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_lines_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transaction_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          ai_confidence_score: number | null
          amount: number | null
          bank_name: string | null
          cash_bank_account: string | null
          created_at: string | null
          created_by: string | null
          credit_account_id: string | null
          customer_id: string | null
          customer_name: string | null
          debit_account_id: string | null
          description: string | null
          employee_id: string | null
          employee_name: string | null
          id: string
          is_balanced: boolean | null
          journal_group_id: string | null
          keyword_id: string | null
          keyword_text: string | null
          ocr_text: string | null
          payment_method: string | null
          pph_amount: number | null
          pph_type: string | null
          ppn_amount: number | null
          processing_time_ms: number | null
          status: string | null
          total_amount: number
          transaction_date: string
          transaction_number: string | null
          transaction_type: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          amount?: number | null
          bank_name?: string | null
          cash_bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          debit_account_id?: string | null
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          is_balanced?: boolean | null
          journal_group_id?: string | null
          keyword_id?: string | null
          keyword_text?: string | null
          ocr_text?: string | null
          payment_method?: string | null
          pph_amount?: number | null
          pph_type?: string | null
          ppn_amount?: number | null
          processing_time_ms?: number | null
          status?: string | null
          total_amount: number
          transaction_date: string
          transaction_number?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          amount?: number | null
          bank_name?: string | null
          cash_bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_account_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          debit_account_id?: string | null
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          id?: string
          is_balanced?: boolean | null
          journal_group_id?: string | null
          keyword_id?: string | null
          keyword_text?: string | null
          ocr_text?: string | null
          payment_method?: string | null
          pph_amount?: number | null
          pph_type?: string | null
          ppn_amount?: number | null
          processing_time_ms?: number | null
          status?: string | null
          total_amount?: number
          transaction_date?: string
          transaction_number?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_credit_coa"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_debit_coa"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_balance: {
        Row: {
          created_at: string
          credit_account: string | null
          debit_account: string | null
          id: string
          period_end: string
          period_start: string
          total_credit: number
          total_debit: number
        }
        Insert: {
          created_at?: string
          credit_account?: string | null
          debit_account?: string | null
          id?: string
          period_end: string
          period_start: string
          total_credit?: number
          total_debit?: number
        }
        Update: {
          created_at?: string
          credit_account?: string | null
          debit_account?: string | null
          id?: string
          period_end?: string
          period_start?: string
          total_credit?: number
          total_debit?: number
        }
        Relationships: []
      }
      user_memberships: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          membership_id: string | null
          payment_status: string | null
          remaining_visits: number | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          membership_id?: string | null
          payment_status?: string | null
          remaining_visits?: number | null
          start_date: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          membership_id?: string | null
          payment_status?: string | null
          remaining_visits?: number | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          agama: string | null
          akreditasi: string | null
          alamat: string | null
          alamat_pembeli: string | null
          alamat_penjual: string | null
          anggota_keluarga: Json | null
          avatar_url: string | null
          awb_number: string | null
          bahan_bakar: string | null
          bahasa: Json | null
          bank_account_holder: string | null
          berlaku_hingga: string | null
          birth_place: string | null
          city: string | null
          consignee_address: string | null
          consignee_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          debug_notes: Json | null
          declared_value: number | null
          denda_pkb: number | null
          denda_swdkllj: number | null
          department: string | null
          description: string | null
          destination: string | null
          details: Json | null
          education: string | null
          email: string
          entity: string | null
          entity_type: string | null
          ethnicity: string | null
          fakultas: string | null
          family_card_url: string | null
          faskes_tingkat_1: string | null
          field_meta: Json | null
          first_name: string | null
          flight_date: string | null
          flight_number: string | null
          full_name: string | null
          gelar: string | null
          gender: string | null
          golongan_darah: string | null
          golongan_sim: string | null
          id: string
          instansi: string | null
          ipk: string | null
          is_active: boolean | null
          isi_silinder: string | null
          items: Json | null
          jenis_kelamin: string | null
          jenjang: string | null
          jurusan: string | null
          kabupaten_kota: string | null
          keahlian: Json | null
          kecamatan: string | null
          kelas: string | null
          kelurahan_desa: string | null
          kepala_sekolah: string | null
          kewarganegaraan: string | null
          kode_pos: string | null
          kpp: string | null
          ktp_address: string | null
          ktp_document_url: string | null
          ktp_number: number | null
          last_login: string | null
          last_name: string | null
          license_expiry_date: string | null
          license_number: string | null
          masa_berlaku: string | null
          merk: string | null
          model: string | null
          nama: string | null
          nama_ayah: string | null
          nama_ibu: string | null
          nama_kepala_keluarga: string | null
          nama_pembeli: string | null
          nama_pemilik: string | null
          nama_penjual: string | null
          nama_sekolah: string | null
          nik: string | null
          nisn: string | null
          nomor_akta: string | null
          nomor_bpjs: string | null
          nomor_ijazah: string | null
          nomor_invoice: string | null
          nomor_kk: string | null
          nomor_mesin: string | null
          nomor_npwp: string | null
          nomor_peserta_ujian: string | null
          nomor_polisi: string | null
          nomor_rangka: string | null
          nomor_seri_ijazah: string | null
          nomor_sim: string | null
          nomor_surat: string | null
          npwp_pembeli: string | null
          npwp_penjual: string | null
          origin: string | null
          pekerjaan: string | null
          pendidikan: Json | null
          pengalaman_kerja: Json | null
          perihal: string | null
          phone: string | null
          pieces: number | null
          pkb_pokok: number | null
          pkp_status: string | null
          ppn: number | null
          program_studi: string | null
          provinsi: string | null
          religion: string | null
          role: string
          role_id: number | null
          role_name: string | null
          rt_rw: string | null
          selfie_url: string | null
          sertifikasi: Json | null
          shipper_address: string | null
          shipper_name: string | null
          sim_url: string | null
          skck_url: string | null
          status: Database["public"]["Enums"]["user_status"]
          status_perkawinan: string | null
          status_wp: string | null
          subtotal: number | null
          supplier_name: string | null
          swdkllj: number | null
          tahun_lulus: string | null
          tahun_pembuatan: string | null
          tanggal_bayar: string | null
          tanggal_berlaku: string | null
          tanggal_dikeluarkan: string | null
          tanggal_invoice: string | null
          tanggal_jatuh_tempo: string | null
          tanggal_lahir: string | null
          tanggal_lulus: string | null
          tanggal_terbit: string | null
          tanggal_terdaftar: string | null
          tempat_lahir: string | null
          tempat_terbit: string | null
          tinggi_badan: string | null
          tipe: string | null
          total: number | null
          total_bayar: number | null
          updated_at: string | null
          upload_ijasah: string | null
          warna: string | null
          weight: number | null
        }
        Insert: {
          address?: string | null
          agama?: string | null
          akreditasi?: string | null
          alamat?: string | null
          alamat_pembeli?: string | null
          alamat_penjual?: string | null
          anggota_keluarga?: Json | null
          avatar_url?: string | null
          awb_number?: string | null
          bahan_bakar?: string | null
          bahasa?: Json | null
          bank_account_holder?: string | null
          berlaku_hingga?: string | null
          birth_place?: string | null
          city?: string | null
          consignee_address?: string | null
          consignee_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          debug_notes?: Json | null
          declared_value?: number | null
          denda_pkb?: number | null
          denda_swdkllj?: number | null
          department?: string | null
          description?: string | null
          destination?: string | null
          details?: Json | null
          education?: string | null
          email: string
          entity?: string | null
          entity_type?: string | null
          ethnicity?: string | null
          fakultas?: string | null
          family_card_url?: string | null
          faskes_tingkat_1?: string | null
          field_meta?: Json | null
          first_name?: string | null
          flight_date?: string | null
          flight_number?: string | null
          full_name?: string | null
          gelar?: string | null
          gender?: string | null
          golongan_darah?: string | null
          golongan_sim?: string | null
          id: string
          instansi?: string | null
          ipk?: string | null
          is_active?: boolean | null
          isi_silinder?: string | null
          items?: Json | null
          jenis_kelamin?: string | null
          jenjang?: string | null
          jurusan?: string | null
          kabupaten_kota?: string | null
          keahlian?: Json | null
          kecamatan?: string | null
          kelas?: string | null
          kelurahan_desa?: string | null
          kepala_sekolah?: string | null
          kewarganegaraan?: string | null
          kode_pos?: string | null
          kpp?: string | null
          ktp_address?: string | null
          ktp_document_url?: string | null
          ktp_number?: number | null
          last_login?: string | null
          last_name?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          masa_berlaku?: string | null
          merk?: string | null
          model?: string | null
          nama?: string | null
          nama_ayah?: string | null
          nama_ibu?: string | null
          nama_kepala_keluarga?: string | null
          nama_pembeli?: string | null
          nama_pemilik?: string | null
          nama_penjual?: string | null
          nama_sekolah?: string | null
          nik?: string | null
          nisn?: string | null
          nomor_akta?: string | null
          nomor_bpjs?: string | null
          nomor_ijazah?: string | null
          nomor_invoice?: string | null
          nomor_kk?: string | null
          nomor_mesin?: string | null
          nomor_npwp?: string | null
          nomor_peserta_ujian?: string | null
          nomor_polisi?: string | null
          nomor_rangka?: string | null
          nomor_seri_ijazah?: string | null
          nomor_sim?: string | null
          nomor_surat?: string | null
          npwp_pembeli?: string | null
          npwp_penjual?: string | null
          origin?: string | null
          pekerjaan?: string | null
          pendidikan?: Json | null
          pengalaman_kerja?: Json | null
          perihal?: string | null
          phone?: string | null
          pieces?: number | null
          pkb_pokok?: number | null
          pkp_status?: string | null
          ppn?: number | null
          program_studi?: string | null
          provinsi?: string | null
          religion?: string | null
          role?: string
          role_id?: number | null
          role_name?: string | null
          rt_rw?: string | null
          selfie_url?: string | null
          sertifikasi?: Json | null
          shipper_address?: string | null
          shipper_name?: string | null
          sim_url?: string | null
          skck_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          status_perkawinan?: string | null
          status_wp?: string | null
          subtotal?: number | null
          supplier_name?: string | null
          swdkllj?: number | null
          tahun_lulus?: string | null
          tahun_pembuatan?: string | null
          tanggal_bayar?: string | null
          tanggal_berlaku?: string | null
          tanggal_dikeluarkan?: string | null
          tanggal_invoice?: string | null
          tanggal_jatuh_tempo?: string | null
          tanggal_lahir?: string | null
          tanggal_lulus?: string | null
          tanggal_terbit?: string | null
          tanggal_terdaftar?: string | null
          tempat_lahir?: string | null
          tempat_terbit?: string | null
          tinggi_badan?: string | null
          tipe?: string | null
          total?: number | null
          total_bayar?: number | null
          updated_at?: string | null
          upload_ijasah?: string | null
          warna?: string | null
          weight?: number | null
        }
        Update: {
          address?: string | null
          agama?: string | null
          akreditasi?: string | null
          alamat?: string | null
          alamat_pembeli?: string | null
          alamat_penjual?: string | null
          anggota_keluarga?: Json | null
          avatar_url?: string | null
          awb_number?: string | null
          bahan_bakar?: string | null
          bahasa?: Json | null
          bank_account_holder?: string | null
          berlaku_hingga?: string | null
          birth_place?: string | null
          city?: string | null
          consignee_address?: string | null
          consignee_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          debug_notes?: Json | null
          declared_value?: number | null
          denda_pkb?: number | null
          denda_swdkllj?: number | null
          department?: string | null
          description?: string | null
          destination?: string | null
          details?: Json | null
          education?: string | null
          email?: string
          entity?: string | null
          entity_type?: string | null
          ethnicity?: string | null
          fakultas?: string | null
          family_card_url?: string | null
          faskes_tingkat_1?: string | null
          field_meta?: Json | null
          first_name?: string | null
          flight_date?: string | null
          flight_number?: string | null
          full_name?: string | null
          gelar?: string | null
          gender?: string | null
          golongan_darah?: string | null
          golongan_sim?: string | null
          id?: string
          instansi?: string | null
          ipk?: string | null
          is_active?: boolean | null
          isi_silinder?: string | null
          items?: Json | null
          jenis_kelamin?: string | null
          jenjang?: string | null
          jurusan?: string | null
          kabupaten_kota?: string | null
          keahlian?: Json | null
          kecamatan?: string | null
          kelas?: string | null
          kelurahan_desa?: string | null
          kepala_sekolah?: string | null
          kewarganegaraan?: string | null
          kode_pos?: string | null
          kpp?: string | null
          ktp_address?: string | null
          ktp_document_url?: string | null
          ktp_number?: number | null
          last_login?: string | null
          last_name?: string | null
          license_expiry_date?: string | null
          license_number?: string | null
          masa_berlaku?: string | null
          merk?: string | null
          model?: string | null
          nama?: string | null
          nama_ayah?: string | null
          nama_ibu?: string | null
          nama_kepala_keluarga?: string | null
          nama_pembeli?: string | null
          nama_pemilik?: string | null
          nama_penjual?: string | null
          nama_sekolah?: string | null
          nik?: string | null
          nisn?: string | null
          nomor_akta?: string | null
          nomor_bpjs?: string | null
          nomor_ijazah?: string | null
          nomor_invoice?: string | null
          nomor_kk?: string | null
          nomor_mesin?: string | null
          nomor_npwp?: string | null
          nomor_peserta_ujian?: string | null
          nomor_polisi?: string | null
          nomor_rangka?: string | null
          nomor_seri_ijazah?: string | null
          nomor_sim?: string | null
          nomor_surat?: string | null
          npwp_pembeli?: string | null
          npwp_penjual?: string | null
          origin?: string | null
          pekerjaan?: string | null
          pendidikan?: Json | null
          pengalaman_kerja?: Json | null
          perihal?: string | null
          phone?: string | null
          pieces?: number | null
          pkb_pokok?: number | null
          pkp_status?: string | null
          ppn?: number | null
          program_studi?: string | null
          provinsi?: string | null
          religion?: string | null
          role?: string
          role_id?: number | null
          role_name?: string | null
          rt_rw?: string | null
          selfie_url?: string | null
          sertifikasi?: Json | null
          shipper_address?: string | null
          shipper_name?: string | null
          sim_url?: string | null
          skck_url?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          status_perkawinan?: string | null
          status_wp?: string | null
          subtotal?: number | null
          supplier_name?: string | null
          swdkllj?: number | null
          tahun_lulus?: string | null
          tahun_pembuatan?: string | null
          tanggal_bayar?: string | null
          tanggal_berlaku?: string | null
          tanggal_dikeluarkan?: string | null
          tanggal_invoice?: string | null
          tanggal_jatuh_tempo?: string | null
          tanggal_lahir?: string | null
          tanggal_lulus?: string | null
          tanggal_terbit?: string | null
          tanggal_terdaftar?: string | null
          tempat_lahir?: string | null
          tempat_terbit?: string | null
          tinggi_badan?: string | null
          tipe?: string | null
          total?: number | null
          total_bayar?: number | null
          updated_at?: string | null
          upload_ijasah?: string | null
          warna?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      vehicle_models: {
        Row: {
          brand: string
          category: string
          created_at: string | null
          description: string | null
          entity_id: string | null
          features: Json | null
          fuel_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          model: string
          price_per_day: number
          price_per_month: number | null
          price_per_week: number | null
          seat_capacity: number | null
          transmission: string | null
          updated_at: string | null
        }
        Insert: {
          brand: string
          category: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          features?: Json | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          model: string
          price_per_day: number
          price_per_month?: number | null
          price_per_week?: number | null
          seat_capacity?: number | null
          transmission?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          features?: Json | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          model?: string
          price_per_day?: number
          price_per_month?: number | null
          price_per_week?: number | null
          seat_capacity?: number | null
          transmission?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_rentals: {
        Row: {
          additional_charges: number | null
          base_price: number
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deposit_amount: number | null
          discount: number | null
          end_date: string
          fuel_level_end: string | null
          fuel_level_start: string | null
          id: string
          notes: string | null
          odometer_end: number | null
          odometer_start: number | null
          payment_status: string | null
          pickup_location: string | null
          pickup_time: string | null
          rental_number: string
          rental_type: string | null
          return_location: string | null
          return_time: string | null
          start_date: string
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          additional_charges?: number | null
          base_price: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          discount?: number | null
          end_date: string
          fuel_level_end?: string | null
          fuel_level_start?: string | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          payment_status?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          rental_number: string
          rental_type?: string | null
          return_location?: string | null
          return_time?: string | null
          start_date: string
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          additional_charges?: number | null
          base_price?: number
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          discount?: number | null
          end_date?: string
          fuel_level_end?: string | null
          fuel_level_start?: string | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          payment_status?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          rental_number?: string
          rental_type?: string | null
          return_location?: string | null
          return_time?: string | null
          start_date?: string
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_rentals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_rentals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_rentals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_rentals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_tax_results: {
        Row: {
          alamat: string | null
          berlaku_hingga: string | null
          created_at: string | null
          denda_pkb: number | null
          id: string
          merk: string | null
          nama_pemilik: string | null
          nomor_mesin: string | null
          nomor_polisi: string | null
          nomor_rangka: string | null
          pokok_pkb: number | null
          processed_at: string | null
          raw_text: string | null
          swdkllj: number | null
          tahun: string | null
          tanggal_bayar: string | null
          tipe: string | null
          total_pajak: number | null
          user_id: string | null
          warna: string | null
        }
        Insert: {
          alamat?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          denda_pkb?: number | null
          id?: string
          merk?: string | null
          nama_pemilik?: string | null
          nomor_mesin?: string | null
          nomor_polisi?: string | null
          nomor_rangka?: string | null
          pokok_pkb?: number | null
          processed_at?: string | null
          raw_text?: string | null
          swdkllj?: number | null
          tahun?: string | null
          tanggal_bayar?: string | null
          tipe?: string | null
          total_pajak?: number | null
          user_id?: string | null
          warna?: string | null
        }
        Update: {
          alamat?: string | null
          berlaku_hingga?: string | null
          created_at?: string | null
          denda_pkb?: number | null
          id?: string
          merk?: string | null
          nama_pemilik?: string | null
          nomor_mesin?: string | null
          nomor_polisi?: string | null
          nomor_rangka?: string | null
          pokok_pkb?: number | null
          processed_at?: string | null
          raw_text?: string | null
          swdkllj?: number | null
          tahun?: string | null
          tanggal_bayar?: string | null
          tipe?: string | null
          total_pajak?: number | null
          user_id?: string | null
          warna?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          asset_id: string | null
          brand: string
          chassis_number: string | null
          color: string | null
          created_at: string | null
          engine_number: string | null
          fuel_type: string | null
          id: string
          model: string | null
          plate_number: string
          updated_at: string | null
          year_made: number | null
        }
        Insert: {
          asset_id?: string | null
          brand: string
          chassis_number?: string | null
          color?: string | null
          created_at?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          model?: string | null
          plate_number: string
          updated_at?: string | null
          year_made?: number | null
        }
        Update: {
          asset_id?: string | null
          brand?: string
          chassis_number?: string | null
          color?: string | null
          created_at?: string | null
          engine_number?: string | null
          fuel_type?: string | null
          id?: string
          model?: string | null
          plate_number?: string
          updated_at?: string | null
          year_made?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          payment_terms: number | null
          phone: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          payment_terms?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          manager_name: string | null
          name: string
          phone: string | null
          postal_code: string | null
          province: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_name?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wms_accounting_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          journal_entry_id: string | null
          status: string | null
          wms_transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id: string
          journal_entry_id?: string | null
          status?: string | null
          wms_transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          journal_entry_id?: string | null
          status?: string | null
          wms_transaction_id?: string | null
        }
        Relationships: []
      }
      wms_cancel_events: {
        Row: {
          created_at: string | null
          id: string
          processed: boolean | null
          reason: string | null
          wms_transaction_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          reason?: string | null
          wms_transaction_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          processed?: boolean | null
          reason?: string | null
          wms_transaction_id?: string
        }
        Relationships: []
      }
      wms_transactions: {
        Row: {
          created_at: string | null
          direction: string | null
          id: string
          item_name: string | null
          processed: boolean | null
          processed_at: string | null
          qty: number | null
          reversed: boolean | null
          sku: string | null
          source_module: string | null
          source_type: string | null
          status: string | null
          transaction_date: string | null
          transaction_type: string | null
          uom: string | null
          warehouse_id: string | null
          wms_direction: string | null
          wms_module: string | null
          wms_reference: string | null
        }
        Insert: {
          created_at?: string | null
          direction?: string | null
          id?: string
          item_name?: string | null
          processed?: boolean | null
          processed_at?: string | null
          qty?: number | null
          reversed?: boolean | null
          sku?: string | null
          source_module?: string | null
          source_type?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          uom?: string | null
          warehouse_id?: string | null
          wms_direction?: string | null
          wms_module?: string | null
          wms_reference?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string | null
          id?: string
          item_name?: string | null
          processed?: boolean | null
          processed_at?: string | null
          qty?: number | null
          reversed?: boolean | null
          sku?: string | null
          source_module?: string | null
          source_type?: string | null
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          uom?: string | null
          warehouse_id?: string | null
          wms_direction?: string | null
          wms_module?: string | null
          wms_reference?: string | null
        }
        Relationships: []
      }
      zones: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cash_disbursement_with_account_name: {
        Row: {
          account_code: string | null
          account_name: string | null
          amount: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          bank_account: string | null
          bank_account_id: string | null
          bukti: string | null
          cash_account_id: string | null
          cash_account_name: string | null
          category: string | null
          coa_cash_id: string | null
          coa_expense_id: string | null
          coa_id: string | null
          cost_center_id: string | null
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          description: string | null
          document_number: string | null
          evidence_url: string | null
          exchange_rate: number | null
          expense_account_name: string | null
          id: string | null
          journal_ref: string | null
          normalized_amount: number | null
          notes: string | null
          ocr_data: Json | null
          ocr_id: string | null
          payee_name: string | null
          payment_method: string | null
          rejection_reason: string | null
          status: string | null
          tax_amount: number | null
          tax_code: string | null
          tax_type: string | null
          transaction_date: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      cash_flow_monthly: {
        Row: {
          cash_in: number | null
          cash_out: number | null
          month: string | null
        }
        Relationships: []
      }
      stock_adjustments_with_supplier: {
        Row: {
          created_at: string | null
          id: string | null
          item_name: string | null
          qty_change: number | null
          reason: string | null
          stock_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          item_name?: string | null
          qty_change?: number | null
          reason?: string | null
          stock_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          item_name?: string | null
          qty_change?: number | null
          reason?: string | null
          stock_id?: string | null
        }
        Relationships: []
      }
      v_wms_reversal_audit: {
        Row: {
          account_code: string | null
          credit: number | null
          debit: number | null
          entry_date: string | null
          is_fatal: boolean | null
          is_period_locked: boolean | null
          journal_entry_id: string | null
          movement_type: string | null
          movement_value: number | null
          processed: boolean | null
          qty: number | null
          reference_type: string | null
          reversed: boolean | null
          sku: string | null
          transaction_date: string | null
          wms_reference: string | null
          wms_transaction_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_entries_account"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
        ]
      }
      view_general_ledger: {
        Row: {
          account_code: string | null
          account_name: string | null
          credit: number | null
          date: string | null
          debit: number | null
          journal_id: string | null
          reference: string | null
        }
        Relationships: []
      }
      vw_all_financial_transactions: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_name: string | null
          description: string | null
          id: string | null
          item_name: string | null
          journal_ref: string | null
          notes: string | null
          payment_method: string | null
          payment_type: string | null
          ppn_amount: number | null
          quantity: number | null
          subtotal: number | null
          supplier_name: string | null
          target_table: string | null
          total_amount: number | null
          transaction_date: string | null
          transaction_type: string | null
          unit_price: number | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string | null
          item_name?: string | null
          journal_ref?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_type?: string | null
          ppn_amount?: number | null
          quantity?: number | null
          subtotal?: number | null
          supplier_name?: string | null
          target_table?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          unit_price?: number | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string | null
          item_name?: string | null
          journal_ref?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_type?: string | null
          ppn_amount?: number | null
          quantity?: number | null
          subtotal?: number | null
          supplier_name?: string | null
          target_table?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_type?: string | null
          unit_price?: number | null
        }
        Relationships: []
      }
      vw_attendance_with_employee: {
        Row: {
          attendance_date: string | null
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          employee_id: string | null
          employee_number: string | null
          full_name: string | null
          id: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          work_hours: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_cash_flow_by_bank: {
        Row: {
          account_code: string | null
          account_name: string | null
          kas_keluar: number | null
          kas_masuk: number | null
          period: string | null
          saldo_berjalan: number | null
        }
        Relationships: []
      }
      vw_cash_flow_detail: {
        Row: {
          description: string | null
          entry_date: string | null
          id: string | null
        }
        Insert: {
          description?: string | null
          entry_date?: string | null
          id?: string | null
        }
        Update: {
          description?: string | null
          entry_date?: string | null
          id?: string | null
        }
        Relationships: []
      }
      vw_cash_flow_direct: {
        Row: {
          kas_keluar: number | null
          kas_masuk: number | null
          net_cash_flow: number | null
          period: string | null
        }
        Relationships: []
      }
      vw_cash_flow_indirect: {
        Row: {
          laba_bersih: number | null
          penyusutan: number | null
          period: string | null
        }
        Relationships: []
      }
      vw_cash_flow_per_bank: {
        Row: {
          account_code: string | null
          account_name: string | null
          bulan: number | null
          kas_keluar: number | null
          kas_masuk: number | null
          net_cash_flow: number | null
          tahun: number | null
        }
        Relationships: []
      }
      vw_cash_flow_report: {
        Row: {
          bulan: number | null
          kas_keluar: number | null
          kas_masuk: number | null
          net_cash_flow: number | null
          tahun: number | null
        }
        Relationships: []
      }
      vw_cash_flow_summary: {
        Row: {
          kas_keluar: number | null
          kas_masuk: number | null
          net_cash_flow: number | null
        }
        Relationships: []
      }
      vw_cash_reconciliation: {
        Row: {
          account_code: string | null
          account_name: string | null
          saldo_gl: number | null
        }
        Relationships: []
      }
      vw_customers: {
        Row: {
          address: string | null
          bank_account_number: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          payment_term_days: number | null
          payment_term_id: string | null
          payment_term_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_employee_advance_summary: {
        Row: {
          advance_date: string | null
          advance_number: string | null
          amount: number | null
          coa_account_code: string | null
          created_at: string | null
          disbursement_account_id: string | null
          disbursement_date: string | null
          disbursement_method: string | null
          employee_id: string | null
          employee_name: string | null
          finance_approval: string | null
          id: string | null
          manager_approval: string | null
          reference_number: string | null
          remaining_balance: number | null
          return_count: number | null
          settlement_count: number | null
          status: string | null
          total_returned: number | null
          total_settled: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bank_account_id"
            columns: ["disbursement_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_journal_summary: {
        Row: {
          account_code: string | null
          account_name: string | null
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string | null
          journal_ref: string | null
          transaction_date: string | null
        }
        Insert: {
          account_code?: string | null
          account_name?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string | null
          journal_ref?: string | null
          transaction_date?: string | null
        }
        Update: {
          account_code?: string | null
          account_name?: string | null
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string | null
          journal_ref?: string | null
          transaction_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_journal_entries_account"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
        ]
      }
      vw_loan_summary: {
        Row: {
          coa_cash_code: string | null
          coa_interest_code: string | null
          coa_loan_code: string | null
          created_at: string | null
          id: string | null
          interest_rate: number | null
          journal_ref: string | null
          jumlah_pembayaran: number | null
          lender_name: string | null
          lender_type: string | null
          loan_date: string | null
          loan_number: string | null
          loan_term_months: number | null
          maturity_date: string | null
          notes: string | null
          payment_history: Json | null
          payment_schedule: string | null
          principal_amount: number | null
          purpose: string | null
          remaining_balance: number | null
          sisa_pokok: number | null
          status: string | null
          status_pembayaran: string | null
          total_bunga_dibayar: number | null
          total_interest_paid: number | null
          total_paid: number | null
          total_principal_dibayar: number | null
          updated_at: string | null
        }
        Insert: {
          coa_cash_code?: string | null
          coa_interest_code?: string | null
          coa_loan_code?: string | null
          created_at?: string | null
          id?: string | null
          interest_rate?: number | null
          journal_ref?: string | null
          jumlah_pembayaran?: never
          lender_name?: string | null
          lender_type?: string | null
          loan_date?: string | null
          loan_number?: string | null
          loan_term_months?: number | null
          maturity_date?: string | null
          notes?: string | null
          payment_history?: Json | null
          payment_schedule?: string | null
          principal_amount?: number | null
          purpose?: string | null
          remaining_balance?: number | null
          sisa_pokok?: never
          status?: string | null
          status_pembayaran?: never
          total_bunga_dibayar?: never
          total_interest_paid?: number | null
          total_paid?: number | null
          total_principal_dibayar?: never
          updated_at?: string | null
        }
        Update: {
          coa_cash_code?: string | null
          coa_interest_code?: string | null
          coa_loan_code?: string | null
          created_at?: string | null
          id?: string | null
          interest_rate?: number | null
          journal_ref?: string | null
          jumlah_pembayaran?: never
          lender_name?: string | null
          lender_type?: string | null
          loan_date?: string | null
          loan_number?: string | null
          loan_term_months?: number | null
          maturity_date?: string | null
          notes?: string | null
          payment_history?: Json | null
          payment_schedule?: string | null
          principal_amount?: number | null
          purpose?: string | null
          remaining_balance?: number | null
          sisa_pokok?: never
          status?: string | null
          status_pembayaran?: never
          total_bunga_dibayar?: never
          total_interest_paid?: number | null
          total_paid?: number | null
          total_principal_dibayar?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      vw_purchase_requests: {
        Row: {
          item_name: string | null
          name: string | null
          request_code: string | null
          request_date: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          item_name?: string | null
          name?: string | null
          request_code?: string | null
          request_date?: never
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          item_name?: string | null
          name?: string | null
          request_code?: string | null
          request_date?: never
          status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      vw_stock_summary: {
        Row: {
          average_cost: number | null
          id: string | null
          item_name: string | null
          margin: number | null
          margin_percent: number | null
          quantity: number | null
          selling_price: number | null
          sku: string | null
          total_value: number | null
          unit: string | null
        }
        Insert: {
          average_cost?: never
          id?: string | null
          item_name?: string | null
          margin?: never
          margin_percent?: never
          quantity?: number | null
          selling_price?: never
          sku?: string | null
          total_value?: never
          unit?: string | null
        }
        Update: {
          average_cost?: never
          id?: string | null
          item_name?: string | null
          margin?: never
          margin_percent?: never
          quantity?: number | null
          selling_price?: never
          sku?: string | null
          total_value?: never
          unit?: string | null
        }
        Relationships: []
      }
      vw_transaction_summary: {
        Row: {
          created_at: string | null
          customer_name: string | null
          description: string | null
          employee_name: string | null
          id: string | null
          payment_method: string | null
          pph_amount: number | null
          ppn_amount: number | null
          status: string | null
          total_amount: number | null
          transaction_date: string | null
          transaction_number: string | null
          transaction_type: string | null
          vendor_name: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          employee_name?: string | null
          id?: string | null
          payment_method?: string | null
          pph_amount?: number | null
          ppn_amount?: number | null
          status?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_number?: string | null
          transaction_type?: string | null
          vendor_name?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          employee_name?: string | null
          id?: string | null
          payment_method?: string | null
          pph_amount?: number | null
          ppn_amount?: number | null
          status?: string | null
          total_amount?: number | null
          transaction_date?: string | null
          transaction_number?: string | null
          transaction_type?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_loan_payment: {
        Args: {
          p_bank_name?: string
          p_interest_amount?: number
          p_loan_id: string
          p_notes?: string
          p_payment_date: string
          p_payment_method?: string
          p_principal_amount: number
          p_reference_number?: string
        }
        Returns: Json
      }
      ai_cancel_booking: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: boolean
      }
      ai_create_booking: {
        Args: {
          p_end: string
          p_facility_id: string
          p_metadata?: Json
          p_price: number
          p_start: string
          p_user_id: string
        }
        Returns: string
      }
      ai_safe_sql_exec: {
        Args: { sql_text: string }
        Returns: Record<string, unknown>[]
      }
      ai_update_booking_time: {
        Args: {
          p_booking_id: string
          p_end: string
          p_start: string
          p_user_id: string
        }
        Returns: boolean
      }
      apply_ai_mapping: {
        Args: { p_auto_post?: boolean; p_id: string }
        Returns: Json
      }
      apply_coa_mapping_to_disbursement: {
        Args: { p_disbursement_id: string }
        Returns: undefined
      }
      apply_tax_engine: { Args: { p_id: string }; Returns: Json }
      auto_match_bank_mutation: {
        Args: { p_mutation_id: string }
        Returns: undefined
      }
      balance_sheet: {
        Args: { report_date: string }
        Returns: {
          account_code: string
          account_name: string
          amount: number
        }[]
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      calculate_late_fee:
        | {
            Args: {
              p_due_date: string
              p_installment_amount: number
              p_payment_date: string
            }
            Returns: number
          }
        | {
            Args: {
              p_due_date: string
              p_installment_amount: number
              p_late_fee_percentage?: number
              p_payment_date: string
            }
            Returns: number
          }
      calculate_stock_value: { Args: { p_sku: string }; Returns: number }
      calculate_tax: {
        Args: { p_base_amount: number; p_tax_percentage: number }
        Returns: number
      }
      cancel_journal: { Args: { p_journal_id: string }; Returns: string }
      cash_flow_statement: {
        Args: { end_date: string; start_date: string }
        Returns: {
          account_code: string
          account_name: string
          amount: number
          section: string
        }[]
      }
      check_availability: {
        Args: { e: string; f_id: string; s: string }
        Returns: boolean
      }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      cleanup_old_cart_items: { Args: never; Returns: undefined }
      create_journal_for_sales: {
        Args: { p_sales_id: string }
        Returns: string
      }
      create_monthly_tax_reminders: { Args: never; Returns: undefined }
      embedding_coa_match: { Args: { p_text: string }; Returns: Json }
      execute_sql: { Args: { query: string }; Returns: Json }
      extract_keywords: { Args: { p_text: string }; Returns: string[] }
      fn_check_large_transactions: { Args: never; Returns: undefined }
      fn_income_statement: {
        Args: { p_end: string; p_start: string }
        Returns: {
          account_code: string
          account_name: string
          credit_total: number
          debit_total: number
          is_total: boolean
          note: string
          saldo: number
          section: string
          sort_section: number
        }[]
      }
      fn_post_monthly_depreciation: { Args: never; Returns: undefined }
      fn_update_coa_balance: { Args: never; Returns: undefined }
      gen_stock_code: { Args: never; Returns: string }
      generate_advance_number: { Args: never; Returns: string }
      generate_booking_reference: { Args: never; Returns: string }
      generate_contract_number: { Args: never; Returns: string }
      generate_journal_disabled: {
        Args: { disbursement_id: string }
        Returns: undefined
      }
      generate_journal_number: { Args: never; Returns: string }
      generate_kas_document_number: { Args: never; Returns: string }
      generate_laba_rugi: {
        Args: never
        Returns: {
          amount: number
          type: string
        }[]
      }
      generate_neraca: {
        Args: never
        Returns: {
          amount: number
          type: string
        }[]
      }
      generate_pr_code: { Args: never; Returns: string }
      generate_rental_number: { Args: never; Returns: string }
      generate_supplier_code: {
        Args: { pad_len?: number; prefix?: string }
        Returns: string
      }
      generate_trial_balance: {
        Args: never
        Returns: {
          account_code: string
          total_credit: number
          total_debit: number
        }[]
      }
      get_account_coa: {
        Args: { p_account_id: string }
        Returns: {
          account_code: string
          account_name: string
          account_type: string
          id: string
          level: number
          normal_balance: string
        }[]
      }
      get_account_coa_by_code: {
        Args: { p_account_code: string }
        Returns: {
          account_code: string
          account_name: string
          account_type: string
          id: string
          level: number
          normal_balance: string
        }[]
      }
      get_balance_sheet: {
        Args: { p_as_of_date: string }
        Returns: {
          account_code: string
          account_name: string
          amount: number
          section: string
        }[]
      }
      get_brands_by_item: {
        Args: { p_item_name: string }
        Returns: {
          brand_name: string
        }[]
      }
      get_coa_mapping: {
        Args: { p_service_category: string; p_service_type: string }
        Returns: {
          asset_account_code: string
          asset_account_name: string
          cogs_account_code: string
          cogs_account_name: string
          revenue_account_code: string
          revenue_account_name: string
        }[]
      }
      get_employee_advance_balance: {
        Args: { p_employee_id: string }
        Returns: number
      }
      get_general_ledger: {
        Args: { p_account_code: string }
        Returns: {
          balance: number
          credit: number
          debit: number
          description: string
          journal_date: string
          journal_ref: string
        }[]
      }
      get_hari_di_gudang: { Args: { tanggal_masuk: string }; Returns: number }
      get_hari_di_lini: { Args: { tanggal_masuk: string }; Returns: number }
      get_journal_entries_with_coa: {
        Args: {
          p_account_code?: string
          p_account_id?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          account_code: string
          account_id: string
          account_name: string
          account_type: string
          created_at: string
          credit: number
          date: string
          debit: number
          description: string
          id: string
          journal_entry_id: string
          normal_balance: string
        }[]
      }
      get_next_transaction_number: {
        Args: { p_prefix: string }
        Returns: string
      }
      get_or_create_employee_advance_coa: {
        Args: { p_employee_id: string; p_employee_name: string }
        Returns: string
      }
      get_product_reference: {
        Args: { p_brand?: string; p_item_name: string }
        Returns: {
          brand: string
          coa_account_code: string
          coa_account_name: string
          description: string
          item_name: string
          service_category: string
          service_type: string
          typical_weight: string
          unit: string
        }[]
      }
      get_profit_and_loss: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          account_code: string
          account_name: string
          amount: number
          section: string
        }[]
      }
      get_service_types_by_category: {
        Args: { p_category: string }
        Returns: {
          description: string
          revenue_account_code: string
          service_type: string
        }[]
      }
      get_trial_balance: {
        Args: never
        Returns: {
          account_code: string
          account_name: string
          balance: number
          total_credit: number
          total_debit: number
        }[]
      }
      get_user_department: { Args: never; Returns: string }
      get_user_employee_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      income_statement: {
        Args: { end_date: string; start_date: string }
        Returns: {
          account_code: string
          account_name: string
          amount: number
        }[]
      }
      insert_journal_entries_disabled: {
        Args: { entries: Json }
        Returns: undefined
      }
      kas_autonumber: { Args: never; Returns: string }
      match_bank_statement: { Args: { p_id: string }; Returns: Json }
      match_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_hs_codes: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          description: string
          hs_code: string
          id: string
          similarity: number
          sub_category: string
        }[]
      }
      normalize_account_type: { Args: { input: string }; Returns: string }
      post_bank_statement_as_journal: {
        Args: { p_id: string; p_user?: string }
        Returns: undefined
      }
      post_journal_bank_mutation: {
        Args: { p_bank_mutation_id: string }
        Returns: undefined
      }
      post_journal_to_general_ledger: {
        Args: { p_journal_id: string }
        Returns: undefined
      }
      rebuild_general_ledger: { Args: never; Returns: undefined }
      recalc_journal_totals: { Args: { p_je_id: string }; Returns: undefined }
      recalc_trial_balance_period: {
        Args: { p_account_code?: string; p_period_start: string }
        Returns: undefined
      }
      recalculate_all_coa_balances: { Args: never; Returns: undefined }
      repost_gl_for_journal_entry:
        | {
            Args: { p_je_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.repost_gl_for_journal_entry(p_je_id => text), public.repost_gl_for_journal_entry(p_je_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { p_je_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.repost_gl_for_journal_entry(p_je_id => text), public.repost_gl_for_journal_entry(p_je_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      reset_transaction_tax: {
        Args: { p_id: string; p_user?: string }
        Returns: Json
      }
      reverse_journal: { Args: { journal_id: string }; Returns: undefined }
      rpc_validate_and_commit_coa: { Args: never; Returns: Json }
      run_monthly_depreciation: { Args: { p_date: string }; Returns: undefined }
      set_app_user: { Args: { uid: string }; Returns: undefined }
      set_transaction_no_tax: {
        Args: { p_id: string; p_user?: string }
        Returns: undefined
      }
      smart_find_rule: { Args: { p_id: string }; Returns: Json }
      text_to_bytea: { Args: { data: string }; Returns: string }
      trial_balance: {
        Args: { report_date: string }
        Returns: {
          account_code: string
          account_name: string
          balance: number
          credit: number
          debit: number
        }[]
      }
      update_coa_balances_from_gl: { Args: never; Returns: string }
      update_coa_balances_from_journal: { Args: never; Returns: string }
      update_stock_after_transaction: {
        Args: {
          coa_account_code: string
          coa_account_name: string
          item_id: string
          payment_method: string
          quantity: number
          total_amount: number
          transaction_date: string
          transaction_id: string
          type: string
        }
        Returns: undefined
      }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      validate_coa: { Args: { p_code: string }; Returns: undefined }
      void_journal_group: {
        Args: { p_group_id: string; p_reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type_enum:
        | "Aset"
        | "Kewajiban"
        | "Ekuitas"
        | "Pendapatan"
        | "Beban Operasional"
      airwaybill_status:
        | "ARRIVED"
        | "IN_CUSTOMS"
        | "CLEARED"
        | "DELIVERED"
        | "CANCELLED"
      customs_status: "PENDING" | "RELEASED" | "HOLD" | "CLEARED" | "REJECTED"
      flow_type_enum: "bank" | "cash"
      import_type:
        | "DIRECT"
        | "CONSOLIDATED"
        | "COURIER"
        | "PERSONAL_GOODS"
        | "SAMPLE"
        | "OTHER"
      incoterm_type:
        | "EXW"
        | "FCA"
        | "FOB"
        | "CFR"
        | "CIF"
        | "CPT"
        | "CIP"
        | "DAP"
        | "DPU"
        | "DDP"
        | "OTHER"
      mutation_channel: "va" | "transfer" | "card" | "cash"
      mutation_type: "credit" | "debit"
      payment_status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "INVOICE_SENT"
      trans_type_enum: "asset" | "liability" | "equity" | "revenue" | "expense"
      user_status: "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type_enum: [
        "Aset",
        "Kewajiban",
        "Ekuitas",
        "Pendapatan",
        "Beban Operasional",
      ],
      airwaybill_status: [
        "ARRIVED",
        "IN_CUSTOMS",
        "CLEARED",
        "DELIVERED",
        "CANCELLED",
      ],
      customs_status: ["PENDING", "RELEASED", "HOLD", "CLEARED", "REJECTED"],
      flow_type_enum: ["bank", "cash"],
      import_type: [
        "DIRECT",
        "CONSOLIDATED",
        "COURIER",
        "PERSONAL_GOODS",
        "SAMPLE",
        "OTHER",
      ],
      incoterm_type: [
        "EXW",
        "FCA",
        "FOB",
        "CFR",
        "CIF",
        "CPT",
        "CIP",
        "DAP",
        "DPU",
        "DDP",
        "OTHER",
      ],
      mutation_channel: ["va", "transfer", "card", "cash"],
      mutation_type: ["credit", "debit"],
      payment_status: ["UNPAID", "PARTIALLY_PAID", "PAID", "INVOICE_SENT"],
      trans_type_enum: ["asset", "liability", "equity", "revenue", "expense"],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
