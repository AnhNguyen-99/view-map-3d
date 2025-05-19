import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Viewer,
  Ion,
  createWorldTerrainAsync,
  Cartesian3,
  Math as CesiumMath,
  ImageryLayer,
  OpenStreetMapImageryProvider,
  Cesium3DTileset
} from 'cesium';

@Component({
  selector: 'app-map-view3d',
  templateUrl: './map-view3d.component.html',
  styleUrls: ['./map-view3d.component.scss']
})
export class MapView3dComponent implements OnInit {

  viewer!: Viewer;

  async ngOnInit(): Promise<void> {
    // Tắt token Cesium Ion
    Ion.defaultAccessToken = null as any;

    // Khởi tạo viewer
    this.viewer = new Viewer('cesiumContainer', {
      terrainProvider: undefined,
      baseLayerPicker: false,
    });

    // Load tileset bằng API mới
    const tileset = await Cesium3DTileset.fromUrl('/assets/3dtiles/tileset.json');
    this.viewer.scene.primitives.add(tileset);
    this.viewer.zoomTo(tileset);
  }
}
