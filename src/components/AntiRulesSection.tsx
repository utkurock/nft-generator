"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export function AntiRulesSection() {
  const layers = useStore((s) => s.layers);
  const antiRules = useStore((s) => s.antiRules);
  const addAntiRule = useStore((s) => s.addAntiRule);
  const removeAntiRule = useStore((s) => s.removeAntiRule);

  const [layer1Id, setLayer1Id] = useState<number | "">("");
  const [asset1Name, setAsset1Name] = useState<string>("");
  const [layer2Id, setLayer2Id] = useState<number | "">("");
  const [asset2Name, setAsset2Name] = useState<string>("");

  const layer1 = layers.find((l) => l.id === layer1Id);
  const layer2 = layers.find((l) => l.id === layer2Id);

  const handleAdd = () => {
    if (!layer1Id || !asset1Name || !layer2Id || !asset2Name) {
      alert("Please fill all fields.");
      return;
    }
    if (layer1Id === layer2Id) {
      alert("Cannot select two assets from the same layer.");
      return;
    }
    const ok = addAntiRule({
      layer1Id: layer1Id as number,
      asset1Name,
      layer2Id: layer2Id as number,
      asset2Name,
    });
    if (!ok) {
      alert("This rule already exists.");
      return;
    }
    setAsset1Name("");
    setAsset2Name("");
  };

  const selectClass =
    "rounded-md border border-border bg-panel-2 px-2.5 py-1.5 text-sm text-cream outline-none focus:border-gold disabled:opacity-40";

  return (
    <section className="rounded-xl border border-border bg-panel/80 p-6 shadow-sm backdrop-blur-sm">
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-sm uppercase tracking-widest text-gold">
          ⟶ Forbidden Combinations
        </h2>
        <span className="text-xs text-cream-dim">
          these traits cannot appear together in the same NFT — Random tier only
        </span>
      </header>

      {antiRules.length === 0 ? (
        <div className="py-2 font-display text-[10px] uppercase tracking-widest text-cream-dim">
          No forbidden rules added yet
        </div>
      ) : (
        <div className="mb-3 space-y-2">
          {antiRules.map((rule, i) => {
            const l1 = layers.find((l) => l.id === rule.layer1Id);
            const l2 = layers.find((l) => l.id === rule.layer2Id);
            return (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-panel-2/60 px-4 py-2.5 text-sm text-cream"
              >
                <span>
                  <strong className="text-gold">{l1?.name ?? "?"}</strong>: {rule.asset1Name}
                </span>
                <span className="font-display text-[10px] uppercase tracking-widest text-danger">
                  ✕ cannot combine ✕
                </span>
                <span>
                  <strong className="text-gold">{l2?.name ?? "?"}</strong>: {rule.asset2Name}
                </span>
                <button
                  className="ml-auto rounded-full border border-danger bg-base px-3 py-1 font-display text-[10px] uppercase tracking-wider text-danger transition hover:bg-danger hover:text-cream"
                  onClick={() => removeAntiRule(i)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectClass}
          value={layer1Id}
          onChange={(e) => {
            setLayer1Id(e.target.value ? parseInt(e.target.value) : "");
            setAsset1Name("");
          }}
        >
          <option value="">Layer 1</option>
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={asset1Name}
          onChange={(e) => setAsset1Name(e.target.value)}
          disabled={!layer1}
        >
          <option value="">Asset 1</option>
          {layer1?.assets.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
        <span className="font-display text-sm text-danger">✕</span>
        <select
          className={selectClass}
          value={layer2Id}
          onChange={(e) => {
            setLayer2Id(e.target.value ? parseInt(e.target.value) : "");
            setAsset2Name("");
          }}
        >
          <option value="">Layer 2</option>
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={asset2Name}
          onChange={(e) => setAsset2Name(e.target.value)}
          disabled={!layer2}
        >
          <option value="">Asset 2</option>
          {layer2?.assets.map((a) => (
            <option key={a.name} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-full border border-amber-arcade bg-base px-4 py-1.5 font-display text-[10px] uppercase tracking-widest text-amber-arcade transition hover:bg-amber-arcade hover:text-base"
          onClick={handleAdd}
        >
          Add Rule
        </button>
      </div>
    </section>
  );
}
