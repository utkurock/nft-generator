"use client";

import { useStore } from "@/lib/store";

const fieldClass =
  "w-full rounded-md border border-border bg-panel-2 px-3 py-2 text-sm text-cream outline-none transition focus:border-gold";
const labelClass =
  "block font-display text-[10px] uppercase tracking-widest text-cream-dim mb-1.5";

export function SettingsPanel() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  return (
    <section className="rounded-xl border border-border bg-panel/80 p-6 shadow-sm backdrop-blur-sm">
      <h2 className="mb-4 font-display text-sm uppercase tracking-widest text-gold">
        ⟶ Collection Settings
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass}>Collection Name</label>
          <input
            className={fieldClass}
            value={settings.collectionName}
            onChange={(e) => updateSettings({ collectionName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            className={fieldClass}
            value={settings.collectionDesc}
            onChange={(e) => updateSettings({ collectionDesc: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Total Supply</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={settings.totalSupply}
            onChange={(e) =>
              updateSettings({ totalSupply: parseInt(e.target.value) || 1 })
            }
          />
        </div>
        <div>
          <label className={labelClass}>Start Number</label>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={settings.startNumber}
            onChange={(e) =>
              updateSettings({ startNumber: parseInt(e.target.value) || 1 })
            }
          />
        </div>
        <div>
          <label className={labelClass}>Image Width (px)</label>
          <input
            type="number"
            min={100}
            className={fieldClass}
            value={settings.imgWidth}
            onChange={(e) =>
              updateSettings({ imgWidth: parseInt(e.target.value) || 1000 })
            }
          />
        </div>
        <div>
          <label className={labelClass}>Image Height (px)</label>
          <input
            type="number"
            min={100}
            className={fieldClass}
            value={settings.imgHeight}
            onChange={(e) =>
              updateSettings({ imgHeight: parseInt(e.target.value) || 1000 })
            }
          />
        </div>
      </div>
    </section>
  );
}
