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
  Transforms,
  Math as CesiumMath,
  Quaternion,
  Matrix3
} from 'cesium';

@Component({
  selector: 'app-map-view3d',
  templateUrl: './map-view3d.component.html',
  styleUrls: ['./map-view3d.component.scss']
})
export class MapView3dComponent implements AfterViewInit {
  @ViewChild('cesiumContainer', { static: false }) cesiumContainer!: ElementRef;

  private viewer!: Viewer;
  private tileset!: Cesium3DTileset;
  private isDragging = false;
  private startMousePosition: { x: number, y: number } | null = null;
  private targetPosition: Cartesian3 | null = null; // Điểm trung tâm để xoay quanh

  async ngAfterViewInit(): Promise<void> {
    Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1NGExYzRlMC1hMmJkLTQ4NzctOTZkZC00ZjZlNzBiYjU3OTMiLCJpZCI6MzAzMDM1LCJpYXQiOjE3NDczOTA5ODl9.YDhrNtkz0PjCSiA4gQrERd_-Zc228HxVfR8Vu2P9vOo';

    const osmLayer = new ImageryLayer(
      new OpenStreetMapImageryProvider({ url: 'https://a.tile.openstreetmap.org/' })
    );
    this.viewer = new Viewer(this.cesiumContainer.nativeElement, {
      baseLayer: osmLayer,
      baseLayerPicker: false
    });

    const resource = await IonResource.fromAssetId(3397561);
    this.tileset = await Cesium3DTileset.fromUrl(resource);

    this.viewer.scene.primitives.add(this.tileset);
    this.viewer.zoomTo(this.tileset).then(() => {
      // Lấy điểm trung tâm từ bounding sphere của tileset
      this.targetPosition = Cartesian3.clone(this.tileset.boundingSphere.center);
    });

    // Lấy tham chiếu đến compass và thêm sự kiện
    const compassElement = document.getElementById('compass');
    if (compassElement) {
      compassElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    }
  }

  // Khi người dùng nhấn chuột vào compass
  private onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.startMousePosition = { x: event.clientX, y: event.clientY };

    // Thêm sự kiện mousemove và mouseup trên document
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.startMousePosition || !this.targetPosition) return;

    const deltaX = event.clientX - this.startMousePosition.x;
    const deltaY = event.clientY - this.startMousePosition.y;
    this.startMousePosition = { x: event.clientX, y: event.clientY };

    const sensitivity = 0.01; // Độ nhạy, có thể điều chỉnh

    // Lấy pitch hiện tại của camera
    const currentPitch = this.viewer.camera.pitch;

    // Tính pitch mới dựa trên deltaY và giới hạn trong khoảng -85 đến 85 độ
    const pitchChange = -deltaY * sensitivity;
    const newPitch = CesiumMath.clamp(
      currentPitch + pitchChange,
      CesiumMath.toRadians(-85),
      CesiumMath.toRadians(85)
    );

    // Tạo quaternion cho xoay ngang (quanh trục up)
    const up = Cartesian3.normalize(this.targetPosition, new Cartesian3());
    const horizontalRotation = Quaternion.fromAxisAngle(up, -deltaX * sensitivity, new Quaternion());

    // Tạo instance HeadingPitchRoll cho xoay dọc
    const hpr = new HeadingPitchRoll(0, newPitch - currentPitch, 0);
    const verticalRotation = Quaternion.fromHeadingPitchRoll(hpr, new Quaternion());

    // Kết hợp xoay ngang và dọc
    const totalRotation = Quaternion.multiply(horizontalRotation, verticalRotation, new Quaternion());

    // Tính vị trí camera mới
    const offset = Cartesian3.subtract(this.viewer.camera.position, this.targetPosition, new Cartesian3());
    const rotationMatrix = Matrix3.fromQuaternion(totalRotation, new Matrix3());
    const rotatedOffset = Matrix3.multiplyByVector(rotationMatrix, offset, new Cartesian3());
    const newPosition = Cartesian3.add(this.targetPosition, rotatedOffset, new Cartesian3());

    // Cập nhật vị trí và hướng camera
    this.viewer.camera.position = newPosition;
    const direction = Cartesian3.normalize(Cartesian3.subtract(this.targetPosition, newPosition, new Cartesian3()), new Cartesian3());
    this.viewer.camera.direction = direction;

    // Điều chỉnh vector up
    const right = Cartesian3.cross(direction, this.viewer.camera.up, new Cartesian3());
    const newUp = Cartesian3.cross(right, direction, new Cartesian3());
    this.viewer.camera.up = Cartesian3.normalize(newUp, new Cartesian3());
  }

  // Khi người dùng thả chuột
  private onMouseUp(): void {
    this.isDragging = false;
    this.startMousePosition = null;

    // Xóa các sự kiện mousemove và mouseup
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }
}
