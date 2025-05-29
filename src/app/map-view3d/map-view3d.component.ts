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
  private startAngle = 0;

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
      console.error('Lỗi khi khởi tạo Cesium hoặc tải tileset:', error);
    }
  }

  focusTileset() {
    if (this.viewer && this.tileset) {
      this.viewer.flyTo(this.tileset);
    }
  }

  private initializeCompass() {
    const compass = this.compassContainer.nativeElement;
    const compassImg = compass.querySelector('.compass-img') as HTMLElement;

    // Cập nhật xoay la bàn theo camera
    this.viewer.camera.changed.addEventListener(() => {
      const heading = Cesium.Math.toDegrees(this.viewer.camera.heading);
      compassImg.style.transform = `rotate(${heading}deg)`;
    });

    // Xử lý sự kiện chuột
    compass.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      this.isDragging = true;
      const rect = compass.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX); // Sử dụng Math.atan2 của JavaScript
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isDragging) {
        const rect = compass.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX); // Sử dụng Math.atan2 của JavaScript
        const angleDiff = (currentAngle - this.startAngle) * (180 / Math.PI);

        // Cập nhật heading của camera
        const currentHeading = Cesium.Math.toDegrees(this.viewer.camera.heading);
        const newHeading = currentHeading - angleDiff;
        this.viewer.camera.setView({
          orientation: {
            heading: Cesium.Math.toRadians(newHeading),
            pitch: this.viewer.camera.pitch,
            roll: this.viewer.camera.roll
          }
        });

        this.startAngle = currentAngle;
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
  }
}
