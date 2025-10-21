import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/scenario-editor',
    pathMatch: 'full'
  },
  {
    path: 'scenario-editor',
    loadComponent: () => import('./components/scenario-editor/scenario-editor.component').then(m => m.ScenarioEditorComponent)
  }
];
