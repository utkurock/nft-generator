"use client";

import { useState } from "react";

interface Item {
  q: string;
  a: React.ReactNode;
}

const EXAMPLE_META = `{
  "name": "My Collection #42",
  "description": "A unique NFT collection",
  "image": "images/42.jpg",
  "edition": 42,
  "date": 1712345678901,
  "attributes": [
    { "trait_type": "Tier",       "value": "Random" },
    { "trait_type": "Background", "value": "Blue"   },
    { "trait_type": "Body",       "value": "Alien"  },
    { "trait_type": "Eyes",       "value": "Lazer"  },
    { "trait_type": "Hat",        "value": "Crown"  }
  ],
  "properties": {
    "edition": 42,
    "total_supply": 2222,
    "tier": "Random",
    "rarity_score": 847.23,
    "trait_details": [
      {
        "trait_type": "Hat",
        "value": "Crown",
        "count": 22,
        "percentage": "0.99%",
        "rarity": "Ultra Rare"
      }
    ]
  }
}`;

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[12px] text-gold">
    {children}
  </code>
);

const items: Item[] = [
  {
    q: "What does output metadata look like?",
    a: (
      <div className="space-y-3">
        <p>
          Each NFT gets a JSON file in <Code>metadata/&lt;n&gt;.json</Code>. The
          format is OpenSea / ERC-721 compatible:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-base p-4 font-mono text-[12px] leading-relaxed text-cream">
          {EXAMPLE_META}
        </pre>
        <p>The ZIP also includes:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <Code>_metadata.json</Code> — all NFT metadata in a single array
          </li>
          <li>
            <Code>_collection.json</Code> — collection summary with tier
            breakdown and rarity ranking
          </li>
        </ul>
      </div>
    ),
  },
  {
    q: "How do layer names become metadata?",
    a: (
      <div className="space-y-2">
        <p>
          Each layer name becomes a <Code>trait_type</Code> in the NFT
          attributes. If you name a layer <Code>Background</Code>, every NFT
          will have an attribute like{" "}
          <Code>{`{ "trait_type": "Background", "value": "..." }`}</Code>.
        </p>
        <p>
          Name your layers exactly how you want them to appear on marketplaces
          — no renaming after mint. Use clear, consistent names:{" "}
          <Code>Background</Code>, <Code>Body</Code>, <Code>Eyes</Code>,{" "}
          <Code>Hat</Code>, etc.
        </p>
      </div>
    ),
  },
  {
    q: "Do image file names matter?",
    a: (
      <div className="space-y-2">
        <p>
          <strong className="text-gold">Yes, crucially.</strong> The file name
          (without <Code>.png</Code>) becomes the <Code>value</Code> in
          metadata.
        </p>
        <p>
          Upload <Code>Golden.png</Code> into the <Code>Hat</Code> layer and
          every NFT with that hat gets{" "}
          <Code>{`{ "trait_type": "Hat", "value": "Golden" }`}</Code>.
        </p>
        <p>
          You can rename assets <strong className="text-cream">after</strong>{" "}
          upload by clicking the name field under each image. Before generating,
          double-check naming — typos show up as traits.
        </p>
      </div>
    ),
  },
  {
    q: "What's the layer order for?",
    a: (
      <div className="space-y-2">
        <p>
          Layers render bottom-to-top. <Code>#1</Code> is the bottom (drawn
          first, visually behind), the last layer is the top (drawn last,
          visually in front).
        </p>
        <p>
          Typical stack: <Code>Background</Code> → <Code>Body</Code> →{" "}
          <Code>Clothing</Code> → <Code>Eyes</Code> → <Code>Hat</Code>.
        </p>
      </div>
    ),
  },
  {
    q: "How does rarity work?",
    a: (
      <div className="space-y-2">
        <p>
          Each asset has a rarity % between 0 and 100. All assets in a layer
          (plus the <Code>None</Code> slot if Optional is on) must sum to{" "}
          <Code>100%</Code>.
        </p>
        <p>
          Distribution is proportional: a trait at 10% rarity will appear in ~10%
          of the random NFTs (before anti-rule filtering).
        </p>
      </div>
    ),
  },
  {
    q: "What is 'Optional' on a layer?",
    a: (
      <p>
        Marks the layer as skippable — some NFTs will have no asset from this
        layer, shown as <Code>{`{ "value": "None" }`}</Code> in metadata. The{" "}
        <Code>None</Code> slot has its own rarity percentage.
      </p>
    ),
  },
  {
    q: "What are Legendary (1/1) NFTs?",
    a: (
      <p>
        Pre-made, unique, hand-crafted full images. They&apos;re not composed
        from layers — you upload the final art. Each one is singular (1/1) and
        gets its own metadata entry with{" "}
        <Code>{`"is_one_of_one": true`}</Code>. Numbering starts from your Start
        Number and continues into the random tier.
      </p>
    ),
  },
  {
    q: "What's 'Max Unique'?",
    a: (
      <p>
        The theoretical maximum of unique NFTs possible with your current layers
        and anti-rules, calculated as{" "}
        <Code>legendary + (∏ layer sizes) − forbidden combinations</Code>. If
        your Total Supply exceeds this, the warning banner appears — add more
        assets, more layers, or lower the supply.
      </p>
    ),
  },
  {
    q: "How do forbidden combinations work?",
    a: (
      <p>
        Pick two assets from two different layers that must never appear on the
        same NFT (e.g., <Code>Golden Hat</Code> ✕ <Code>Sunglasses</Code>). The
        generator skips any combination matching a rule. Only applies to the
        Random tier.
      </p>
    ),
  },
  {
    q: "What image formats are supported?",
    a: (
      <p>
        Input: <Code>PNG</Code> only (transparent backgrounds recommended so
        layers blend). Output: <Code>JPG</Code> at 85% quality for smaller ZIP
        size. Canvas size is controlled by the <Code>Image Width/Height</Code>{" "}
        settings.
      </p>
    ),
  },
  {
    q: "Is anything uploaded to a server?",
    a: (
      <p>
        No. Everything runs in your browser — file reading, canvas compositing,
        metadata generation, ZIP bundling. Your assets never leave your
        machine. Your project state is saved locally via IndexedDB and
        restores when you revisit.
      </p>
    ),
  },
];

function FAQItem({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel/80 shadow-sm backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-panel-2/40"
      >
        <span className="font-display text-xs uppercase tracking-wider text-cream">
          {item.q}
        </span>
        <span
          className={`font-display text-lg text-gold transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <div className="border-t border-border bg-panel-2/40 px-5 py-4 text-sm leading-relaxed text-cream-dim">
          {item.a}
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-sm uppercase tracking-widest text-gold">
          ⟶ FAQ
        </h2>
        <span className="text-xs text-cream-dim">
          metadata · naming · behavior · output
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <FAQItem key={i} item={item} />
        ))}
      </div>
    </section>
  );
}
