"use client";
import { useEffect } from "react";
export default function Track({ name, props }: { name: string; props?: Record<string, string | number> }) {
  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, props }) }).catch(() => {});
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
