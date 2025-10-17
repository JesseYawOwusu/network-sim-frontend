import { Routes } from '@angular/router';
import {Login} from './authentication/login/login';
import {Signup} from './authentication/signup/signup';

import {authRoutes} from './authentication/auth.routes';

export const routes: Routes = [
    {path:'', children:authRoutes}
];
