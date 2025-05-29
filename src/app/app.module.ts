import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CesiumMapComponent } from './cesium-map/cesium-map.component';
import { ObjToGlbConverterComponent } from './obj-to-glb-converter/obj-to-glb-converter.component';
import { ViewMapComponent } from './view-map/view-map.component';
import { MapComponent } from './map/map.component';
import { HttpClientModule } from '@angular/common/http';
import { CesiumViewerComponent } from './cesium-viewer/cesium-viewer.component';
import { MapView3dComponent } from './map-view3d/map-view3d.component';
import {NgOptimizedImage} from "@angular/common";

@NgModule({
  declarations: [
    AppComponent,
    CesiumMapComponent,
    ObjToGlbConverterComponent,
    ViewMapComponent,
    MapComponent,
    CesiumViewerComponent,
    MapView3dComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgOptimizedImage
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
