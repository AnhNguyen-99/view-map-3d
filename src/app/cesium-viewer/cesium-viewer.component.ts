// cesium-map.component.ts
import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
// import toàn bộ Cesium để runtime nhất quán
import {
  Viewer,
  createWorldTerrainAsync,
  Cartesian3,
  Math as CesiumMath,
  ImageryLayer,
  OpenStreetMapImageryProvider,
  HeadingPitchRange,
  BoundingSphere,
  Cesium3DTileset
} from "cesium";
declare const Cesium: any;

@Component({
  selector: "app-cesium-viewer",
  template: `<div #cesiumContainer class="cesium-container"></div>`,
  styles: [`
    .cesium-container { width:100vw; height:100vh; margin:0; padding:0; }
    .cesium-viewer-toolbar {
      top: auto !important; bottom: 35px !important;
      left: 10px !important; right: auto !important;
    }
  `]
})
export class CesiumViewerComponent implements OnInit, AfterViewInit {
  @ViewChild("cesiumContainer", { static: true })
  cesiumContainer!: ElementRef<HTMLDivElement>;

  private viewer!: Viewer;
  private readonly HANOI_LONG = 105.8542;
  private readonly HANOI_LAT  = 21.0285;
  private readonly HANOI_HEIGHT = 5000;

  // TODO: đổi thành URL thực của bạn
  // private readonly basePath =
  //   "http://103.214.9.127:9091/tiles_3d/dddcc44f-57d7-4282-8ff5-7ece5579beda1731313018031";
  readonly basePath = '/assets/Data';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    (window as any).CESIUM_BASE_URL = "/assets/cesium"; // nếu dùng local Cesium build
  }

  ngAfterViewInit(): void {
    this.initCesium();
  }

  private async initCesium() {
    // 1. Tạo OSM imagery provider
    const osmLayer = new ImageryLayer(
      new OpenStreetMapImageryProvider({ url: "https://a.tile.openstreetmap.org/" })
    );

    // 2. Init Viewer, dùng imageryProvider thay baseLayer
    this.viewer = new Viewer(this.cesiumContainer.nativeElement, {
      baseLayer: osmLayer,
      baseLayerPicker: false,
      geocoder: true,
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: true,
      terrainProvider: undefined
    });

    // 3. Load terrain
    try {
      const terrain = await createWorldTerrainAsync();
      this.viewer.terrainProvider = terrain;
      this.viewer.scene.globe.depthTestAgainstTerrain = true;
    } catch (e) {
      console.warn("WorldTerrain load failed, continuing without terrain.", e);
    }

    // 4. Observe load progress
    this.viewer.scene.globe.tileLoadProgressEvent.addEventListener(n => {
      console.log("Tiles loading (including .b3dm):", n);
    });

    // 5. Fly to Hà Nội
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        this.HANOI_LONG,
        this.HANOI_LAT,
        this.HANOI_HEIGHT
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch:   Cesium.Math.toRadians(-45),
        roll:    0
      }
    });

    // 6. Load tất cả 3D‑Tiles từ titles.json
    await this.loadAllTilesets();
  }

  private async loadAllTilesets() {
    let list: { id: string; path: string }[];
    try {
      const data = await firstValueFrom(
        this.http.get<{ tilesets: { id: string; path: string }[] }>(
          `${this.basePath}/titles.json`
        )
      );
      list = data.tilesets;
    } catch (e) {
      console.error("Không load được titles.json:", e);
      return;
    }

    for (const { id, path } of list) {
      const url = `${this.basePath}/${path}`;
      console.log("Loading tileset:", id, url);

      try {
        // Dùng .fromUrl() nếu có, hoặc new Cesium3DTileset
        let tileset: Cesium3DTileset;
        if (Cesium.Cesium3DTileset.fromUrl) {
          tileset = await (Cesium.Cesium3DTileset as any).fromUrl(url);
        } else {
          tileset = new Cesium.Cesium3DTileset({ url } as any);
        }

        // Debug nếu muốn
        // (tileset as any).debugWireframe = true;
        // (tileset as any).debugShowBoundingVolume = true;

        this.viewer.scene.primitives.add(tileset);

        // Khi root JSON sẵn sàng thì zoom vào nó
        // this.viewer.zoomTo(tileset);
        // console.log(`Đã load & zoom tới ${id}`);
      } catch (err) {
        console.error(`Failed to load tileset ${id}:`, err);
      }
    }
  }
}
