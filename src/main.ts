import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
// Set the base URL for Cesium assets
(window as any).CESIUM_BASE_URL = "/assets/cesium"

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
