import { Routes } from '@angular/router';


import {authRoutes} from './authentication/auth.routes';

export const routes: Routes = [
    {path:'auth', children:authRoutes},
];
