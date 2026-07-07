export function AmbientGrid({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div
        className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.68 0.18 250 / 0.25), transparent 60%)",
        }}
      />
      <div
        className="absolute right-[-200px] top-40 h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.82 0.16 195 / 0.22), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.82 0.16 195 / 0.5), transparent)",
        }}
      />
    </div>
  );
}
