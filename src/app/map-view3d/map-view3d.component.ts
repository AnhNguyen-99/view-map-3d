import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Viewer,
  Ion,
  OpenStreetMapImageryProvider,
  Cesium3DTileset, Cartesian3
} from 'cesium';
import * as Cesium from "cesium";

interface TilesetInfo {
  id: string;
  path: string;
}

@Component({
  selector: 'app-map-view3d',
  templateUrl: './map-view3d.component.html',
  styleUrls: ['./map-view3d.component.scss']
})
export class MapView3dComponent implements OnInit {
  @ViewChild('cesiumContainer', { static: true }) cesiumContainer!: ElementRef;
  viewer!: Viewer;

  constructor(private http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    Ion.defaultAccessToken = null as any;

    // Khởi tạo viewer
    this.viewer = new Viewer(this.cesiumContainer.nativeElement, {
      baseLayerPicker: true,
      terrainProvider: undefined
    });

    const osmLayer = new OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/'
    });
    this.viewer.imageryLayers.addImageryProvider(osmLayer);

    // Load danh sách tilesets
    const tilesJsonPath = '/assets/Data/titles.json';
    const tilesData = await this.http.get<{ tilesets: TilesetInfo[] }>(tilesJsonPath).toPromise();

    if (!tilesData || !tilesData.tilesets) {
      console.error('Không tìm thấy danh sách tilesets!');
      return;
    }

    let isFirst = true;

    for (const tile of tilesData.tilesets) {
      const tilesetPath = `/assets/Data/${tile.path}`;
      try {
        const tileset = await Cesium3DTileset.fromUrl(tilesetPath);

        // Log chi tiết mỗi tile khi visible
        tileset.tileVisible.addEventListener((tile) => {
          // const url =
          //   tile.content && (tile.content as any).url
          //     ? (tile.content as any).url
          //     : '[no content url]';
          // console.log(
          //   '[CESIUM TILE VISIBLE]',
          //   '\nurl:', url,
          //   '\ngeometricError:', tile.geometricError,
          //   '\nboundingVolume:', tile.boundingVolume.boundingVolume,
          //   '\nlevel:', tile.level,
          //   '\nisLeaf:', tile.isLeaf,
          //   '\nchildren:', tile.children.length
          // );
        });

        // Ép Cesium render toàn bộ tile cha & con (chạy cực sâu)
        tileset.maximumScreenSpaceError = 1; // ép tải tối đa, chú ý RAM!

        this.viewer.scene.primitives.add(tileset);

        const heightOffset = 35;
        const boundingSphere = tileset.boundingSphere;
        const carto = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        const surface = Cartesian3.fromRadians(carto.longitude, carto.latitude, 0);
        const offset = Cartesian3.fromRadians(carto.longitude, carto.latitude, heightOffset);
        const translation = Cartesian3.subtract(offset, surface, new Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        if (isFirst) {
          this.viewer.zoomTo(tileset);
          isFirst = false;
        }
      } catch (err) {
        console.error(`Lỗi khi load ${tilesetPath}`, err);
      }
    }
  }
}
