export interface Asset {
  name: string;
  rarity: number;
  blob: Blob;
  objectUrl: string;
}

export interface Layer {
  id: number;
  name: string;
  optional: boolean;
  noneRarity: number;
  assets: Asset[];
}

export interface LegendaryAsset {
  name: string;
  blob: Blob;
  objectUrl: string;
}

export interface AntiRule {
  layer1Id: number;
  asset1Name: string;
  layer2Id: number;
  asset2Name: string;
}

export interface Settings {
  collectionName: string;
  collectionDesc: string;
  startNumber: number;
  imgWidth: number;
  imgHeight: number;
  totalSupply: number;
}

export type Tier = "Legendary" | "Random";

export interface GenerationProgress {
  phase: string;
  current: number;
  total: number;
  percent: number;
}
