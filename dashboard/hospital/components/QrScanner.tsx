"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (text: string) => void;
  active?: boolean;
}

export function QrScanner({ onScan, active = true }: QrScannerProps) {
  const regionId = useRef(`qr-${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const lastScan = useRef("");

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (decoded === lastScan.current) return;
            lastScan.current = decoded;
            onScan(decoded.trim());
          },
          () => {}
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Camera access failed");
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().catch(() => {});
      }
    };
  }, [active, onScan]);

  return (
    <div className="space-y-3">
      <div
        id={regionId.current}
        className="w-full max-w-sm mx-auto rounded-xl overflow-hidden border border-slate-200 bg-black min-h-[240px]"
      />
      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {error}. You can enter the patient access ID manually below.
        </p>
      )}
    </div>
  );
}
