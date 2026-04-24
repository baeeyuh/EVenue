export default function AuthLeftPanel() {
  return (
    <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden bg-primary p-5 sm:min-h-[320px] sm:p-8 lg:min-h-[560px] lg:p-10">

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
  <div className="absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border border-white/[0.07] sm:-top-36 sm:h-72 sm:w-72 lg:-top-40 lg:h-80 lg:w-80" />
  <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border border-white/[0.07] sm:-top-24 sm:h-48 sm:w-48 lg:-top-28 lg:h-56 lg:w-56" />
  <div className="absolute -top-10 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full border border-white/[0.07] sm:-top-12 sm:h-24 sm:w-24 lg:-top-16 lg:h-32 lg:w-32" />

      {/* Large watermark */}
      <span
        className="pointer-events-none absolute left-1/2 top-[38%] hidden -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-serif text-[64px] font-light sm:block lg:text-[88px]"
        style={{ color: "rgba(255,255,255,0.04)", letterSpacing: "0.1em" }}
      >
        EVENUE
      </span>

      {/* Top labels */}
      <div className="relative z-10 flex justify-between items-start">
        <span className="text-[8px] uppercase tracking-[0.16em] text-white/30 sm:text-[9px] sm:tracking-[0.18em]">Venue Booking</span>
        <span className="text-[8px] uppercase tracking-[0.16em] text-white/30 sm:text-[9px] sm:tracking-[0.18em]">PH</span>
      </div>

      {/* Bottom content */}
      <div className="relative z-10 space-y-4 sm:space-y-5">
        <div className="w-7 h-px bg-white/25" />

        <p className="font-serif text-[20px] font-light italic leading-[1.3] text-white sm:text-[24px] lg:text-[26px]">
          Your event deserves a space as special as the moment.
        </p>

        <p className="text-[9px] uppercase leading-relaxed tracking-[0.15em] text-white/28 sm:text-[10px] sm:tracking-[0.18em]">

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