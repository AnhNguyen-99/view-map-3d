import { Component, type OnInit, type AfterViewInit, type ElementRef, ViewChild } from "@angular/core";
import { Viewer, createWorldTerrainAsync, Cartesian3, Math as CesiumMath, ImageryLayer, OpenStreetMapImageryProvider, HeadingPitchRange, BoundingSphere } from "cesium";
declare var Cesium: any;

@Component({
  selector: 'app-view-map',
  template: `<div #cesiumContainer class="cesium-container"></div>`,
  styles: [
    `
    .cesium-container {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: visible;
    }
    .cesium-viewer-toolbar {
      top: auto !important;
      bottom: 35px !important;
      left: 10px !important;
      right: auto !important;
    }
    `,
  ],
})
export class ViewMapComponent implements OnInit, AfterViewInit {
  @ViewChild("cesiumContainer", { static: true }) cesiumContainer!: ElementRef;
  viewer!: Viewer;

  // Hanoi coordinates
  private readonly HANOI_LONGITUDE = 105.8542;
  private readonly HANOI_LATITUDE = 21.0285;
  private readonly DEFAULT_HEIGHT = 5000; // meters

  // Đường dẫn cơ sở đến thư mục chính chứa các tileset
  private readonly basePath = 'http://103.214.9.127:9091/tiles_3d/dddcc44f-57d7-4282-8ff5-7ece5579beda1731313018031';
  // Số lượng thư mục Tile_X
  private readonly tileCount = 14;
  // Danh sách URL của các tileset.json
  private readonly tilesetUrls = Array.from(
    { length: this.tileCount },
    (_, i) => `${this.basePath}/Tile_${i + 1}/Tile_${i + 1}.json`
  );

  constructor() {}

  ngOnInit(): void {
    (window as any).CESIUM_BASE_URL = "/assets/cesium";
  }

  ngAfterViewInit(): void {
    this.initCesiumMap();
  }

  private async initCesiumMap(): Promise<void> {
    const osmLayer = new ImageryLayer(
      new OpenStreetMapImageryProvider({
        url: "https://a.tile.openstreetmap.org/"
      })
    );

    this.viewer = new Viewer(this.cesiumContainer.nativeElement, {
      baseLayer: osmLayer,
      baseLayerPicker: true,
      geocoder: true,
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: true,
      terrainProvider: undefined,
    });

    try {
      const worldTerrain = await createWorldTerrainAsync();
      this.viewer.terrainProvider = worldTerrain;

      this.flyToHanoi();
      await this.load3DTilesets();
    } catch (error) {
      console.error("Lỗi khởi tạo bản đồ Cesium:", error);
    }
  }

  private flyToHanoi(): void {
    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(this.HANOI_LONGITUDE, this.HANOI_LATITUDE, this.DEFAULT_HEIGHT),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-45),
        roll: 0,
      },
      duration: 3,
    });
  }

  private async load3DTilesets(): Promise<void> {
    try {
      for (const url of this.tilesetUrls) {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
        this.viewer.scene.primitives.add(tileset);
      }

      const boundingSphere = new Cesium.BoundingSphere(
        Cartesian3.fromDegrees(this.HANOI_LONGITUDE, this.HANOI_LATITUDE, this.DEFAULT_HEIGHT),
        1000
      );
      this.viewer.scene.camera.flyToBoundingSphere(boundingSphere, {
        offset: new Cesium.HeadingPitchRange(
          CesiumMath.toRadians(0),
          CesiumMath.toRadians(-45),
          1000
        ),
        duration: 3,
      });
    } catch (error) {
      console.error("Lỗi tải tileset:", error);
    }
  }
}