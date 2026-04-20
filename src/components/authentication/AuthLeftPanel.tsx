export default function AuthLeftPanel() {
  return (
    <div className="relative bg-primary flex flex-col justify-between overflow-hidden min-h-[560px] p-10">

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Fade overlay so dots fade into content */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{ background: "linear-gradient(to top, #022b53 60%, transparent)" }}
      />

      {/* Concentric arch rings */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full border border-white/[0.07]" />
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full border border-white/[0.07]" />
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border border-white/[0.07]" />

      {/* Large watermark */}
      <span
        className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif font-light select-none pointer-events-none whitespace-nowrap"
        style={{ fontSize: "88px", color: "rgba(255,255,255,0.04)", letterSpacing: "0.1em" }}
      >
        EVENUE
      </span>

      {/* Top labels */}
      <div className="relative z-10 flex justify-between items-start">
        <span className="text-[9px] tracking-[0.18em] uppercase text-white/30">Venue Booking</span>
        <span className="text-[9px] tracking-[0.18em] uppercase text-white/30">PH</span>
      </div>

      {/* Bottom content */}
      <div className="relative z-10 space-y-5">
        <div className="w-7 h-px bg-white/25" />

        <p className="font-serif text-white text-[26px] font-light italic leading-[1.3]">
          Your event deserves a space as special as the moment.
        </p>

        <p className="text-[10px] tracking-[0.18em] uppercase text-white/28 leading-relaxed">

          Browse, compare &amp; book with confidence.
        </p>

        <div className="flex flex-wrap gap-1.5">
          <div className="inline-flex items-center gap-1.5 border border-white/10 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px] text-white/38">100+ venues</span>
          </div>
          <div className="inline-flex items-center gap-1.5 border border-white/10 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] text-white/38">Nationwide</span>
          </div>
        </div>
      </div>

    </div>
  )
}