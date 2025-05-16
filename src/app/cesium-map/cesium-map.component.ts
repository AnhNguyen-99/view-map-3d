// // cesium-map.component.ts
// import {
//   Component,
//   OnInit,
//   AfterViewInit,
//   ElementRef,
//   ViewChild,
//   OnDestroy,
// } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { firstValueFrom } from 'rxjs';
// import * as Cesium from 'cesium';

// type MeasureMode = 'none' | 'distance' | 'area' | 'point';

// @Component({
//   selector: 'app-cesium-map',
//   templateUrl: './cesium-map.component.html',
//   styleUrls: ['./cesium-map.component.scss'],
// })
// export class CesiumMapComponent implements OnInit, AfterViewInit, OnDestroy {
//   @ViewChild('cesiumContainer', { static: true })
//   cesiumContainer!: ElementRef<HTMLDivElement>;

//   private viewer!: Cesium.Viewer;
//   private handler!: Cesium.ScreenSpaceEventHandler;

//   // measurement state
//   private mode: MeasureMode = 'none';
//   private positions: Cesium.Cartesian3[] = [];
//   private tempEntity?: Cesium.Entity; // polyline or polygon
//   private markers: Cesium.Entity[] = [];

//   private readonly basePath =
//     'http://103.214.9.127:9091/tiles_3d/dddcc44f-57d7-4282-8ff5-7ece5579beda1731313018031/titles.json';

//   constructor(private http: HttpClient) {}

//   ngOnInit(): void {
//     (window as any).CESIUM_BASE_URL = '/assets/cesium';
//   }

//   ngAfterViewInit(): void {
//     this.initCesium();
//   }

//   ngOnDestroy(): void {
//     this.handler?.destroy();
//   }

//   private async initCesium() {
//     this.viewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
//       baseLayer: new Cesium.ImageryLayer(
//         new Cesium.OpenStreetMapImageryProvider({
//           url: 'https://a.tile.openstreetmap.org/',
//         })
//       ),
//       baseLayerPicker: false,
//       terrainProvider: await Cesium.createWorldTerrainAsync(),
//     });
//     this.viewer.scene.globe.depthTestAgainstTerrain = true;

//     // load your tilesets… (omitted for brevity)

//     // prepare handler for clicks
//     this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

//     // on click
//     this.handler.setInputAction((click: { position: Cesium.Cartesian2; }) => {
//       if (this.mode === 'none') return;
//       const carto = this.viewer.camera.pickEllipsoid(
//         click.position,
//         this.viewer.scene.globe.ellipsoid
//       );
//       if (!carto) return;

//       // add marker
//       const id = this.viewer.entities.add({
//         position: carto,
//         point: { pixelSize: 10, color: Cesium.Color.YELLOW },
//       });
//       this.markers.push(id);

//       // push position
//       this.positions.push(carto);

//       // update temp shape
//       this.updateShape();
//     }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

//     // finish area measurement on double click
//     this.handler.setInputAction((click: any) => {
//       if (this.mode === 'area' && this.positions.length > 2) {
//         this.finishMeasurement();
//       }
//     }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
//   }

//   /** start a measurement mode */
//   startMeasure(mode: MeasureMode) {
//     this.clearMeasurement();
//     this.mode = mode;
//     // init temp entity
//     if (mode === 'distance') {
//       this.tempEntity = this.viewer.entities.add({
//         polyline: {
//           positions: new Cesium.CallbackProperty(() => this.positions, false),
//           width: 3,
//           material: Cesium.Color.RED,
//         },
//       });
//     } else if (mode === 'area') {
//       this.tempEntity = this.viewer.entities.add({
//         polygon: {
//           hierarchy: new Cesium.CallbackProperty(
//             () => new Cesium.PolygonHierarchy(this.positions),
//             false
//           ),
//           material: Cesium.Color.fromAlpha(Cesium.Color.BLUE, 0.3),
//         },
//       });
//     } else if (mode === 'point') {
//       // nothing to init
//     }
//   }

//   /** clear all measurement artifacts */
//   clearMeasurement() {
//     this.mode = 'none';
//     this.positions = [];
//     this.viewer.entities.removeAll();
//     this.markers = [];
//     this.tempEntity = undefined;
//     // reload tiles/etc if needed…
//   }

//   /** update the temporary line/polygon as points added */
//   private updateShape() {
//     // nothing extra to do: CallbackProperty updates automatically
//   }

