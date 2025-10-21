import { Injectable } from '@angular/core';
import moment from "moment";
import {HttpClient} from '@angular/common/http';
import { Observable,tap,shareReplay } from 'rxjs';
import {User} from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthServices {
 

  constructor(private http:HttpClient){}
  

  public login(email:string,password:string){
    return this.http.post('https://genethliacally-ling-epeirogenic.ngrok-free.dev/api/authentication/signin',{email,password})
    .pipe(
      tap(()=>this.setLoggedInUser),
      shareReplay()
    )
      
  }

  public signup(newUser:User){
    return this.http.post('https://genethliacally-ling-epeirogenic.ngrok-free.dev/api/authentication/signup',newUser)
    .pipe(
      tap(()=>this.setLoggedInUser),
      shareReplay()
    )

  }

  private setLoggedInUser(authResponse:any){
    const expiresAt=moment().add(authResponse.expiresIn,'second')

    localStorage.setItem('user_token',authResponse.token)
    localStorage.setItem('expirary_time',JSON.stringify(expiresAt.valueOf()))
  }

  public logout(){
    localStorage.removeItem('user_token')
    localStorage.removeItem('expirary_time')
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
