// AI Signal Engine badge.
// The visible product surface is now model-agnostic. The underlying adapter (`lib/ai/index.ts → classify()`) is
// the single swap point — a real remote provider can be plugged in
// for demo builds without touching this component.
import { Sparkles } from "lucide-react";
import { AI_MODE } from "@/lib/ai";

export function AIBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-glass px-3 py-1 text-xs glass">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      <span className="font-mono uppercase tracking-wider text-foreground/90">
        AI Signal Engine
      </span>
      {!compact && (
        <span className="text-muted-foreground">
          • running in <span className="text-primary">{AI_MODE === "mock" ? "demo" : AI_MODE}</span>{" "}
          mode
        </span>
      )}
    </div>
  );
}
