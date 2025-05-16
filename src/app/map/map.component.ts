import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CesiumService } from './cesium.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  isLoading = true;

  constructor(private cesiumService: CesiumService) {}

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.cesiumService.initializeScene('cesiumContainer');
    } catch (error) {
      console.error('Map initialization failed:', error);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.cesiumService.destroyViewer();
    const container = document.getElementById('cesiumContainer');
    if (container) container.innerHTML = '';
  }
}