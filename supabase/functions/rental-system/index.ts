import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "@shared/supabase-client.ts";

interface RentalRequest {
  action: string;
  model_id?: string;
  vehicle_id?: string;
  customer_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  rental_type?: string;
  pickup_location?: string;
  return_location?: string;
  created_by?: string;
  rental_id?: string;
  status?: string;
  filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    model_id?: string;
    category?: string;
  };
}

function generateRentalNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `RNT${dateStr}-${random}`;
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient();
    const body: RentalRequest = await req.json();
    const { action } = body;

    // GET VEHICLE MODELS
    if (action === "get_models") {
      const { filters } = body;
      let query = supabase
        .from("vehicle_models")
        .select("*")
        .eq("is_active", true)
        .order("brand");

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET AVAILABLE VEHICLES BY MODEL
    if (action === "get_available_vehicles") {
      const { model_id, start_date, end_date } = body;

      if (!model_id) {
        return new Response(
          JSON.stringify({ error: "model_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Get model info
      const { data: model } = await supabase
        .from("vehicle_models")
        .select("*")
        .eq("id", model_id)
        .single();

      if (!model) {
        return new Response(
          JSON.stringify({ error: "Model not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Get all vehicles of this model
      let vehicleQuery = supabase
        .from("vehicles")
        .select("*")
        .eq("model_id", model_id)
        .eq("status", "available");

      const { data: vehicles } = await vehicleQuery;

      // If dates provided, filter out vehicles with overlapping rentals
      let availableVehicles = vehicles || [];

      if (start_date && end_date && availableVehicles.length > 0) {
        const vehicleIds = availableVehicles.map(v => v.id);

        const { data: overlappingRentals } = await supabase
          .from("vehicle_rentals")
          .select("vehicle_id")
          .in("vehicle_id", vehicleIds)
          .in("status", ["pending", "confirmed", "active"])
          .or(`start_date.lte.${end_date},end_date.gte.${start_date}`);

        const rentedVehicleIds = new Set(overlappingRentals?.map(r => r.vehicle_id) || []);
        availableVehicles = availableVehicles.filter(v => !rentedVehicleIds.has(v.id));
      }

      return new Response(
        JSON.stringify({
          model,
          vehicles: availableVehicles,
          total_available: availableVehicles.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET VEHICLE DETAIL
    if (action === "get_vehicle") {
      const { vehicle_id } = body;

      if (!vehicle_id) {
        return new Response(
          JSON.stringify({ error: "vehicle_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          model:vehicle_models(*)
        `)
        .eq("id", vehicle_id)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // CREATE RENTAL
    if (action === "create_rental") {
      const { vehicle_id, customer_id, user_id, start_date, end_date, rental_type, pickup_location, return_location, created_by } = body;

      if (!vehicle_id || !start_date || !end_date) {
        return new Response(
          JSON.stringify({ error: "vehicle_id, start_date, end_date required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!customer_id && !user_id) {
        return new Response(
          JSON.stringify({ error: "customer_id or user_id required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Get vehicle with model
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select(`*, model:vehicle_models(*)`)
        .eq("id", vehicle_id)
        .single();

      if (!vehicle) {
        return new Response(
          JSON.stringify({ error: "Vehicle not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      if (vehicle.status !== "available") {
        return new Response(
          JSON.stringify({ error: "Vehicle not available" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check for overlapping rentals
      const { data: overlapping } = await supabase
        .from("vehicle_rentals")
        .select("id")
        .eq("vehicle_id", vehicle_id)
        .in("status", ["pending", "confirmed", "active"])
        .or(`start_date.lte.${end_date},end_date.gte.${start_date}`);

      if (overlapping && overlapping.length > 0) {
        return new Response(
          JSON.stringify({ error: "Vehicle already booked for selected dates" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Calculate price
      const days = calculateDays(start_date, end_date);
      let basePrice = 0;
      let finalRentalType = rental_type || "daily";

      if (days >= 30 && vehicle.model.price_per_month) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        basePrice = (months * vehicle.model.price_per_month) + (remainingDays * vehicle.model.price_per_day);
        finalRentalType = "monthly";
      } else if (days >= 7 && vehicle.model.price_per_week) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        basePrice = (weeks * vehicle.model.price_per_week) + (remainingDays * vehicle.model.price_per_day);
        finalRentalType = "weekly";
      } else {
        basePrice = days * vehicle.model.price_per_day;
        finalRentalType = "daily";
      }

      const rentalNumber = generateRentalNumber();

      // Create rental
      const { data: rental, error } = await supabase
        .from("vehicle_rentals")
        .insert([{
          rental_number: rentalNumber,
          vehicle_id,
          customer_id,
          user_id,
          start_date,
          end_date,
          rental_type: finalRentalType,
          base_price: basePrice,
          total_amount: basePrice,
          pickup_location,
          return_location,
          status: "pending",
          payment_status: "pending",
          created_by: created_by || user_id
        }])
        .select()
        .single();

      if (error) throw error;

      // Update vehicle status to reserved
      await supabase
        .from("vehicles")
        .update({ status: "reserved" })
        .eq("id", vehicle_id);

      return new Response(
        JSON.stringify({
          success: true,
          rental,
          price_breakdown: {
            days,
            rental_type: finalRentalType,
            base_price: basePrice,
            total: basePrice
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET RENTALS
    if (action === "get_rentals") {
      const { filters, user_id, customer_id } = body;

      let query = supabase
        .from("vehicle_rentals")
        .select(`
          *,
          vehicle:vehicles(*, model:vehicle_models(*)),
          customer:customers(name, email, phone),
          user:users(name, email)
        `)
        .order("created_at", { ascending: false });

      if (user_id) {
        query = query.eq("user_id", user_id);
      }
      if (customer_id) {
        query = query.eq("customer_id", customer_id);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.date_from) {
        query = query.gte("start_date", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("end_date", filters.date_to);
      }
      if (filters?.model_id) {
        query = query.eq("vehicle.model_id", filters.model_id);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // UPDATE RENTAL STATUS
    if (action === "update_rental_status") {
      const { rental_id, status } = body;

      if (!rental_id || !status) {
        return new Response(
          JSON.stringify({ error: "rental_id and status required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: rental } = await supabase
        .from("vehicle_rentals")
        .select("vehicle_id, status")
        .eq("id", rental_id)
        .single();

      if (!rental) {
        return new Response(
          JSON.stringify({ error: "Rental not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Update rental
      const { data, error } = await supabase
        .from("vehicle_rentals")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", rental_id)
        .select()
        .single();

      if (error) throw error;

      // Update vehicle status based on rental status
      let vehicleStatus = "available";
      if (status === "confirmed" || status === "pending") {
        vehicleStatus = "reserved";
      } else if (status === "active") {
        vehicleStatus = "rented";
      }

      await supabase
        .from("vehicles")
        .update({ status: vehicleStatus })
        .eq("id", rental.vehicle_id);

      return new Response(
        JSON.stringify({ success: true, rental: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("Rental system error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
