import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
  Viewer,
  createWorldTerrainAsync,
  Cartesian3,
  Math as CesiumMath,
  ImageryLayer,
  OpenStreetMapImageryProvider,
  Cesium3DTileset
} from "cesium";
declare const Cesium: any;

@Component({
  selector: "app-cesium-viewer",
  template: `<div #cesiumContainer class="cesium-container"></div>`,
  styles: [`
    .cesium-container { width:95vw; height:95vh; margin:0; padding:0; }
    //.cesium-viewer-toolbar {
    //  top: auto !important; bottom: 35px !important;
    //  left: 10px !important; right: auto !important;
    //}
  `]
})
export class CesiumViewerComponent implements OnInit, AfterViewInit {
  @ViewChild("cesiumContainer", { static: true })
  cesiumContainer!: ElementRef<HTMLDivElement>;

  private viewer!: Viewer;
  private readonly HANOI_LONG = 105.8542;
  private readonly HANOI_LAT  = 21.0285;
  private readonly HANOI_HEIGHT = 10000;
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
      navigationHelpButton: true,
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
      // console.log("Tiles loading (including .b3dm):", n);
    });

    // 5. Fly to Hà Nội
    // this.viewer.camera.setView({
    //   destination: Cartesian3.fromDegrees(
    //     this.HANOI_LONG,
    //     this.HANOI_LAT,
    //     this.HANOI_HEIGHT
    //   ),
    //   orientation: {
    //     heading: CesiumMath.toRadians(0),
    //     pitch:   CesiumMath.toRadians(-45),
    //     roll:    0
    //   }
    // });

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

    let isFirst = true;
    for (const { id, path } of list) {
      const url = `${this.basePath}/${path}`;
      console.log("Loading tileset:", id, url);

      try {
        let tileset: Cesium3DTileset;
        if (Cesium.Cesium3DTileset.fromUrl) {
          tileset = await Cesium3DTileset.fromUrl(url);
        } else {
          tileset = new Cesium.Cesium3DTileset({ url } as any);
        }
        tileset.maximumScreenSpaceError = 32;

        // tileset.maximumScreenSpaceError = 0; // render toan bo tile (rat lag)
        this.viewer.scene.primitives.add(tileset);


        // set chieu cao mo hinh cao them 35m
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
        console.error(`Failed to load tileset ${id}:`, err);
      }
    }
  }
}
