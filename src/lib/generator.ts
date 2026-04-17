"use client";

import JSZip from "jszip";
import type {
  AntiRule,
  Asset,
  Layer,
  LegendaryAsset,
  Settings,
  Tier,
} from "./types";

type Combo = Record<number, Asset | null>;

interface AttributeEntry {
  trait_type: string;
  value: string;
}

interface TraitDetail extends AttributeEntry {
  count: number;
  percentage: string;
  rarity: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  edition: number;
  date: number;
  attributes: AttributeEntry[];
  properties: {
    edition: number;
    total_supply: number;
    tier: Tier;
    rarity_score?: number;
    rarity_rank?: number;
    is_one_of_one?: boolean;
    trait_details?: TraitDetail[];
  };
}

export interface GenerationInput {
  settings: Settings;
  layers: Layer[];
  legendaryAssets: LegendaryAsset[];
  antiRules: AntiRule[];
}

export interface GenerationCallbacks {
  onProgress: (phase: string, current: number, total: number) => void;
  onPreview: (dataUrl: string, label: string, tier: Tier) => void;
  onZipProgress: (percent: number, phase: string) => void;
}

export class GenerationError extends Error {}

const pickAsset = (layer: Layer): Asset | null => {
  const rand = Math.random() * 100;
  let cum = 0;
  if (layer.optional) {
    cum += layer.noneRarity;
    if (rand < cum) return null;
  }
  for (const asset of layer.assets) {
    cum += asset.rarity;
    if (rand < cum) return asset;
  }
  return layer.assets[layer.assets.length - 1] ?? null;
};

const isComboForbidden = (combo: Combo, antiRules: AntiRule[]): boolean => {
  for (const rule of antiRules) {
    const a1 = combo[rule.layer1Id];
    const a2 = combo[rule.layer2Id];
    if (a1 && a2 && a1.name === rule.asset1Name && a2.name === rule.asset2Name) {
      return true;
    }
  }
  return false;
};

