"use client";

import { create } from "zustand";
import type { Asset, AntiRule, Layer, LegendaryAsset, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  collectionName: "My NFT Collection",
  collectionDesc: "A unique NFT collection",
  startNumber: 1,
  imgWidth: 1000,
  imgHeight: 1000,
  totalSupply: 2222,
};

interface StoreState {
  settings: Settings;
  layers: Layer[];
  legendaryAssets: LegendaryAsset[];
  antiRules: AntiRule[];
  layerIdCounter: number;
  hydrated: boolean;

  setHydrated: (state: {
    settings?: Partial<Settings>;
    layers?: Layer[];
    legendaryAssets?: LegendaryAsset[];
    antiRules?: AntiRule[];
    layerIdCounter?: number;
  }) => void;
  updateSettings: (partial: Partial<Settings>) => void;

  addLayer: () => void;
  removeLayer: (id: number) => void;
  moveLayer: (id: number, dir: -1 | 1) => void;
  clearAll: () => void;
  updateLayerName: (id: number, name: string) => void;
  toggleOptional: (id: number, checked: boolean) => void;
  updateNoneRarity: (id: number, value: number) => void;
  addAssetsToLayer: (layerId: number, assets: Asset[]) => void;
  removeAsset: (layerId: number, assetIndex: number) => void;
  updateRarity: (layerId: number, assetIndex: number, value: number) => void;
  updateAssetName: (layerId: number, assetIndex: number, name: string) => void;

  addLegendaries: (assets: LegendaryAsset[]) => void;
  removeLegendary: (index: number) => void;
  updateLegendaryName: (index: number, name: string) => void;

  addAntiRule: (rule: AntiRule) => boolean;
  removeAntiRule: (index: number) => void;
}

const autoDistributeRarity = (layer: Layer): Layer => {
  const count = layer.assets.length;
  if (count === 0) return layer;
  const available = 100 - (layer.optional ? layer.noneRarity : 0);
  const each = parseFloat((available / count).toFixed(1));
  const remainder = parseFloat((available - each * count).toFixed(1));
  return {
    ...layer,
    assets: layer.assets.map((a, i) => ({
      ...a,
      rarity: i === 0 ? parseFloat((each + remainder).toFixed(1)) : each,
    })),
  };
};

