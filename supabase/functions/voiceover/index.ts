import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VoiceoverRequest {
  text: string;
  businessId: string;
  userId: string;
  voiceId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, businessId, userId, voiceId } = await req.json() as VoiceoverRequest;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY") ?? "";

    if (!elevenlabsApiKey) {
      return new Response(
        JSON.stringify({
          error: "ElevenLabs API key is not configured. Please set ELEVENLABS_API_KEY in the environment.",
          message: "Voiceover generation requires ElevenLabs API key configuration.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const selectedVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default voice: Rachel

    // Call ElevenLabs TTS API
    const elevenlabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`;
    const ttsResponse = await fetch(elevenlabsUrl, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error (${ttsResponse.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get audio as ArrayBuffer
    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const fileName = `voiceovers/${businessId}/${Date.now()}.mp3`;

    const { error: uploadError } = await adminClient.storage
      .from("payment-proofs")
      .upload(fileName, audioBytes, { contentType: "audio/mpeg" });

    if (uploadError) {
      // Fallback: store in a different bucket
      const { error: uploadError2 } = await adminClient.storage
        .from("knowledge-files")
        .upload(fileName, audioBytes, { contentType: "audio/mpeg" });

      if (uploadError2) {
        return new Response(
          JSON.stringify({ error: "Failed to store audio file" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Get public URL
    const bucket = uploadError ? "knowledge-files" : "payment-proofs";
    const { data: urlData } = adminClient.storage.from(bucket).getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        audioUrl: urlData.publicUrl,
        voiceId: selectedVoiceId,
        model: "eleven_multilingual_v2",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
