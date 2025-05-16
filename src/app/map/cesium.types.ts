export interface TileSet {
  asset: {
    version: string;
    gltfUpAxis: string;
  };
  geometricError: number;
  root: TileNode;
}

export interface TileNode {
  boundingVolume?: {
    sphere: number[];
  };
  geometricError?: number;
  content?: {
    uri: string;
  };
  children?: TileNode[];
  refine?: 'REPLACE' | 'ADD';
}