//   /** finish measurement: compute & alert result */
//   finishMeasurement() {
//     if (this.mode === 'distance' && this.positions.length > 1) {
//       let length = 0;
//       for (let i = 1; i < this.positions.length; i++) {
//         length += Cesium.Cartesian3.distance(
//           this.positions[i - 1],
//           this.positions[i]
//         );
//       }
//       alert(`Total distance: ${length.toFixed(2)} m`);
//     } else if (this.mode === 'area' && this.positions.length > 2) {
//       // approximate area by triangulating to first point
//       const p0 = this.positions[0];
//       let area = 0;
//       for (let i = 1; i < this.positions.length - 1; i++) {
//         const p1 = this.positions[i];
//         const p2 = this.positions[i + 1];
//         const v1 = Cesium.Cartesian3.subtract(p1, p0, new Cesium.Cartesian3());
//         const v2 = Cesium.Cartesian3.subtract(p2, p0, new Cesium.Cartesian3());
//         const cross = Cesium.Cartesian3.cross(v1, v2, new Cesium.Cartesian3());
//         area += Cesium.Cartesian3.magnitude(cross) * 0.5;
//       }
//       alert(`Approx. surface area: ${area.toFixed(2)} m²`);
//     } else if (this.mode === 'point' && this.positions.length === 1) {
//       const carto = Cesium.Cartographic.fromCartesian(this.positions[0]);
//       const lon = Cesium.Math.toDegrees(carto.longitude);
//       const lat = Cesium.Math.toDegrees(carto.latitude);
//       alert(`Picked point: ${lon.toFixed(6)}, ${lat.toFixed(6)}`);
//     }
//     // Reset after finishing
//     this.clearMeasurement();
//   }
// }


import { Component, type OnInit, type AfterViewInit, type ElementRef, ViewChild } from "@angular/core";
import { Viewer, createWorldTerrainAsync, Cartesian3, Math as CesiumMath, ImageryLayer, OpenStreetMapImageryProvider, HeadingPitchRange, BoundingSphere } from "cesium";
declare var Cesium: any;

@Component({
  selector: "app-cesium-map",
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
export class CesiumMapComponent implements OnInit, AfterViewInit {

  @ViewChild("cesiumContainer", { static: true }) cesiumContainer!: ElementRef;
  viewer!: Viewer;

  // Hanoi coordinates
  private readonly HANOI_LONGITUDE = 105.8542;
  private readonly HANOI_LATITUDE = 21.0285;
  private readonly DEFAULT_HEIGHT = 5000; // meters

  // Đường dẫn cơ sở đến thư mục chính chứa các tileset
  // Số lượng thư mục Tile_X
  private readonly tileCount = 14;
  constructor() {}

  ngOnInit(): void {
    (window as any).CESIUM_BASE_URL = "/assets/cesium";
  }

  ngAfterViewInit(): void {
    this.initCesiumMap();
  }

  // Đường dẫn cơ sở đến thư mục chính chứa các tileset
  private readonly basePath = "http://103.214.9.127:9091/tiles_3d/0f7fb89d-b40b-4463-a7dc-57ad4b960dd81746693470298991055-anhnl";
  // Sử dụng tên thư mục và file theo cấu trúc trong ảnh
  private readonly tileConfigs = [
    {
      folder: 'tiles',
      files: [
        '2d_simplified_3d_mesh.b3dm',
        '2d_simplified_3d_mesh.optimized.b3dm',
        'tileset.json'
      ]
    },
    // Thêm các Tile khác tương tự...
  ];

  // Danh sách URL của các tileset.json
  private readonly tilesetUrls = this.tileConfigs.map(
    config => `${this.basePath}/${config.folder}/${config.files.find(f => f.endsWith('.json'))}`
  );

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
        console.log(`Loading tileset from:  ${url}`);        
        const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
        
        // Xử lý tải các file liên quan nếu cần
        tileset.readyPromise.then(() => {
          console.log(`Tileset ${url} loaded successfully`);
          this.adjustTilePosition(tileset);
        });
        
        this.viewer.scene.primitives.add(tileset);
      }

      // Điều chỉnh camera sau khi tải
      this.adjustCameraView();
    } catch (error) {
      console.error("Lỗi tải tileset:", error);
    }
  }

  private adjustTilePosition(tileset: any): void {
    // Logic điều chỉnh vị trí tileset nếu cần
    const center = Cartesian3.fromDegrees(
      this.HANOI_LONGITUDE, 
      this.HANOI_LATITUDE, 
      this.DEFAULT_HEIGHT
    );
    tileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
  }

  private adjustCameraView(): void {
    const boundingSphere = new BoundingSphere(
      Cartesian3.fromDegrees(this.HANOI_LONGITUDE, this.HANOI_LATITUDE, this.DEFAULT_HEIGHT),
      5000 // Bán kính bao quanh
    );
    
    this.viewer.camera.flyToBoundingSphere(boundingSphere, {
      offset: new HeadingPitchRange(
        CesiumMath.toRadians(0),
        CesiumMath.toRadians(-45),
        1500
      ),
      duration: 3,
    });
  }
}