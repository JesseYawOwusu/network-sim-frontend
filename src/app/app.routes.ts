import { Routes } from '@angular/router';

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
  }
];
