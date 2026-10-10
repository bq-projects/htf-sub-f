import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "all";
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // Load all admin data
    if (req.method === "GET") {
      const [proofs, businesses, plans] = await Promise.all([
        adminClient.from("payment_proofs").select("*").order("created_at", { ascending: false }),
        adminClient.from("businesses").select(`
          id, name, industry, owner_id, onboarding_complete, created_at,
          profiles:owner_id(full_name),
          subscriptions(business_id, plan, status)
        `).order("created_at", { ascending: false }),
        adminClient.from("plan_config").select("*").order("sort_order", { ascending: true }),
      ]);

      const bizData = businesses.data ?? [];
      const uniqueUsers = new Set(bizData.map((b: { owner_id: string }) => b.owner_id));
      const proofData = proofs.data ?? [];
      const pending = proofData.filter((p: { status: string }) => p.status === "pending").length;
      const approved = proofData.filter((p: { status: string }) => p.status === "approved");
      const revenue = approved.reduce((sum: number, p: { amount_pkr: number | null }) => sum + (p.amount_pkr || 0), 0);

      return new Response(
        JSON.stringify({
          proofs: proofData,
          businesses: bizData,
          plans: plans.data ?? [],
          stats: {
            totalBusinesses: bizData.length,
            totalUsers: uniqueUsers.size,
            pendingPayments: pending,
            approvedPayments: approved.length,
            totalRevenue: revenue,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // POST actions: approve, reject, save_plan
    if (req.method === "POST") {
      if (action === "approve") {
        const { proofId, businessId, planKey } = body;
        await adminClient.from("payment_proofs")
          .update({ status: "approved", reviewed_at: new Date().toISOString() })
          .eq("id", proofId);
        await adminClient.from("subscriptions")
          .insert({
            business_id: businessId,
            plan: planKey,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        return new Response(
          JSON.stringify({ success: true, message: "Payment approved" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (action === "reject") {
        const { proofId, notes } = body;
        await adminClient.from("payment_proofs")
          .update({ status: "rejected", admin_notes: notes, reviewed_at: new Date().toISOString() })
          .eq("id", proofId);
        return new Response(
          JSON.stringify({ success: true, message: "Payment rejected" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (action === "save_plan") {
        const { id, plan_name, price_pkr, price_usd, max_businesses, max_knowledge_files, max_generations, features, is_active } = body;
        const { error } = await adminClient.from("plan_config")
          .update({
            plan_name, price_pkr, price_usd, max_businesses, max_knowledge_files,
            max_generations, features, is_active, updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ success: true, message: "Plan updated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
