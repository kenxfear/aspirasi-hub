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
    let fontSize = 42;
    if (safe.length > 500) fontSize = 26;
    else if (safe.length > 360) fontSize = 30;
    else if (safe.length > 220) fontSize = 34;
    else if (safe.length > 120) fontSize = 38;

    const maxChars = Math.max(20, Math.floor(920 / (fontSize * 0.5)));
    let lines = wrapText(safe, maxChars);

    const maxLines = 18;
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = last.replace(/\.*$/, "").slice(0, Math.max(0, maxChars - 3)) + "...";
    }

    const lineHeight = Math.floor(fontSize * 1.4);
    const contentHeight = lineHeight * lines.length;
    const startY = 540 - Math.floor(contentHeight / 2) + lineHeight;

    const tspans = lines
      .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : lineHeight}" xml:space="preserve">${line}</tspan>`)
      .join("");

    // Viral-worthy Instagram design with trendy elements
    const svg = `
      <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Vibrant gradient backgrounds -->
          <linearGradient id="mainGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FF6B9D" />
            <stop offset="25%" stop-color="#C06CEA" />
            <stop offset="50%" stop-color="#8E54E9" />
            <stop offset="75%" stop-color="#4776E6" />
            <stop offset="100%" stop-color="#8E54E9" />
          </linearGradient>
          
          <linearGradient id="accent1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFD89B" />
            <stop offset="100%" stop-color="#19547B" />
          </linearGradient>
          
          <linearGradient id="accent2" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stop-color="#FC466B" />
            <stop offset="100%" stop-color="#3F5EFB" />
          </linearGradient>
          
          <linearGradient id="textShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.9" />
            <stop offset="50%" stop-color="#fff" stop-opacity="1" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0.9" />
          </linearGradient>
          
          <radialGradient id="spotlight" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#fff" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </radialGradient>
          
          <!-- Filters for effects -->
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="shadow">
            <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="0.5"/>
          </filter>
          
          <!-- Pattern untuk texture -->
          <pattern id="noise" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="#000" opacity="0.03"/>
            <circle cx="20" cy="20" r="1" fill="#fff" opacity="0.1"/>
            <circle cx="60" cy="40" r="1" fill="#fff" opacity="0.1"/>
            <circle cx="40" cy="80" r="1" fill="#fff" opacity="0.1"/>
          </pattern>
        </defs>

        <!-- Base gradient background -->
        <rect width="1080" height="1080" fill="url(#mainGrad)" />
        
        <!-- Spotlight effect -->
        <circle cx="540" cy="540" r="600" fill="url(#spotlight)" />
        
        <!-- Animated circles (decorative orbs) -->
        <circle cx="200" cy="200" r="250" fill="#FFD89B" opacity="0.15" filter="url(#glow)" />
        <circle cx="880" cy="250" r="200" fill="#FC466B" opacity="0.12" filter="url(#glow)" />
        <circle cx="150" cy="850" r="220" fill="#3F5EFB" opacity="0.13" filter="url(#glow)" />
        <circle cx="900" cy="880" r="260" fill="#C06CEA" opacity="0.14" filter="url(#glow)" />
        
        <!-- Floating stars and sparkles -->
        <g opacity="0.6" fill="#fff">
          <!-- Big stars -->
          <path d="M 250 150 L 255 165 L 270 170 L 255 175 L 250 190 L 245 175 L 230 170 L 245 165 Z" filter="url(#glow)"/>
          <path d="M 820 200 L 825 215 L 840 220 L 825 225 L 820 240 L 815 225 L 800 220 L 815 215 Z" filter="url(#glow)"/>
          <path d="M 180 750 L 185 765 L 200 770 L 185 775 L 180 790 L 175 775 L 160 770 L 175 765 Z" filter="url(#glow)"/>
          <path d="M 900 780 L 905 795 L 920 800 L 905 805 L 900 820 L 895 805 L 880 800 L 895 795 Z" filter="url(#glow)"/>
          
          <!-- Small sparkles -->
          <circle cx="350" cy="280" r="3" filter="url(#glow)"/>
          <circle cx="730" cy="320" r="2.5" filter="url(#glow)"/>
          <circle cx="280" cy="600" r="3.5" filter="url(#glow)"/>
          <circle cx="800" cy="650" r="2" filter="url(#glow)"/>
          <circle cx="450" cy="850" r="3" filter="url(#glow)"/>
          <circle cx="650" cy="180" r="2.5" filter="url(#glow)"/>
        </g>
        
        <!-- Geometric shapes floating -->
        <g opacity="0.12" fill="#fff">
          <rect x="100" y="400" width="40" height="40" rx="5" transform="rotate(25 120 420)"/>
          <rect x="940" y="500" width="35" height="35" rx="5" transform="rotate(-20 957 517)"/>
          <polygon points="200,650 220,680 180,680" filter="url(#glow)"/>
          <polygon points="880,350 900,380 860,380" filter="url(#glow)"/>
        </g>
        
        <!-- Noise texture overlay -->
        <rect width="1080" height="1080" fill="url(#noise)" />
        
        <!-- Main content card with glassmorphism -->
        <rect x="60" y="${startY - lineHeight - 90}" width="960" height="${contentHeight + 180}" 
          rx="45" 
          fill="rgba(255, 255, 255, 0.12)" 
          stroke="url(#textShine)" 
          stroke-width="2.5"
          filter="url(#shadow)" />
        
        <!-- Inner glow border -->
        <rect x="68" y="${startY - lineHeight - 82}" width="944" height="${contentHeight + 164}" 
          rx="41" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.3)" 
          stroke-width="1" />
        
        <!-- Top decorative bar with gradient -->
        <rect x="60" y="${startY - lineHeight - 90}" width="960" height="10" rx="45" 
          fill="url(#accent1)" opacity="0.8" filter="url(#glow)" />
        
        <!-- Badge/label decoration -->
        <rect x="420" y="${startY - lineHeight - 120}" width="240" height="50" rx="25"
          fill="rgba(255, 255, 255, 0.25)" 
          stroke="rgba(255, 255, 255, 0.4)" 
          stroke-width="1.5"
          filter="url(#shadow)" />
        <text x="540" y="${startY - lineHeight - 85}" 
          font-family="'Inter', 'SF Pro Display', Arial, sans-serif" 
          font-size="24" 
          font-weight="700"
          fill="#fff" 
          text-anchor="middle"
          filter="url(#strongGlow)">✨ ASPIRASI SISWA ✨</text>
        
        <!-- Large quote marks with strong glow -->
        <text x="110" y="${startY - 30}" 
          font-family="Georgia, serif" 
          font-size="160" 
          fill="url(#accent2)" 
          opacity="0.35" 
          font-weight="bold"
          filter="url(#strongGlow)">"</text>
        <text x="970" y="${startY + contentHeight + 60}" 
          font-family="Georgia, serif" 
          font-size="160" 
          fill="url(#accent2)" 
          opacity="0.35" 
          font-weight="bold" 
          text-anchor="end"
          filter="url(#strongGlow)">"</text>
        
        <!-- Main aspiration text with premium styling -->
        <text x="540" y="${startY}" 
          text-anchor="middle" 
          font-family="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, Arial, sans-serif"
          font-size="${fontSize}" 
          fill="url(#textShine)" 
          letter-spacing="0.4"
          filter="url(#strongGlow)"
          font-weight="700">
          ${tspans}
        </text>
        
        <!-- Bottom decorative elements -->
        <g opacity="0.7">
          <circle cx="480" cy="${startY + contentHeight + 100}" r="4" fill="#fff" filter="url(#glow)"/>
          <circle cx="540" cy="${startY + contentHeight + 100}" r="4" fill="#fff" filter="url(#glow)"/>
          <circle cx="600" cy="${startY + contentHeight + 100}" r="4" fill="#fff" filter="url(#glow)"/>
        </g>
        
        <!-- Shine effect line -->
        <rect x="200" y="${startY + contentHeight + 120}" width="680" height="2" rx="1" 
          fill="url(#textShine)" opacity="0.5" filter="url(#glow)" />
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
