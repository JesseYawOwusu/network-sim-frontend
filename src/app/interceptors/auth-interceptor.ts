import {inject} from '@angular/core';
import { HttpInterceptorFn,HttpRequest,HttpHandlerFn} from '@angular/common/http';
import {AuthServices} from '../services/authService/authService';


export const AuthInterceptor: HttpInterceptorFn = (req:HttpRequest<unknown>, next:HttpHandlerFn) => {
  const token=localStorage.getItem('user_token')

  if(req.url.includes('/signup') || req.url.includes('/login')){
    return next(req)
  }

  const newRequest=req.clone({
    setHeaders:{
      Authorization:`Bearer ${token}`
    }
  })
  return next(newRequest)
};
