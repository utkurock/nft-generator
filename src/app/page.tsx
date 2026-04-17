import { AntiRulesSection } from "@/components/AntiRulesSection";
import { FAQ } from "@/components/FAQ";
import { GenerateSection } from "@/components/GenerateSection";
import { LegendarySection } from "@/components/LegendarySection";
import { LayersList } from "@/components/LayersList";
import { PersistenceGate } from "@/components/PersistenceGate";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TierStats } from "@/components/TierStats";

export default function Home() {
  return (
    <PersistenceGate>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-bold text-cream">
                NFT<span className="text-gold">.GEN</span>
              </h1>
              <span className="rounded-full border border-gold bg-base px-3 py-0.5 font-display text-[10px] uppercase tracking-wider text-gold">
                OPEN SOURCE
              </span>
            </div>
            <p className="mt-2 font-display text-xs uppercase tracking-widest text-cream-dim">
              Layered · Rarity-weighted NFT collection generator
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border-strong bg-base px-5 py-2 font-display text-xs uppercase tracking-wider text-cream transition hover:border-gold hover:text-gold"
            >
              GitHub →
            </a>
          </div>
        </header>

        <main className="space-y-6">
          <SettingsPanel />
          <TierStats />
          <LegendarySection />
          <LayersList />
          <AntiRulesSection />
          <GenerateSection />
          <FAQ />
        </main>

        <footer className="mt-10 border-t border-border pt-6 pb-4 text-center font-display text-[10px] uppercase tracking-widest text-cream-dim">
          All processing happens locally in your browser · Images are never uploaded
        </footer>
      </div>
    </PersistenceGate>
  );
}
