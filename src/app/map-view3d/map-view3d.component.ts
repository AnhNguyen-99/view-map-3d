import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Viewer,
  Ion,
  OpenStreetMapImageryProvider,
  Cesium3DTileset
} from 'cesium';

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
      baseLayerPicker: false,
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

        tileset.tileVisible.addEventListener((tile) => {
          // console.log(`[${tile.content.url}] visible`);
        });

        this.viewer.scene.primitives.add(tileset);

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
