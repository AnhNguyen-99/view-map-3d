import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { HttpClient } from '@angular/common/http';
import { TileNode, TileSet } from './cesium.types';

@Injectable({ providedIn: 'root' })
export class CesiumService {
  private viewer!: Cesium.Viewer;
  private readonly BASE_URL =
    'http://103.214.9.127:9091/tiles_3d/dddcc44f-57d7-4282-8ff5-7ece5579beda1731313018031';
  private readonly MAX_DEPTH = 5;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor(private http: HttpClient) {
    // Set Cesium base URL if function exists (for compatibility with different Cesium versions)
    if (
      (Cesium as any).buildModuleUrl &&
      typeof (Cesium as any).buildModuleUrl.setBaseUrl === 'function'
    ) {
      (Cesium as any).buildModuleUrl.setBaseUrl('/assets/cesium/');
    } else if (
      (Cesium as any).Ion &&
      (Cesium as any).Ion.defaultAccessToken !== undefined
    ) {
      // Optionally set Ion access token or other config here if needed
    }
  }

  async initializeScene(containerId: string): Promise<void> {
    // Khởi tạo Viewer
    this.viewer = new Cesium.Viewer(containerId, {
      scene3DOnly: true,
      baseLayerPicker: false,
      navigationHelpButton: false,
      terrainProvider: await Cesium.createWorldTerrainAsync(),
    });

    // Load cấu hình tilesets
    const config = await this.http
      .get<any>('assets/tiles-config.json')
      .toPromise();

    // Load tất cả tilesets
    await Promise.all(
      config.tilesets.map((tile: any) =>
        this.loadTileSetRecursively(`${this.BASE_URL}/${tile.path}`)
      )
    );

    // Zoom toàn bộ scene
    await this.zoomToEntireScene();
  }

  private async loadTileSetRecursively(url: string, depth = 0): Promise<void> {
    if (depth > this.MAX_DEPTH) return;

    try {
      const tileSet = await this.http.get<TileSet>(url).toPromise();
      if (!tileSet) return;

      // Load current content
      if (tileSet.root.content?.uri) {
        const contentUrl = this.resolveRelativeUrl(
          url,
          tileSet.root.content.uri
        );
        await this.load3DContent(contentUrl, 0);
      }

      // Process children
      if (tileSet.root.children) {
        await Promise.all(
          tileSet.root.children.map((child: any) =>
            this.processChildNode(url, child, depth)
          )
        );
      }
    } catch (error) {
      console.error(`Failed to load tileset at ${url}:`, error);
    }
  }

  private async processChildNode(
    baseUrl: string,
    node: TileNode,
    depth: number
  ): Promise<void> {
    if (node.content?.uri) {
      const childUrl = this.resolveRelativeUrl(baseUrl, node.content.uri);
      await this.load3DContent(childUrl, 0);
    }

    if (node.children) {
      await Promise.all(
        node.children.map((child) =>
          this.loadTileSetRecursively(
            this.resolveRelativeUrl(baseUrl, child.content?.uri || ''),
            depth + 1
          )
        )
      );
    }
  }

  private async load3DContent(url: string, attempt: number): Promise<void> {
    try {
      if (url.endsWith('.json')) {
        return this.loadTileSetRecursively(url);
      }

      const tileset = this.viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
          skipLevelOfDetail: true,
          maximumScreenSpaceError: 2,
        })
      );
      this.viewer.scene.primitives.add(tileset);

      await tileset.readyPromise;
      console.log(`Successfully loaded: ${url}`);
    } catch (error) {
      if (attempt < this.MAX_RETRIES) {
        console.warn(`Retrying ${url} (attempt ${attempt + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        return this.load3DContent(url, attempt + 1);
      }
      console.error(`Permanent failure loading ${url}:`, error);
    }
  }

  private resolveRelativeUrl(baseUrl: string, relativePath: string): string {
    const segments = baseUrl.split('/');
    segments.pop();
    return `${segments.join('/')}/${relativePath}`;
  }

  private zoomToEntireScene(): void {
    const tilesets: Cesium.Cesium3DTileset[] = [];
    for (let i = 0; i < this.viewer.scene.primitives.length; i++) {
      const primitive = this.viewer.scene.primitives.get(i);
      if (primitive instanceof Cesium.Cesium3DTileset) {
        tilesets.push(primitive);
      }
    }

    const boundingSpheres = tilesets
      .map((t: Cesium.Cesium3DTileset) => t.boundingSphere)
      .filter((bs: any) => !!bs) as Cesium.BoundingSphere[];

    if (boundingSpheres.length > 0) {
      const compositeSphere =
        Cesium.BoundingSphere.fromBoundingSpheres(boundingSpheres);
      this.viewer.camera.flyToBoundingSphere(compositeSphere, {
        offset: new Cesium.HeadingPitchRange(0, -0.5, 0),
        duration: 2,
      });
    }
  }

  destroyViewer(): void {
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
  }
}
