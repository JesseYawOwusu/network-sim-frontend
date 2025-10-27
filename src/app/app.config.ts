import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import {provideHttpClient,withInterceptors} from '@angular/common/http';
import {provideSweetAlert2}  from "@sweetalert2/ngx-sweetalert2";
import {AuthInterceptor} from './interceptors/auth-interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideSweetAlert2()
  ]
};
