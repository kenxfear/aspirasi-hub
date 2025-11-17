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

    // Modern, attractive Instagram design
    const svg = `
      <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f0c29" />
            <stop offset="50%" stop-color="#302b63" />
            <stop offset="100%" stop-color="#24243e" />
          </linearGradient>
          <linearGradient id="accent1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f093fb" />
            <stop offset="100%" stop-color="#f5576c" />
          </linearGradient>
          <linearGradient id="accent2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#4facfe" />
            <stop offset="100%" stop-color="#00f2fe" />
          </linearGradient>
          <linearGradient id="accent3" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#43e97b" />
            <stop offset="100%" stop-color="#38f9d7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="1080" height="1080" fill="url(#bg)" />
        
        <!-- Decorative circles with gradients -->
        <circle cx="120" cy="120" r="180" fill="url(#accent1)" opacity="0.15" filter="url(#glow)" />
        <circle cx="960" cy="200" r="220" fill="url(#accent2)" opacity="0.12" filter="url(#glow)" />
        <circle cx="900" cy="900" r="200" fill="url(#accent3)" opacity="0.15" filter="url(#glow)" />
        <circle cx="150" cy="880" r="160" fill="url(#accent1)" opacity="0.1" filter="url(#glow)" />
        
        <!-- Decorative geometric shapes -->
        <path d="M 80 500 L 120 520 L 100 560 L 60 540 Z" fill="url(#accent2)" opacity="0.3" />
        <path d="M 950 600 L 1000 580 L 1020 630 L 970 650 Z" fill="url(#accent3)" opacity="0.25" />
        <circle cx="200" cy="300" r="8" fill="url(#accent1)" opacity="0.6" />
        <circle cx="880" cy="450" r="6" fill="url(#accent2)" opacity="0.5" />
        <circle cx="150" cy="650" r="10" fill="url(#accent3)" opacity="0.4" />
        <circle cx="920" cy="750" r="7" fill="url(#accent1)" opacity="0.6" />
        
        <!-- Decorative lines -->
        <line x1="100" y1="400" x2="200" y2="400" stroke="url(#accent2)" stroke-width="2" opacity="0.3" />
        <line x1="880" y1="300" x2="980" y2="300" stroke="url(#accent3)" stroke-width="2" opacity="0.3" />
        
        <!-- Content container with subtle border -->
        <rect x="90" y="220" width="900" height="${contentHeight + 140}" rx="30" 
          fill="rgba(255, 255, 255, 0.03)" 
          stroke="url(#accent2)" 
          stroke-width="2" 
          opacity="0.4" />
        
        <!-- Top accent bar -->
        <rect x="90" y="220" width="900" height="8" rx="30" fill="url(#accent1)" opacity="0.8" />
        
        <!-- Quote marks decoration -->
        <text x="150" y="310" font-family="Georgia, serif" font-size="120" fill="url(#accent1)" opacity="0.25" font-weight="bold">"</text>
        <text x="880" y="${startY + contentHeight + 60}" font-family="Georgia, serif" font-size="120" fill="url(#accent3)" opacity="0.25" font-weight="bold" text-anchor="end">"</text>
        
        <!-- Main text with shadow effect -->
        <text x="540" y="${startY}" text-anchor="middle" 
          font-family="'Segoe UI', Arial, sans-serif"
          font-size="${fontSize}" 
          fill="#ffffff" 
          letter-spacing="0.5"
          filter="url(#shadow)"
          font-weight="500">
          ${tspans}
        </text>
        
        <!-- Bottom decorative element -->
        <rect x="440" y="${startY + contentHeight + 90}" width="200" height="4" rx="2" fill="url(#accent2)" opacity="0.6" />
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
