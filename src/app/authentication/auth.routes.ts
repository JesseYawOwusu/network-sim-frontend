import {Routes} from "@angular/router";
import {Login} from "./login/login";
import {Signup} from "./signup/signup";

export const authRoutes:Routes=[
    {path:'',redirectTo:'login',pathMatch:'full'},
    {path:'login',loadComponent: ()=>import('./login/login').then(m=>m.Login)},
    {path:'signup',loadComponent:()=>import('./signup/signup').then(m=>m.Signup)}
]

