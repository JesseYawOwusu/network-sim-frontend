import { Routes } from '@angular/router';
import {authRoutes} from './authentication/auth.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/device-simulation',
    pathMatch: 'full'
  },
  {
    path: 'device-simulation',
    loadComponent: () => import('./components/device-display/device-display.component').then(m => m.DeviceDisplayComponent)
  },
  {
    path: 'scenario-list',
    loadComponent: () => import('./components/scenario-list/scenario-list.component').then(m => m.ScenarioListComponent)
  },
  {
    path: 'scenario-editor',
    loadComponent: () => import('./components/scenario-editor/scenario-editor.component').then(m => m.ScenarioEditorComponent)
  },
  {path:'auth', children:authRoutes}
];
