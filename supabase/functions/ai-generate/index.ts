import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  type: string;
  businessContext: string;
  instructions: string;
  businessId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { type, businessContext, instructions, businessId } = await req.json() as GenerateRequest;

    if (!type || !instructions) {
      return new Response(
        JSON.stringify({ error: "Type and instructions are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "Gemini API key is not configured. Please set GEMINI_API_KEY in Supabase secrets.",
          model: "none",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const typePrompts: Record<string, string> = {
      marketing: "You are an expert marketing copywriter. Generate engaging marketing content based on the business context and instructions. Create compelling, platform-appropriate content with hashtags and CTAs.",
      ad_creative: "You are an expert advertising copywriter. Generate ad creatives including headlines, primary text, descriptions, CTAs, and visual concepts based on the business context and instructions.",
      event: "You are an event marketing expert. Generate event promotional content for multiple platforms. Separate each platform's content with '---'. Include Facebook announcement, Instagram caption, LinkedIn post, and a reminder message.",
      voiceover_script: "You are a professional voiceover script writer. Create an engaging, professional voiceover script based on the business context and topic. Keep it under 200 words.",
    };

    const fullPrompt = `${typePrompts[type] || typePrompts.marketing}\n\nBusiness Context:\n${businessContext}\n\nInstructions:\n${instructions}\n\nGenerate professional, ready-to-use content:`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiResponse.status}): ${errText}`, model: "gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await geminiResponse.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Log usage
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (supabaseUrl && serviceRoleKey && businessId) {
      try {
        const adminClient = createClient(supabaseUrl, serviceRoleKey);
        await adminClient.from("usage_events").insert({
          business_id: businessId,
          user_id: "00000000-0000-0000-0000-000000000000",
          type,
          model_used: "gemini-2.0-flash",
        });
      } catch { /* non-critical */ }
    }

    return new Response(
      JSON.stringify({ response: content, model: "gemini-2.0-flash" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
