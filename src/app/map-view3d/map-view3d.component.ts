import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import {
  Viewer,
  Ion,
  IonResource,
  Cesium3DTileset,
  OpenStreetMapImageryProvider,
  ImageryLayer,
  Cartesian3,
  HeadingPitchRoll,
  Transforms
} from 'cesium';
import { DownloadService } from "./download.service";

@Component({
  selector: 'app-map-view3d',
  templateUrl: './map-view3d.component.html',
  styleUrls: ['./map-view3d.component.scss']
})
export class MapView3dComponent implements AfterViewInit {
  @ViewChild('cesiumContainer', { static: false }) cesiumContainer!: ElementRef;

  private viewer!: Viewer;
  private tileset!: Cesium3DTileset;

  async ngAfterViewInit(): Promise<void> {
    Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NGExYzRlMC1hMmJkLTQ4NzctOTZkZC00ZjZlNzBiYjU3OTMiLCJpZCI6MzAzMDM1LCJpYXQiOjE3NDczOTA5ODl9.YDhrNtkz0PjCSiA4gQrERd_-Zc228HxVfR8Vu2P9vOo';

    const osmLayer = new ImageryLayer(
      new OpenStreetMapImageryProvider({ url: "https://a.tile.openstreetmap.org/" })
    );
    this.viewer = new Viewer(this.cesiumContainer.nativeElement, {
      baseLayer: osmLayer,
      baseLayerPicker: false
    });

    const resource = await IonResource.fromAssetId(3397561);
    this.tileset = await Cesium3DTileset.fromUrl(resource);

    this.viewer.scene.primitives.add(this.tileset);
    this.viewer.zoomTo(this.tileset);
  }

  // Hàm này sẽ được gọi khi nhấn nút
  focusTileset() {
    if (this.viewer && this.tileset) {
      this.viewer.flyTo(this.tileset);
    }
  }
}
