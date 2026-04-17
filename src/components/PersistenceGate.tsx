"use client";

import { useEffect, useRef } from "react";
import { loadProject, saveProject } from "@/lib/db";
import { useStore } from "@/lib/store";

export function PersistenceGate({ children }: { children: React.ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const setHydrated = useStore((s) => s.setHydrated);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadProject().then((data) => {
      if (cancelled) return;
      if (data) {
        setHydrated(data);
      } else {
        setHydrated({});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const unsub = useStore.subscribe((state, prev) => {
      if (!state.hydrated) return;
      if (
        state.settings === prev.settings &&
        state.layers === prev.layers &&
        state.legendaryAssets === prev.legendaryAssets &&
        state.antiRules === prev.antiRules &&
        state.layerIdCounter === prev.layerIdCounter
      ) {
        return;
      }
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        void saveProject({
          settings: state.settings,
          layers: state.layers,
          legendaryAssets: state.legendaryAssets,
          antiRules: state.antiRules,
          layerIdCounter: state.layerIdCounter,
        });
      }, 400);
    });
    return () => unsub();
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-display text-sm uppercase tracking-widest text-gold">
          Loading...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
