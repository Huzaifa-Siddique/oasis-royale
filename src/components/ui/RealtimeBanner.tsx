"use client";

import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { WifiOff, AlertTriangle } from "lucide-react";

type Props = { status: string | null };

export default function RealtimeBanner({ status }: Props) {
  if (!status || status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) return null;

  const icon = status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR
    ? AlertTriangle : WifiOff;
  const label = status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR
    ? "Realtime error — using polling fallback"
    : status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
    ? "Realtime timed out — retrying…"
    : "Reconnecting…";

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg mb-4">
      {icon === WifiOff ? <WifiOff className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </div>
  );
}
