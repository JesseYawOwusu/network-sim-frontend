import { Injectable } from '@angular/core';

import moment from "moment";
import {HttpClient,HttpErrorResponse} from '@angular/common/http';
import {Subject,tap } from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {User} from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthServices {
  private API_URL='https://genethliacally-ling-epeirogenic.ngrok-free.dev/api/authentication/';
  
 

  constructor(private http:HttpClient){}

  
  

  public login(email:string,password:string){
    return this.http.post(`${this.API_URL}signin`,{email,password})
    .pipe(
      tap((response)=>this.setLoggedInUser(response), 

      )
      
    )
      
  }


  public signup(newUser:User){
    return this.http.post(`${this.API_URL}signup`,newUser)
    .pipe(
      tap((response)=>this.setLoggedInUser(response)),
    )

  }

  private setLoggedInUser(authResponse:any){
    const expiresAt=moment().add(authResponse.expiresIn,'second')

    localStorage.setItem('user_token',authResponse.token)
    localStorage.setItem('expiry_time',JSON.stringify(expiresAt.valueOf()))
  }

  public logout(){
    localStorage.removeItem('user_token')
    localStorage.removeItem('expiry_time')
  }

  public isLoggedIn(){
    return moment().isBefore(this.getExpiration());
  }

  public getExpiration(){
    const expiration=localStorage.getItem('expirary_time') || '0'
    const expiresAt=JSON.parse(expiration);
    return moment(expiresAt)
  }

  public isLoggedOut(){
    return !this.isLoggedIn();
  }
}
