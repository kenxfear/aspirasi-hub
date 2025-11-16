import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXML(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? current + " " + w : w;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      if (w.length > maxChars) {
        const chunks = w.match(new RegExp(`.{1,${maxChars}}`, "g")) || [w];
        lines.push(...chunks.slice(0, -1));
        current = chunks[chunks.length - 1];
      } else {
        current = w;
      }
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
    );

    const { aspirationId } = await req.json();
    if (!aspirationId) throw new Error("aspirationId is required");

    const { data: aspiration, error } = await supabase
      .from("aspirations")
      .select("id, content, created_at")
      .eq("id", aspirationId)
      .single();

    if (error) throw error;
    if (!aspiration?.content) throw new Error("Aspiration not found or empty");

    const raw = String(aspiration.content).trim();
    const safe = escapeXML(raw);

    // Dynamic font size based on content length
    let fontSize = 44;
    if (safe.length > 500) fontSize = 28;
    else if (safe.length > 360) fontSize = 32;
    else if (safe.length > 220) fontSize = 36;

    const maxChars = Math.max(16, Math.floor(900 / (fontSize * 0.52)));
    let lines = wrapText(safe, maxChars);

    const maxLines = 16;
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = last.replace(/\.*$/, "").slice(0, Math.max(0, maxChars - 3)) + "...";
    }

    const lineHeight = Math.floor(fontSize * 1.35);
    const contentHeight = lineHeight * lines.length;
    const startY = 540 - Math.floor(contentHeight / 2) + lineHeight;

    const tspans = lines
      .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : lineHeight}" xml:space="preserve">${line}</tspan>`)
      .join("");

    // Clean, centered-only SVG design (no name/class/date)
    const svg = `
      <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1f1b2e" />
            <stop offset="50%" stop-color="#2b2442" />
            <stop offset="100%" stop-color="#1e2436" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stop-color="#6d5dfc" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#6d5dfc" stop-opacity="0" />
          </radialGradient>
        </defs>

        <rect width="1080" height="1080" fill="url(#bg)" />
        <circle cx="860" cy="280" r="240" fill="url(#glow)" />
        <circle cx="220" cy="820" r="260" fill="url(#glow)" />

        <text x="540" y="${startY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="${fontSize}" fill="#f7f7fb" letter-spacing="0.2" style="white-space: pre-line;">
          ${tspans}
        </text>
      </svg>
    `;

    return new Response(svg, {
      headers: { ...corsHeaders, "Content-Type": "image/svg+xml" },
    });
  } catch (error: any) {
    console.error("generate-instagram-design error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
