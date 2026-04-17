# NFT Generator

Open-source, browser-only NFT collection generator with layered traits, rarity
weighting, forbidden-combination rules, and a two-tier system
(`Legendary 1/1` and `Random`). Everything runs locally in your browser —
images and metadata never leave your machine.

## Features

- **Two-tier system** — hand-crafted `Legendary (1/1)` NFTs + `Random`
  rarity-weighted NFTs in a single collection.
- **Layered composition** — stack PNG layers, reorder them, preview each layer
  position (`Bottom` / `Middle` / `Top`).
- **Rarity weighting** — per-asset percentages, auto-distributed on upload,
  with a live 100% check.
- **Optional layers** — any layer can be skipped with a configurable `None`
  rarity.
- **Forbidden combinations** — block specific trait pairs from appearing
  together in the same NFT.
- **Unique combination guarantee** — duplicates are avoided, with a
  `Max Unique` counter that warns when supply exceeds what's possible.
- **OpenSea / ERC-721 compatible metadata** — per-NFT JSON plus a collection
  summary with rarity ranking.
- **Auto-save to IndexedDB** — project state (settings, layers, assets,
  rules) persists between sessions.
- **Fully client-side** — no backend, no uploads. Your assets never leave
  the browser.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- Zustand (state) · idb (IndexedDB) · JSZip (ZIP output)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm run start
```

## Deploy (Docker)

The project ships a multi-stage `Dockerfile` that runs the Next.js
`output: "standalone"` bundle. Any Docker host works — example flow for
[Coolify](https://coolify.io):

1. Create an Application → Public Repository and point it at the repo.
2. Set the build pack to **Dockerfile**.
3. Port: `3000`.
4. Add a domain from the Domains tab.
5. Deploy.

A simple `GET /` healthcheck is sufficient.

## Usage

1. **Settings** — collection name, description, image dimensions, total
   supply, start number.
2. **Legendary (1/1)** — upload fully hand-crafted PNGs. Each one is singular
   and numbered before the random tier.
3. **Layers** — add layers in rendering order (`#1` = bottom, last = top):
   - Drop PNGs into the layer's upload area.
   - Adjust rarity percentages (must sum to 100% per layer).
   - Toggle `Optional` to allow a `None` slot with its own rarity.
4. **Forbidden Combinations** — pick trait pairs from two layers that must
   never appear together.
5. **Generate** — download a ZIP containing all images and metadata.

## Output structure

```
MyCollection_NFT.zip
├── images/
│   ├── 1.jpg
│   ├── 2.jpg
│   └── ...
├── metadata/
│   ├── 1.json
│   ├── 2.json
│   └── ...
├── _metadata.json      # All NFT metadata in a single array
└── _collection.json    # Collection summary + rarity ranking
```

Each per-NFT JSON follows the OpenSea / ERC-721 attribute schema and adds
`properties.tier`, `properties.rarity_score`, and `properties.trait_details`
(count, percentage, rarity class) for downstream tooling.

## Contributing

Issues and pull requests are welcome. For substantial changes, please open
an issue first to discuss the approach.

## License

MIT — see [LICENSE](./LICENSE).
