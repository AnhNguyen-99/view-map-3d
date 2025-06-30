import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as Cesium from 'cesium';
// Import với type assertion
import * as DrawerAPI from '@cesium-extends/drawer';

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
  private drawer: any;
  public measurementTools = {
    point: false,
    distance: false,
    area: false
  };

  async ngAfterViewInit(): Promise<void> {
    try {
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NGExYzRlMC1hMmJkLTQ4NzctOTZkZC00ZjZlNzBiYjU3OTMiLCJpZCI6MzAzMDM1LCJpYXQiOjE3NDczOTA5ODl9.YDhrNtkz0PjCSiA4gQrERd_-Zc228HxVfR8Vu2P9vOo';

      const osmLayer = new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://a.tile.openstreetmap.org/' })
      );

      this.viewer = new Cesium.Viewer(this.cesiumContainer.nativeElement, {
        // baseLayer: osmLayer,
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
     await this.initializeDrawer();
      

      // Khởi tạo la bàn
      this.initializeCompass();
    } catch (error) {
      console.error('Error initializing Cesium or loading tileset:', error);
      this.handleInitializationError(error);
    }
  }

  private async initializeDrawer(): Promise<void> {
    try {
      // Thử nhiều cách import khác nhau
      let DrawerClass: any = null;
      
      // Cách 1: Import dynamic
      try {
        const drawerModule = await import('@cesium-extends/drawer');
        DrawerClass = drawerModule.default || drawerModule;
      } catch (importError) {
        console.log('Dynamic import failed, trying global access...');
        
        // Cách 2: Truy cập global
        if (typeof (window as any).CesiumDrawer !== 'undefined') {
          DrawerClass = (window as any).CesiumDrawer;
        } else if (typeof DrawerAPI !== 'undefined') {
          DrawerClass = DrawerAPI.default || DrawerAPI;
        }
      }

      if (!DrawerClass) {
        console.warn('DrawerAPI not available. Measurement tools will be disabled.');
        return;
      }

      // Khởi tạo drawer
      this.drawer = new DrawerClass(this.viewer);
      
      // Kiểm tra xem drawer có method config không
      if (typeof this.drawer.config === 'function') {
        this.drawer.config({
          point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          },
          polyline: {
            width: 3,
            color: Cesium.Color.RED,
            clampToGround: true
          },
          polygon: {
            material: Cesium.Color.BLUE.withAlpha(0.3),
            outline: true,
            outlineColor: Cesium.Color.BLUE,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });
      } else {
        // Nếu không có config method, thử cách khác để cấu hình
        console.log('Using alternative configuration method...');
      }

      // Event handlers
      if (typeof this.drawer.on === 'function') {
        this.drawer.on('drawEnd', (result: any) => {
          console.log('Draw completed:', result);
          this.onDrawComplete(result);
        });
      } else if (typeof this.drawer.addEventListener === 'function') {
        this.drawer.addEventListener('drawEnd', (result: any) => {
          console.log('Draw completed:', result);
          this.onDrawComplete(result);
        });
      }

      console.log('Drawer initialized successfully:', this.drawer);

    } catch (error) {
      console.error('Error initializing drawer:', error);
      console.log('Available drawer methods:', Object.getOwnPropertyNames(this.drawer?.constructor?.prototype || {}));
    }
  }

  private handleInitializationError(error: any): void {
    // Hiển thị thông báo lỗi cho user
    const errorMessage = `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: rgba(255, 0, 0, 0.8); color: white; padding: 20px; border-radius: 5px; z-index: 10000;">
        <h3>Lỗi khởi tạo bản đồ 3D</h3>
        <p>Có lỗi xảy ra khi tải bản đồ. Vui lòng:</p>
        <ul>
          <li>Kiểm tra kết nối internet</li>
          <li>Đảm bảo Cesium Ion token hợp lệ</li>
          <li>Thử tải lại trang</li>
        </ul>
        <button onclick="location.reload()">Tải lại</button>
      </div>
    `;
    
    if (this.cesiumContainer) {
      this.cesiumContainer.nativeElement.innerHTML = errorMessage;
    }
  }

  // Measurement tool methods
  public togglePointMeasurement(): void {
    if (!this.drawer) {
      console.warn('Drawer not initialized');
      return;
    }
    
    this.deactivateAllTools();
    this.measurementTools.point = !this.measurementTools.point;
    
    if (this.measurementTools.point) {
      this.drawer.start('point');
    } else {
      // this.drawer.stop();
    }
  }

  public toggleDistanceMeasurement(): void {
    if (!this.drawer) {
      console.warn('Drawer not initialized');
      return;
    }
    
    this.deactivateAllTools();
    this.measurementTools.distance = !this.measurementTools.distance;
    
    if (this.measurementTools.distance) {
      this.drawer.start('polyline');
    } else {
      // this.drawer.stop();
    }
  }

  public toggleAreaMeasurement(): void {
    if (!this.drawer) {
      console.warn('Drawer not initialized');
      return;
    }
    
    this.deactivateAllTools();
    this.measurementTools.area = !this.measurementTools.area;
    
    if (this.measurementTools.area) {
      this.drawer.start('polygon');
    } else {
      // this.drawer.stop();
    }
  }

  private deactivateAllTools(): void {
    this.measurementTools.point = false;
    this.measurementTools.distance = false;
    this.measurementTools.area = false;
    if (this.drawer) {
      // this.drawer.stop();
    }
  }

  public clearAllMeasurements(): void {
    if (this.drawer) {
      this.drawer.clear();
    }
    // Xóa các entities được tạo thủ công
    this.viewer.entities.removeAll();
    this.deactivateAllTools();
  }

  private onDrawComplete(result: any): void {
    switch (result.type) {
      case 'point':
        this.onPointDrawn(result);
        break;
      case 'polyline':
        this.onPolylineDrawn(result);
        break;
      case 'polygon':
        this.onPolygonDrawn(result);
        break;
    }
  }

  private onPointDrawn(result: any): void {
    const position = result.positions[0];
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;

    console.log(`Điểm: ${longitude.toFixed(6)}°, ${latitude.toFixed(6)}°, ${height.toFixed(2)}m`);
    
    this.viewer.entities.add({
      position: position,
      label: {
        text: `${longitude.toFixed(4)}°\n${latitude.toFixed(4)}°\n${height.toFixed(1)}m`,
        font: '12pt Arial',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -30)
      }
    });
  }

  private onPolylineDrawn(result: any): void {
    const positions = result.positions;
    let totalDistance = 0;

    for (let i = 0; i < positions.length - 1; i++) {
      const distance = Cesium.Cartesian3.distance(positions[i], positions[i + 1]);
      totalDistance += distance;
    }

    console.log(`Tổng khoảng cách: ${totalDistance.toFixed(2)}m`);

    const midpoint = Cesium.Cartesian3.midpoint(
      positions[positions.length - 2], 
      positions[positions.length - 1], 
      new Cesium.Cartesian3()
    );

    this.viewer.entities.add({
      position: midpoint,
      label: {
        text: `${totalDistance.toFixed(1)}m`,
        font: '14pt Arial',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30)
      }
    });
  }

  private onPolygonDrawn(result: any): void {
    const positions = result.positions;
    const area = this.calculatePolygonArea(positions);
    
    console.log(`Diện tích: ${area.toFixed(2)}m²`);

    const centroid = this.calculateCentroid(positions);

    this.viewer.entities.add({
      position: centroid,
      label: {
        text: `${area.toFixed(1)}m²`,
        font: '14pt Arial',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE
      }
    });
  }

  private calculatePolygonArea(positions: Cesium.Cartesian3[]): number {
    const cartographics = positions.map(pos => Cesium.Cartographic.fromCartesian(pos));
    
    let area = 0;
    const n = cartographics.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += cartographics[i].longitude * cartographics[j].latitude;
      area -= cartographics[j].longitude * cartographics[i].latitude;
    }
    
    area = Math.abs(area) / 2;
    
    const earthRadius = 6371000;
    return area * earthRadius * earthRadius;
  }

  private calculateCentroid(positions: Cesium.Cartesian3[]): Cesium.Cartesian3 {
    let x = 0, y = 0, z = 0;
    
    positions.forEach(pos => {
      x += pos.x;
      y += pos.y;
      z += pos.z;
    });
    
    return new Cesium.Cartesian3(
      x / positions.length,
      y / positions.length,
      z / positions.length
    );
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
