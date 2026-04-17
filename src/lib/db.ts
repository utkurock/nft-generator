"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  AntiRule,
  Layer,
  LegendaryAsset,
  Settings,
} from "./types";

const DB_NAME = "NFTGeneratorDB";
const DB_VERSION = 4;

interface PersistedAsset {
  name: string;
  rarity: number;
}

interface PersistedLayer {
  id: number;
  name: string;
  optional: boolean;
  noneRarity: number;
  assets: PersistedAsset[];
}

interface PersistedLegendary {
  name: string;
  index: number;
}

interface PersistedState {
  layers: PersistedLayer[];
  layerIdCounter: number;
  antiRules: AntiRule[];
  legendaryAssets: PersistedLegendary[];
  settings: Settings;
}

interface Schema extends DBSchema {
  blobs: {
    key: string;
    value: Blob;
  };
  state: {
    key: string;
    value: PersistedState;
  };
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
        if (!db.objectStoreNames.contains("state")) db.createObjectStore("state");
      },
    });
  }
  return dbPromise;
};

const layerBlobKey = (layerId: number, assetName: string) =>
  `layer_${layerId}_${assetName}`;

const legendaryBlobKey = (index: number, name: string) =>
  `legendary_${index}_${name}`;

export interface SaveInput {
  settings: Settings;
  layers: Layer[];
  legendaryAssets: LegendaryAsset[];
  antiRules: AntiRule[];
  layerIdCounter: number;
}

export async function saveProject(data: SaveInput): Promise<void> {
  const db = await getDB();

  const blobTx = db.transaction("blobs", "readwrite");
  await blobTx.objectStore("blobs").clear();
  for (const layer of data.layers) {
    for (const asset of layer.assets) {
      await blobTx.objectStore("blobs").put(asset.blob, layerBlobKey(layer.id, asset.name));
    }
  }
  for (let i = 0; i < data.legendaryAssets.length; i++) {
    const a = data.legendaryAssets[i];
    await blobTx.objectStore("blobs").put(a.blob, legendaryBlobKey(i, a.name));
  }
  await blobTx.done;

  const persisted: PersistedState = {
    layers: data.layers.map((l) => ({
      id: l.id,
      name: l.name,
      optional: l.optional,
      noneRarity: l.noneRarity,
      assets: l.assets.map((a) => ({ name: a.name, rarity: a.rarity })),
    })),
    layerIdCounter: data.layerIdCounter,
    antiRules: data.antiRules,
    legendaryAssets: data.legendaryAssets.map((a, i) => ({ name: a.name, index: i })),
    settings: data.settings,
  };

  const stateTx = db.transaction("state", "readwrite");
  await stateTx.objectStore("state").put(persisted, "project");
  await stateTx.done;
}

export interface LoadedProject {
  settings: Partial<Settings>;
  layers: Layer[];
  legendaryAssets: LegendaryAsset[];
  antiRules: AntiRule[];
  layerIdCounter: number;
}

export async function loadProject(): Promise<LoadedProject | null> {
  const db = await getDB();
  const state = await db.get("state", "project");
  if (!state) return null;

  const layers: Layer[] = [];
  for (const persisted of state.layers) {
    const layer: Layer = {
      id: persisted.id,
      name: persisted.name,
      optional: persisted.optional,
      noneRarity: persisted.noneRarity,
      assets: [],
    };
    for (const a of persisted.assets) {
      const blob = await db.get("blobs", layerBlobKey(persisted.id, a.name));
      if (blob) {
        layer.assets.push({
          name: a.name,
          rarity: a.rarity,
          blob,
          objectUrl: URL.createObjectURL(blob),
        });
      }
    }
    layers.push(layer);
  }

  const legendaryAssets: LegendaryAsset[] = [];
  for (const leg of state.legendaryAssets) {
    const blob = await db.get("blobs", legendaryBlobKey(leg.index, leg.name));
    if (blob) {
      legendaryAssets.push({
        name: leg.name,
        blob,
        objectUrl: URL.createObjectURL(blob),
      });
    }
  }

  return {
    settings: state.settings,
    layers,
    legendaryAssets,
    antiRules: state.antiRules ?? [],
    layerIdCounter: state.layerIdCounter ?? 0,
  };
}
