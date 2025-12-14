import { corsHeaders } from "@shared/cors.ts";
import { createClient } from "@shared/supabase-client.ts";

interface BookingRequest {
  action: string;
  facility_id?: string;
  user_id?: string;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  booking_type?: string;
  user_membership_id?: string;
  booked_by?: string;
  booking_ids?: string[];
  status?: string;
  filters?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    facility_id?: string;
  };
}

function generateBookingReference(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `BK${dateStr}-${random}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient();
    const body: BookingRequest = await req.json();
    const { action } = body;

    // GET FACILITIES
    if (action === "get_facilities") {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // GET AVAILABLE SLOTS
    if (action === "get_slots") {
      const { facility_id, booking_date } = body;
      if (!facility_id || !booking_date) {
        return new Response(
          JSON.stringify({ error: "facility_id and booking_date required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: facility } = await supabase
        .from("facilities")
        .select("*")
        .eq("id", facility_id)
        .single();

      if (!facility) {
        return new Response(
          JSON.stringify({ error: "Facility not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // For gym: per_visit (daily), return single slot
      if (facility.type === "gym") {
        const { data: existingBookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("facility_id", facility_id)
          .eq("booking_date", booking_date)
          .neq("status", "cancelled");

        const bookedCount = existingBookings?.length || 0;
        const available = bookedCount < facility.capacity;

        return new Response(
          JSON.stringify({
            facility,
            booking_type: "per_visit",
            slots: [{
              date: booking_date,
              available,
              booked_count: bookedCount,
              max_capacity: facility.capacity,
              price: facility.price_per_visit
            }]
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // For non-gym: per_hour slots
      const operatingHours = facility.operating_hours || { start: "06:00", end: "22:00" };
      const startHour = parseInt(operatingHours.start.split(":")[0]);
      const endHour = parseInt(operatingHours.end.split(":")[0]);

      const slots = [];
      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = `${hour.toString().padStart(2, "0")}:00`;
        const slotEnd = `${(hour + 1).toString().padStart(2, "0")}:00`;

        const { data: existingBookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("facility_id", facility_id)
          .eq("booking_date", booking_date)
          .eq("start_time", slotStart)
          .neq("status", "cancelled");

        const bookedCount = existingBookings?.length || 0;

        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          available: bookedCount < facility.capacity,
          booked_count: bookedCount,
          max_capacity: facility.capacity,
          price: facility.price_per_hour
        });
      }

      return new Response(
        JSON.stringify({ facility, booking_type: "per_hour", slots }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // CREATE BOOKING
    if (action === "create_booking") {
      const { facility_id, user_id, booking_date, start_time, end_time, booking_type, user_membership_id, booked_by } = body;

      if (!facility_id || !user_id || !booking_date) {
        return new Response(
          JSON.stringify({ error: "facility_id, user_id, booking_date required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data: facility } = await supabase
        .from("facilities")
        .select("*")
        .eq("id", facility_id)
        .single();

      if (!facility) {
        return new Response(
          JSON.stringify({ error: "Facility not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      let totalAmount = 0;
      let finalBookingType = booking_type || (facility.type === "gym" ? "per_visit" : "per_hour");
      let finalStartTime = start_time || "00:00";
      let finalEndTime = end_time || "23:59";

      // Calculate price
      if (finalBookingType === "per_visit") {
        totalAmount = facility.price_per_visit;
      } else if (finalBookingType === "per_hour") {
        const startHour = parseInt(finalStartTime.split(":")[0]);
        const endHour = parseInt(finalEndTime.split(":")[0]);
        const hours = endHour - startHour;
        totalAmount = facility.price_per_hour * hours;
      } else if (finalBookingType === "membership") {
        totalAmount = 0; // Membership booking is free
      }

      // Check membership if applicable
      if (user_membership_id) {
        const { data: membership } = await supabase
          .from("user_memberships")
          .select("*")
          .eq("id", user_membership_id)
          .eq("status", "active")
          .single();

        if (!membership) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired membership" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        if (membership.remaining_visits !== null && membership.remaining_visits <= 0) {
          return new Response(
            JSON.stringify({ error: "No remaining visits in membership" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Deduct visit
        if (membership.remaining_visits !== null) {
          await supabase
            .from("user_memberships")
            .update({ remaining_visits: membership.remaining_visits - 1 })
            .eq("id", user_membership_id);
        }

        finalBookingType = "membership";
        totalAmount = 0;
      }

      const bookingReference = generateBookingReference();

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert([{
          booking_reference: bookingReference,
          user_id,
          facility_id,
          booking_date,
          start_time: finalStartTime,
          end_time: finalEndTime,
          booking_type: finalBookingType,
          total_amount: totalAmount,
          status: "pending",
          booked_by: booked_by || user_id,
          user_membership_id
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, booking }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // GET BOOKINGS (with filters)
    if (action === "get_bookings") {
      const { filters, user_id } = body;
      let query = supabase
        .from("bookings")
        .select(`
          *,
          facility:facilities(name, type),
          user:users(name, email),
          booked_by_user:users!bookings_booked_by_fkey(name)
        `)
        .order("booking_date", { ascending: false });

      if (user_id) {
        query = query.eq("user_id", user_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.date_from) {
        query = query.gte("booking_date", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("booking_date", filters.date_to);
      }
      if (filters?.facility_id) {
        query = query.eq("facility_id", filters.facility_id);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // BULK UPDATE STATUS
    if (action === "bulk_update_status") {
      const { booking_ids, status } = body;

      if (!booking_ids || !Array.isArray(booking_ids) || booking_ids.length === 0) {
        return new Response(
          JSON.stringify({ error: "booking_ids array required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (!["confirmed", "cancelled", "completed", "no_show"].includes(status || "")) {
        return new Response(
          JSON.stringify({ error: "Invalid status" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("bookings")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", booking_ids)
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, updated: data?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // BULK DELETE
    if (action === "bulk_delete") {
      const { booking_ids } = body;

      if (!booking_ids || !Array.isArray(booking_ids) || booking_ids.length === 0) {
        return new Response(
          JSON.stringify({ error: "booking_ids array required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { error } = await supabase
        .from("bookings")
        .delete()
        .in("id", booking_ids);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, deleted: booking_ids.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );

  } catch (error) {
    console.error("Booking system error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