const classifyRarity = (percentage: number): string => {
  if (percentage <= 1) return "Ultra Rare";
  if (percentage <= 3) return "Super Rare";
  if (percentage <= 10) return "Rare";
  if (percentage <= 25) return "Uncommon";
  return "Common";
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

export async function generateCollection(
  input: GenerationInput,
  callbacks: GenerationCallbacks
): Promise<Blob> {
  const { settings, layers, legendaryAssets, antiRules } = input;
  const totalTarget = settings.totalSupply;
  const legendaryCount = legendaryAssets.length;
  const randomCount = Math.max(0, totalTarget - legendaryCount);

  if (legendaryCount === 0 && layers.length === 0) {
    throw new GenerationError("Add at least a legendary or a layer.");
  }

  if (randomCount > 0) {
    for (const layer of layers) {
      if (layer.assets.length === 0) {
        throw new GenerationError(`Layer "${layer.name}" has no assets.`);
      }
      const total =
        layer.assets.reduce((s, a) => s + a.rarity, 0) +
        (layer.optional ? layer.noneRarity : 0);
      if (Math.abs(total - 100) > 0.5) {
        throw new GenerationError(
          `Layer "${layer.name}" rarity total is ${total.toFixed(1)}%. Must be 100%.`
        );
      }
    }
  }

  callbacks.onProgress("Loading images...", 0, 1);
  const imageCache = new Map<string, HTMLImageElement>();
  for (const layer of layers) {
    for (const asset of layer.assets) {
      if (!imageCache.has(asset.objectUrl)) {
        imageCache.set(asset.objectUrl, await loadImage(asset.objectUrl));
      }
    }
  }
  for (const asset of legendaryAssets) {
    if (!imageCache.has(asset.objectUrl)) {
      imageCache.set(asset.objectUrl, await loadImage(asset.objectUrl));
    }
  }

  const zip = new JSZip();
  const imgFolder = zip.folder("images")!;
  const metadataFolder = zip.folder("metadata")!;
  const allMetadata: NFTMetadata[] = [];

  const canvas = document.createElement("canvas");
  canvas.width = settings.imgWidth;
  canvas.height = settings.imgHeight;
  const ctx = canvas.getContext("2d")!;

  const totalAll = legendaryCount + randomCount;
  let globalIndex = 0;

  // PHASE 1: Legendary (1/1)
  for (let i = 0; i < legendaryAssets.length; i++) {
    const asset = legendaryAssets[i];
    const num = settings.startNumber + globalIndex;

    ctx.clearRect(0, 0, settings.imgWidth, settings.imgHeight);
    ctx.drawImage(imageCache.get(asset.objectUrl)!, 0, 0, settings.imgWidth, settings.imgHeight);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
    );
    imgFolder.file(`${num}.jpg`, blob);

    const legAttributes: AttributeEntry[] = [{ trait_type: "Tier", value: "Legendary" }];
    layers.forEach((layer, idx) => {
      if (idx === 0) {
        legAttributes.push({ trait_type: layer.name, value: "Unique" });
      } else {
        legAttributes.push({ trait_type: layer.name, value: "None" });
      }
    });
    legAttributes.push({ trait_type: "Name", value: asset.name });

    const nftMeta: NFTMetadata = {
      name: `${settings.collectionName} #${num}`,
      description: settings.collectionDesc,
      image: `images/${num}.jpg`,
      edition: num,
      date: Date.now(),
      attributes: legAttributes,
      properties: {
        edition: num,
        total_supply: totalAll,
        tier: "Legendary",
        rarity_rank: globalIndex + 1,
        is_one_of_one: true,
      },
    };
    metadataFolder.file(`${num}.json`, JSON.stringify(nftMeta, null, 2));
    allMetadata.push(nftMeta);

    if (globalIndex < 30) {
      callbacks.onPreview(canvas.toDataURL("image/jpeg", 0.4), `#${num} (Legendary)`, "Legendary");
    }

    globalIndex++;
    callbacks.onProgress(`Legendary: ${i + 1}/${legendaryCount}`, globalIndex, totalAll);
    if (i % 3 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  // PHASE 2: Random (rarity-weighted)
  callbacks.onProgress("Calculating combinations...", globalIndex, totalAll);

  const randomCombos: Combo[] = [];
  if (randomCount > 0) {
    const usedCombos = new Set<string>();
    const maxAttempts = randomCount * 50;
    let attempts = 0;
    while (randomCombos.length < randomCount && attempts < maxAttempts) {
      attempts++;
      const combo: Combo = {};
      let key = "";
      for (const layer of layers) {
        const picked = pickAsset(layer);
        combo[layer.id] = picked;
        key += (picked ? picked.name : "NONE") + "|";
      }
      if (!usedCombos.has(key) && !isComboForbidden(combo, antiRules)) {
        usedCombos.add(key);
        randomCombos.push(combo);
      }
    }
    if (randomCombos.length < randomCount) {
      console.warn(
        `Only ${randomCombos.length} unique random combos produced (${randomCount} requested).`
      );
    }
  }

  for (let i = randomCombos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomCombos[i], randomCombos[j]] = [randomCombos[j], randomCombos[i]];
  }

  // Count trait occurrences for rarity scoring
  const traitCounts: Record<string, Record<string, number>> = {};
  for (const meta of allMetadata) {
    for (const attr of meta.attributes) {
      if (!traitCounts[attr.trait_type]) traitCounts[attr.trait_type] = {};
      traitCounts[attr.trait_type][attr.value] =
        (traitCounts[attr.trait_type][attr.value] || 0) + 1;
    }
  }
  for (const combo of randomCombos) {
    traitCounts.Tier ??= {};
    traitCounts.Tier.Random = (traitCounts.Tier.Random || 0) + 1;
    for (const layer of layers) {
      const asset = combo[layer.id];
      const value = asset ? asset.name : "None";
      traitCounts[layer.name] ??= {};
      traitCounts[layer.name][value] = (traitCounts[layer.name][value] || 0) + 1;
    }
  }

  // Render random NFTs
  for (let i = 0; i < randomCombos.length; i++) {
    const combo = randomCombos[i];
    const num = settings.startNumber + globalIndex;

    ctx.clearRect(0, 0, settings.imgWidth, settings.imgHeight);

    for (const layer of layers) {
      const asset = combo[layer.id];
      if (asset) {
        ctx.drawImage(
          imageCache.get(asset.objectUrl)!,
          0,
          0,
          settings.imgWidth,
          settings.imgHeight
        );
      }
    }

    const attributes: AttributeEntry[] = [{ trait_type: "Tier", value: "Random" }];
    for (const layer of layers) {
      const asset = combo[layer.id];
      attributes.push({ trait_type: layer.name, value: asset ? asset.name : "None" });
    }

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
    );
    imgFolder.file(`${num}.jpg`, blob);

    const traitDetails: TraitDetail[] = attributes.map((attr) => {
      const count = traitCounts[attr.trait_type]?.[attr.value] ?? 1;
      const percentage = parseFloat(((count / totalAll) * 100).toFixed(2));
      return {
        trait_type: attr.trait_type,
        value: attr.value,
        count,
        percentage: percentage + "%",
        rarity: classifyRarity(percentage),
      };
    });

    const rarityScore = parseFloat(
      traitDetails
        .reduce((score, t) => score + 1 / Math.max(parseFloat(t.percentage) / 100, 0.0001), 0)
        .toFixed(2)
    );

    const nftMeta: NFTMetadata = {
      name: `${settings.collectionName} #${num}`,
      description: settings.collectionDesc,
      image: `images/${num}.jpg`,
      edition: num,
      date: Date.now(),
      attributes,
      properties: {
        edition: num,
        total_supply: totalAll,
        tier: "Random",
        rarity_score: rarityScore,
        trait_details: traitDetails,
      },
    };
    metadataFolder.file(`${num}.json`, JSON.stringify(nftMeta, null, 2));
    allMetadata.push(nftMeta);

    if (globalIndex < 30) {
      callbacks.onPreview(canvas.toDataURL("image/jpeg", 0.4), `#${num}`, "Random");
    }

    globalIndex++;
    callbacks.onProgress(`Random: ${globalIndex}/${totalAll}`, globalIndex, totalAll);
    if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  // Collection summary
  const rarityRanking = allMetadata
    .map((m) => ({
      edition: m.edition,
      name: m.name,
      tier: m.properties.tier,
      rarity_score: m.properties.rarity_score ?? Infinity,
      tier_rank: m.properties.tier === "Legendary" ? 0 : 1,
    }))
    .sort((a, b) => {
      if (a.tier_rank !== b.tier_rank) return a.tier_rank - b.tier_rank;
      return (b.rarity_score || 0) - (a.rarity_score || 0);
    })
    .map((item, idx) => ({ rank: idx + 1, ...item }));

  const collectionMeta = {
    name: settings.collectionName,
    description: settings.collectionDesc,
    total_supply: totalAll,
    tier_breakdown: {
      legendary: { count: legendaryCount, description: "1/1 unique NFTs" },
      random: {
        count: totalAll - legendaryCount,
        description: "Rarity-based randomly generated NFTs",
      },
    },
    rarity_ranking: rarityRanking,
  };

  zip.file("_metadata.json", JSON.stringify(allMetadata, null, 2));
  zip.file("_collection.json", JSON.stringify(collectionMeta, null, 2));

  return await zip.generateAsync(
    { type: "blob", compression: "STORE", streamFiles: true },
    (m) => {
      const phase =
        m.percent >= 99.9
          ? "ZIP final assembly... (may take 1-2 minutes)"
          : `ZIP: ${m.percent.toFixed(0)}%`;
      callbacks.onZipProgress(m.percent, phase);
    }
  );
}
