DROP TABLE IF EXISTS airwaybills CASCADE;

DO $$ BEGIN
  CREATE TYPE import_type AS ENUM ('DIRECT', 'TRANSSHIPMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incoterm_type AS ENUM ('EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE customs_status AS ENUM ('PENDING', 'IN_PROCESS', 'CLEARED', 'HELD', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE airwaybill_status AS ENUM ('ARRIVED', 'IN_CUSTOMS', 'CLEARED', 'IN_STORAGE', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE public.airwaybills (
  id uuid not null default gen_random_uuid (),
  awb_number character varying(16) not null,
  hawb_number character varying(32) null,
  import_type import_type not null default 'DIRECT',
  flight_number character varying(16) null,
  flight_date date null,
  arrival_airport_code character(3) not null,
  origin_airport_code character(3) not null,
  shipper_name character varying(200) null,
  shipper_address text null,
  consignee_name character varying(200) null,
  consignee_address text null,
  consignee_npwp character varying(32) null,
  consignee_contact character varying(100) null,
  notify_party character varying(200) null,
  number_of_packages integer not null,
  gross_weight_kg numeric(12, 3) not null,
  length_cm numeric(10, 2) null,
  width_cm numeric(10, 2) null,
  height_cm numeric(10, 2) null,
  volume_weight_kg numeric(12, 3) GENERATED ALWAYS as (
    case
      when (
        (length_cm is not null)
        and (width_cm is not null)
        and (height_cm is not null)
      ) then (((length_cm * width_cm) * height_cm) / 6000.0)
      else (0)::numeric
    end
  ) STORED null,
  chargeable_weight_kg numeric(12, 3) GENERATED ALWAYS as (
    GREATEST(
      COALESCE(gross_weight_kg, (0)::numeric),
      case
        when (
          (length_cm is not null)
          and (width_cm is not null)
          and (height_cm is not null)
        ) then (((length_cm * width_cm) * height_cm) / 6000.0)
        else (0)::numeric
      end
    )
  ) STORED null,
  commodity_description text null,
  hs_code character varying(20) null,
  value_of_goods numeric(18, 2) null,
  currency character(3) not null default 'USD',
  incoterm incoterm_type not null default 'CIF',
  import_duty numeric(18, 2) not null default 0,
  ppn_import numeric(18, 2) not null default 0,
  pph_import numeric(18, 2) not null default 0,
  excise_duty numeric(18, 2) not null default 0,
  other_taxes numeric(18, 2) not null default 0,
  total_taxes numeric(18, 2) GENERATED ALWAYS as (
    (
      (
        (
          (
            COALESCE(import_duty, (0)::numeric) + COALESCE(ppn_import, (0)::numeric)
          ) + COALESCE(pph_import, (0)::numeric)
        ) + COALESCE(excise_duty, (0)::numeric)
      ) + COALESCE(other_taxes, (0)::numeric)
    )
  ) STORED null,
  customs_declaration_number character varying(64) null,
  customs_status customs_status null default 'PENDING',
  customs_clearance_date date null,
  freight_charge numeric(18, 2) not null default 0,
  handling_fee numeric(18, 2) not null default 0,
  storage_fee numeric(18, 2) not null default 0,
  insurance_fee numeric(18, 2) not null default 0,
  other_charge numeric(18, 2) not null default 0,
  total_charge numeric(18, 2) GENERATED ALWAYS as (
    (
      (
        (
          (
            COALESCE(freight_charge, (0)::numeric) + COALESCE(handling_fee, (0)::numeric)
          ) + COALESCE(storage_fee, (0)::numeric)
        ) + COALESCE(insurance_fee, (0)::numeric)
      ) + COALESCE(other_charge, (0)::numeric)
    )
  ) STORED null,
  payment_status payment_status not null default 'UNPAID',
  invoice_number character varying(64) null,
  arrival_date date null,
  unloading_date date null,
  storage_location character varying(100) null,
  delivery_order_number character varying(64) null,
  delivery_date date null,
  status airwaybill_status not null default 'ARRIVED',
  created_by uuid null,
  updated_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint airwaybills_pkey primary key (id),
  constraint airwaybills_excise_duty_check check ((excise_duty >= (0)::numeric)),
  constraint airwaybills_freight_charge_check check ((freight_charge >= (0)::numeric)),
  constraint airwaybills_gross_weight_kg_check check ((gross_weight_kg >= (0)::numeric)),
  constraint airwaybills_handling_fee_check check ((handling_fee >= (0)::numeric)),
  constraint airwaybills_height_cm_check check ((height_cm >= (0)::numeric)),
  constraint airwaybills_import_duty_check check ((import_duty >= (0)::numeric)),
  constraint airwaybills_insurance_fee_check check ((insurance_fee >= (0)::numeric)),
  constraint airwaybills_length_cm_check check ((length_cm >= (0)::numeric)),
  constraint airwaybills_number_of_packages_check check ((number_of_packages >= 0)),
  constraint airwaybills_other_charge_check check ((other_charge >= (0)::numeric)),
  constraint airwaybills_other_taxes_check check ((other_taxes >= (0)::numeric)),
  constraint airwaybills_pph_import_check check ((pph_import >= (0)::numeric)),
  constraint airwaybills_ppn_import_check check ((ppn_import >= (0)::numeric)),
  constraint airwaybills_storage_fee_check check ((storage_fee >= (0)::numeric)),
  constraint airwaybills_value_of_goods_check check ((value_of_goods >= (0)::numeric)),
  constraint airwaybills_width_cm_check check ((width_cm >= (0)::numeric)),
  constraint awb_number_format_chk check (
    (
      ((awb_number)::text ~ '^[0-9]{3}-[0-9]{8}$'::text)
      or ((awb_number)::text ~ '^[0-9]{11}$'::text)
    )
  ),
  constraint airport_iata_chk check (
    (
      (arrival_airport_code ~ '^[A-Z]{3}$'::text)
      and (origin_airport_code ~ '^[A-Z]{3}$'::text)
    )
  ),
  constraint currency_iso_chk check ((currency ~ '^[A-Z]{3}$'::text))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_airwaybills_awb_number ON public.airwaybills USING btree (awb_number);
CREATE INDEX IF NOT EXISTS idx_airwaybills_hawb ON public.airwaybills USING btree (hawb_number);
CREATE INDEX IF NOT EXISTS idx_airwaybills_flight_date ON public.airwaybills USING btree (flight_date);
CREATE INDEX IF NOT EXISTS idx_airwaybills_customs_status ON public.airwaybills USING btree (customs_status);
CREATE INDEX IF NOT EXISTS idx_airwaybills_payment_status ON public.airwaybills USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_airwaybills_status ON public.airwaybills USING btree (status);
CREATE INDEX IF NOT EXISTS idx_airwaybills_arrival_airport ON public.airwaybills USING btree (arrival_airport_code);
CREATE INDEX IF NOT EXISTS idx_airwaybills_origin_airport ON public.airwaybills USING btree (origin_airport_code);

ALTER PUBLICATION supabase_realtime ADD TABLE airwaybills;