import {Routes} from "@angular/router";


export const authRoutes:Routes=[
    {path:'',redirectTo:'login',pathMatch:'full'},
    {path:'login',loadComponent: ()=>import('./login/login').then(m=>m.Login)},
    {path:'signup',loadComponent:()=>import('./signup/signup').then(m=>m.Signup)}
]

