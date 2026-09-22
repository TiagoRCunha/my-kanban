import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './infrastructure/auth/auth.interceptor';
import { provideRepositoryVeneer } from './infrastructure/di/repository-veneer.providers';
import { detectStorageMode } from './infrastructure/local/storage/storage-driver.factory';

// Feature flag for the offline variant: the Electron shell exposes `window.api`
// and selects the local veneer (@angular built locally), while the normal web
// application keeps using the Spring Boot REST API.
const storageMode = detectStorageMode();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideRepositoryVeneer(storageMode === 'desktop' ? 'desktop' : 'http'),
  ],
};
