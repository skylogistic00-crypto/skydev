import { corsHeaders } from "@shared/cors.ts";
import { createSupabaseClient } from "@shared/supabase-client.ts";

type DeliveryStatus = "draft" | "sent" | "confirmed" | "done" | "cancelled";

type LineInput = {
  id?: string;
  product_id?: string | null;
  product_name: string;
  qty: number;
  uom: string;
  unit_price?: number | null;
  notes?: string | null;
  line_no?: number;
};

type UpsertPayload = {
  id?: string;
  delivery_no?: string;
  sales_order_id?: string | null;
  origin_ref?: string | null;
  customer_name?: string | null;
  delivery_date?: string | null;
  notes?: string | null;
  status?: DeliveryStatus;
  lines?: LineInput[];
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createSupabaseClient(req);
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "GET" && path.endsWith("/list")) {
      const status = url.searchParams.get("status");
      const q = url.searchParams.get("q");

      let query = supabase
        .from("deliveriesx")
        .select("id, delivery_no, sales_order_id, status, delivery_date, customer_name, origin_ref, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (status) query = query.eq("status", status);
      if (q) {
        query = query.or(
          `delivery_no.ilike.%${q}%,customer_name.ilike.%${q}%,origin_ref.ilike.%${q}%`,
        );
      }

      const { data, error: e } = await query;
      if (e) return error(e.message, 500);
      return json({ data });
    }

    if (req.method === "GET" && path.endsWith("/get")) {
      const id = url.searchParams.get("id");
      if (!id) return error("Missing id");

      const { data, error: e } = await supabase
        .from("deliveriesx")
        .select("*")
        .eq("id", id)
        .single();
      if (e) return error(e.message, 500);

      const { data: lines, error: e2 } = await supabase
        .from("deliveryx_lines")
        .select("*")
        .eq("delivery_id", id)
        .order("line_no", { ascending: true });
      if (e2) return error(e2.message, 500);

      return json({ data: { ...data, lines } });
    }

    if (req.method === "POST" && path.endsWith("/upsert")) {
      const payload = (await req.json()) as UpsertPayload;

      let deliveryId = payload.id;

      if (!deliveryId) {
        const { data: created, error: e } = await supabase
          .from("deliveriesx")
          .insert({
            delivery_no: payload.delivery_no,
            sales_order_id: payload.sales_order_id ?? null,
            status: payload.status ?? "draft",
            delivery_date: payload.delivery_date ?? null,
            customer_name: payload.customer_name ?? null,
            origin_ref: payload.origin_ref ?? null,
          })
          .select("id")
          .single();

        if (e) return error(e.message, 500);
        deliveryId = created.id;
      } else {
        const { error: e } = await supabase
          .from("deliveriesx")
          .update({
            sales_order_id: payload.sales_order_id ?? null,
            status: payload.status,
            delivery_date: payload.delivery_date ?? null,
            customer_name: payload.customer_name ?? null,
            origin_ref: payload.origin_ref ?? null,
          })
          .eq("id", deliveryId);
        if (e) return error(e.message, 500);
      }

      if (payload.lines?.length) {
        const normalized = payload.lines.map((l, idx) => ({
          id: l.id,
          delivery_id: deliveryId,
          product_id: l.product_id ?? null,
          product_name: l.product_name,
          qty: l.qty,
          uom: l.uom,
          unit_price: l.unit_price ?? null,
          notes: l.notes ?? null,
          line_no: l.line_no ?? idx + 1,
        }));

        const { error: e } = await supabase
          .from("deliveryx_lines")
          .upsert(normalized, { onConflict: "id" });
        if (e) return error(e.message, 500);
      }

      return json({ data: { id: deliveryId } });
    }

    if (req.method === "POST" && path.endsWith("/action")) {
      const { id, action } = (await req.json()) as { id?: string; action?: string };
      if (!id) return error("Missing id");
      if (!action) return error("Missing action");

      const { data: current, error: e0 } = await supabase
        .from("deliveriesx")
        .select("status")
        .eq("id", id)
        .single();
      if (e0) return error(e0.message, 500);

      const status = current.status as DeliveryStatus;

      const nowFieldByAction: Record<string, Partial<Record<string, string>>> = {
        send: { status: "sent", at: "sent_at" },
        confirm: { status: "confirmed", at: "confirmed_at" },
        done: { status: "done", at: "done_at" },
        cancel: { status: "cancelled", at: "cancelled_at" },
        reset: { status: "draft", at: "" },
      };

      const def = nowFieldByAction[action];
      if (!def) return error("Unknown action");

      const nextStatus = def.status as DeliveryStatus;

      const allowed: Record<DeliveryStatus, DeliveryStatus[]> = {
        draft: ["sent", "confirmed", "cancelled"],
        sent: ["confirmed", "cancelled"],
        confirmed: ["done", "cancelled"],
        done: ["draft"],
        cancelled: ["draft"],
      };

      if (!allowed[status].includes(nextStatus)) {
        return error(`Invalid transition ${status} -> ${nextStatus}`, 409);
      }

      const patch: Record<string, unknown> = { status: nextStatus };
      if (def.at) patch[def.at] = new Date().toISOString();

      const { error: e1 } = await supabase.from("deliveriesx").update(patch).eq("id", id);
      if (e1) return error(e1.message, 500);

      return json({ data: { id, status: nextStatus } });
    }

    return error("Not found", 404);
  } catch (e) {
    return error(e?.message ?? "Unknown error", 500);
  }
});