export const useStore = create<StoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  layers: [],
  legendaryAssets: [],
  antiRules: [],
  layerIdCounter: 0,
  hydrated: false,

  setHydrated: (data) =>
    set((state) => ({
      settings: { ...state.settings, ...(data.settings ?? {}) },
      layers: data.layers ?? state.layers,
      legendaryAssets: data.legendaryAssets ?? state.legendaryAssets,
      antiRules: data.antiRules ?? state.antiRules,
      layerIdCounter: data.layerIdCounter ?? state.layerIdCounter,
      hydrated: true,
    })),

  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),

  addLayer: () =>
    set((state) => {
      const id = state.layerIdCounter + 1;
      return {
        layerIdCounter: id,
        layers: [
          ...state.layers,
          {
            id,
            name: `Layer ${id}`,
            optional: false,
            noneRarity: 0,
            assets: [],
          },
        ],
      };
    }),

  removeLayer: (id) =>
    set((state) => {
      const layer = state.layers.find((l) => l.id === id);
      layer?.assets.forEach((a) => URL.revokeObjectURL(a.objectUrl));
      return {
        layers: state.layers.filter((l) => l.id !== id),
        antiRules: state.antiRules.filter(
          (r) => r.layer1Id !== id && r.layer2Id !== id
        ),
      };
    }),

  moveLayer: (id, dir) =>
    set((state) => {
      const idx = state.layers.findIndex((l) => l.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= state.layers.length) return state;
      const layers = [...state.layers];
      [layers[idx], layers[newIdx]] = [layers[newIdx], layers[idx]];
      return { layers };
    }),

  clearAll: () => {
    get().layers.forEach((l) =>
      l.assets.forEach((a) => URL.revokeObjectURL(a.objectUrl))
    );
    get().legendaryAssets.forEach((a) => URL.revokeObjectURL(a.objectUrl));
    set({ layers: [], antiRules: [], legendaryAssets: [], layerIdCounter: 0 });
  },

  updateLayerName: (id, name) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, name } : l)),
    })),

  toggleOptional: (id, checked) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id
          ? { ...l, optional: checked, noneRarity: checked ? 10 : 0 }
          : l
      ),
    })),

  updateNoneRarity: (id, value) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, noneRarity: value } : l
      ),
    })),

  addAssetsToLayer: (layerId, newAssets) =>
    set((state) => ({
      layers: state.layers.map((l) => {
        if (l.id !== layerId) return l;

        // Fresh layer → auto-distribute evenly across everything
        if (l.assets.length === 0) {
          return autoDistributeRarity({ ...l, assets: newAssets });
        }

        // Existing layer with custom rarities → preserve them.
        // Split whatever % is still free across the new assets.
        const existingTotal = l.assets.reduce((s, a) => s + a.rarity, 0);
        const noneShare = l.optional ? l.noneRarity : 0;
        const remaining = Math.max(0, 100 - existingTotal - noneShare);
        const each =
          remaining > 0
            ? parseFloat((remaining / newAssets.length).toFixed(1))
            : 0;
        const extra = parseFloat(
          (remaining - each * newAssets.length).toFixed(1)
        );
        const added = newAssets.map((a, i) => ({
          ...a,
          rarity:
            i === newAssets.length - 1
              ? parseFloat((each + extra).toFixed(1))
              : each,
        }));
        return { ...l, assets: [...l.assets, ...added] };
      }),
    })),

  removeAsset: (layerId, assetIndex) =>
    set((state) => {
      const layer = state.layers.find((l) => l.id === layerId);
      if (!layer) return state;
      const asset = layer.assets[assetIndex];
      if (!asset) return state;
      URL.revokeObjectURL(asset.objectUrl);
      return {
        layers: state.layers.map((l) =>
          l.id === layerId
            ? { ...l, assets: l.assets.filter((_, i) => i !== assetIndex) }
            : l
        ),
        antiRules: state.antiRules.filter(
          (r) =>
            !(r.layer1Id === layerId && r.asset1Name === asset.name) &&
            !(r.layer2Id === layerId && r.asset2Name === asset.name)
        ),
      };
    }),

  updateRarity: (layerId, assetIndex, value) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === layerId
          ? {
              ...l,
              assets: l.assets.map((a, i) =>
                i === assetIndex ? { ...a, rarity: value } : a
              ),
            }
          : l
      ),
    })),

  updateAssetName: (layerId, assetIndex, name) =>
    set((state) => {
      const layer = state.layers.find((l) => l.id === layerId);
      const oldName = layer?.assets[assetIndex]?.name;
      if (!layer || !oldName || !name || oldName === name) return state;
      return {
        layers: state.layers.map((l) =>
          l.id === layerId
            ? {
                ...l,
                assets: l.assets.map((a, i) =>
                  i === assetIndex ? { ...a, name } : a
                ),
              }
            : l
        ),
        antiRules: state.antiRules.map((r) => {
          let next = r;
          if (next.layer1Id === layerId && next.asset1Name === oldName) {
            next = { ...next, asset1Name: name };
          }
          if (next.layer2Id === layerId && next.asset2Name === oldName) {
            next = { ...next, asset2Name: name };
          }
          return next;
        }),
      };
    }),

  addLegendaries: (assets) =>
    set((state) => ({
      legendaryAssets: [...state.legendaryAssets, ...assets],
    })),

  removeLegendary: (index) =>
    set((state) => {
      const asset = state.legendaryAssets[index];
      if (asset) URL.revokeObjectURL(asset.objectUrl);
      return {
        legendaryAssets: state.legendaryAssets.filter((_, i) => i !== index),
      };
    }),

  updateLegendaryName: (index, name) =>
    set((state) => ({
      legendaryAssets: state.legendaryAssets.map((a, i) =>
        i === index ? { ...a, name } : a
      ),
    })),

  addAntiRule: (rule) => {
    const { antiRules } = get();
    const exists = antiRules.some(
      (r) =>
        (r.layer1Id === rule.layer1Id &&
          r.asset1Name === rule.asset1Name &&
          r.layer2Id === rule.layer2Id &&
          r.asset2Name === rule.asset2Name) ||
        (r.layer1Id === rule.layer2Id &&
          r.asset1Name === rule.asset2Name &&
          r.layer2Id === rule.layer1Id &&
          r.asset2Name === rule.asset1Name)
    );
    if (exists) return false;
    set({ antiRules: [...antiRules, rule] });
    return true;
  },

  removeAntiRule: (index) =>
    set((state) => ({
      antiRules: state.antiRules.filter((_, i) => i !== index),
    })),
}));
