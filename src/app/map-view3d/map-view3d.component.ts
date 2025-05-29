import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as Cesium from 'cesium';

@Component({
  selector: 'app-map-view3d',
  templateUrl: './map-view3d.component.html',
  styleUrls: ['./map-view3d.component.scss']
})
export class MapView3dComponent implements AfterViewInit {
  @ViewChild('cesiumContainer', { static: false }) cesiumContainer!: ElementRef;
  @ViewChild('compassContainer', { static: false }) compassContainer!: ElementRef;

  private viewer!: Cesium.Viewer;
  private tileset!: Cesium.Cesium3DTileset;
  private isDragging = false;
  private startHeading = 0;  // Góc heading ban đầu (radian)
  private startPitch = 0;    // Góc pitch ban đầu (radian)
  private startX = 0;        // Vị trí X chuột ban đầu
  private startY = 0;        // Vị trí Y chuột ban đầu
  private headingSensitivity = 0.005; // Nhạy của heading (radian/pixel)
  private pitchSensitivity = 0.005;   // Nhạy của pitch (radian/pixel)

  async ngAfterViewInit(): Promise<void> {
    try {
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NGExYzRlMC1hMmJkLTQ4NzctOTZkZC00ZjZlNzBiYjU3OTMiLCJpZCI6MzAzMDM1LCJpYXQiOjE3NDczOTA5ODl9.YDhrNtkz0PjCSiA4gQrERd_-Zc228HxVfR8Vu2P9vOo';

      const osmLayer = new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://a.tile.openstreetmap.org/' })
      );

      this.viewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
        baseLayer: osmLayer,
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false
      });

      const resource = await Cesium.IonResource.fromAssetId(3397561);
      this.tileset = await Cesium.Cesium3DTileset.fromUrl(resource, {
        maximumScreenSpaceError: 16
      });

      this.viewer.scene.primitives.add(this.tileset);
      this.viewer.zoomTo(this.tileset);

      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(105.0, 21.0, 1000),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-45.0),
        }
      });

      // Khởi tạo la bàn
      this.initializeCompass();
    } catch (error) {
      console.error('Error initializing Cesium or loading tileset:', error);
    }
  }

  private initializeCompass() {
    const compass = this.compassContainer.nativeElement;
    const outerRing = compass.querySelector('.out-ring') as HTMLElement;
    const outerImg = compass.querySelector('.compass-outer-img') as HTMLElement;

    // Cập nhật xoay la bàn dựa trên heading của camera
    this.viewer.camera.changed.addEventListener(() => {
      const heading = Cesium.Math.toDegrees(this.viewer.camera.heading);
      outerImg.style.transform = `rotate(${heading}deg)`;
    });

    // Bắt đầu kéo khi nhấn chuột
    outerRing.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.startHeading = this.viewer.camera.heading; // Lưu heading ban đầu (radian)
      this.startPitch = this.viewer.camera.pitch;     // Lưu pitch ban đầu (radian)
      this.startX = e.clientX;                        // Lưu vị trí X ban đầu
      this.startY = e.clientY;                        // Lưu vị trí Y ban đầu
    });

    // Cập nhật hướng camera khi di chuyển chuột
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isDragging) {
        // Tính tổng khoảng cách chuột di chuyển từ vị trí ban đầu
        const totalDeltaX = e.clientX - this.startX;
        const totalDeltaY = e.clientY - this.startY;

        // Tính thay đổi heading và pitch dựa trên chuyển động chuột
        const headingChange = -totalDeltaX * this.headingSensitivity;
        const pitchChange = -totalDeltaY * this.pitchSensitivity;

        // Cập nhật heading và pitch mới
        const newHeading = this.startHeading + headingChange;
        const newPitch = Cesium.Math.clamp(
          this.startPitch + pitchChange,
          Cesium.Math.toRadians(-90),
          Cesium.Math.toRadians(90)
        );

        // Đặt hướng camera mới
        this.viewer.camera.setView({
          orientation: {
            heading: newHeading,
            pitch: newPitch,
            roll: this.viewer.camera.roll
          }
        });
      }
    });

    // Dừng kéo khi thả chuột
    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Đặt lại chế độ xem khi nhấp đúp
    compass.addEventListener('dblclick', () => {
      this.viewer.camera.setView({
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-45.0),
          roll: 0.0
        }
      });
    });
  }
}
