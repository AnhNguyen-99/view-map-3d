import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  Viewer,
  Ion,
  OpenStreetMapImageryProvider,
  Cesium3DTileset
} from 'cesium';

@Component({
  selector: 'app-map-view3d',
  templateUrl: './map-view3d.component.html',
  styleUrls: ['./map-view3d.component.scss']
})
export class MapView3dComponent implements OnInit {
  @ViewChild('cesiumContainer', { static: true }) cesiumContainer!: ElementRef;

  viewer!: Viewer;

  async ngOnInit(): Promise<void> {
    // Vô hiệu hóa token Cesium Ion
    Ion.defaultAccessToken = null as any;

    // Khởi tạo Viewer
    this.viewer = new Viewer(this.cesiumContainer.nativeElement, {
      baseLayerPicker: false,
      terrainProvider: undefined
    });

    // Thêm lớp OSM sau khi Viewer được khởi tạo
    const osmLayer = new OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/'
    });
    this.viewer.imageryLayers.addImageryProvider(osmLayer);

    // Load và thêm 3D Tileset
    const tileset = await Cesium3DTileset.fromUrl('/assets/3dtiles/Tile_1.json');
    tileset.tileVisible.addEventListener((tile) => {
      console.log('Tile visible:', tile.content.url);
    });

    this.viewer.scene.primitives.add(tileset);
    this.viewer.zoomTo(tileset);

  }
}
