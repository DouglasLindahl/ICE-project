"use client";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function QrCanvas({ text }: { text: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, text, { width: 200, margin: 1 });
  }, [text]);

  return (
    <canvas
      ref={ref}
      style={{ border: "2px solid #e5e7eb", padding: 12, borderRadius: 12 }}
    />
  );
}
