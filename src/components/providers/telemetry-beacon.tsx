"use client";

import { useEffect } from "react";

type TelemetryPayload = {
  kind: "web_vital";
  name: string;
  value: number;
  path: string;
};

function send(payload: TelemetryPayload) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/telemetry", blob);
    return;
  }

  void fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  });
}

export function TelemetryBeacon() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
      return;
    }

    const pathname = window.location.pathname;
    const observers: PerformanceObserver[] = [];

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        send({
          kind: "web_vital",
          name: "LCP",
          value: last.startTime,
          path: pathname
        });
      }
    });

    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value ?? 0;
        }
      }

      send({
        kind: "web_vital",
        name: "CLS",
        value: clsValue,
        path: pathname
      });
    });

    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          send({
            kind: "web_vital",
            name: "FCP",
            value: entry.startTime,
            path: pathname
          });
        }
      }
    });

    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    clsObserver.observe({ type: "layout-shift", buffered: true });
    fcpObserver.observe({ type: "paint", buffered: true });

    observers.push(lcpObserver, clsObserver, fcpObserver);
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return null;
}
