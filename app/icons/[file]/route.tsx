import { ImageResponse } from "next/og";

// App icons rendered once at build time: a white wallet on Apple's systemBlue gradient
// (same mark as the login screen). Full-bleed square — iOS and Android apply their own mask.
const ICONS: Record<string, { size: number; glyph: number; round?: boolean }> = {
  "32.png": { size: 32, glyph: 0.66, round: true }, // browser tab: no OS mask, so round it ourselves
  "192.png": { size: 192, glyph: 0.56 },
  "512.png": { size: 512, glyph: 0.56 },
  "maskable-512.png": { size: 512, glyph: 0.44 }, // stays inside the 80% maskable safe zone
  "apple-180.png": { size: 180, glyph: 0.56 },
};

export const dynamic = "force-static";
export const generateStaticParams = () => Object.keys(ICONS).map((file) => ({ file }));

export async function GET(_: Request, ctx: RouteContext<"/icons/[file]">) {
  const icon = ICONS[(await ctx.params).file];
  if (!icon) return new Response("Not found", { status: 404 });
  const g = Math.round(icon.size * icon.glyph);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0a84ff 0%, #0040dd 100%)",
          borderRadius: icon.round ? "22%" : 0,
        }}
      >
        <svg width={g} height={g} viewBox="0 0 24 24" fill="none">
          {/* wallet body, flap and clasp */}
          <rect x="2.5" y="5.5" width="19" height="14" rx="3.2" fill="white" />
          <path d="M5 5.5 L15.5 2.6 C16.6 2.3 17.6 3.1 17.6 4.2 V5.5" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="14.5" y="10.2" width="7" height="4.6" rx="2.3" fill="#0a6cff" />
          <circle cx="16.9" cy="12.5" r="1.05" fill="white" />
        </svg>
      </div>
    ),
    { width: icon.size, height: icon.size },
  );
}
