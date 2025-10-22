import { Injectable } from '@angular/core';

import moment from "moment";
import {HttpClient} from '@angular/common/http';
import {Observable,tap } from 'rxjs';
import {User,LoggedInUser} from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthServices {
  private API_URL='';
  
 

  constructor(private http:HttpClient){}

  
  

  public login(email:string,password:string):Observable<User>{
    return this.http.post<User>(`${this.API_URL}signin`,{email,password})
    .pipe(
      tap((response)=>this.setLoggedInUser(response), 

      )
      
    )
      
  }


  public signup(newUser:User):Observable<LoggedInUser>{
    return this.http.post<LoggedInUser>(`${this.API_URL}signup`,newUser)
    .pipe(
      tap((response)=>this.setLoggedInUser(response)),
    )

  }

  private setLoggedInUser(authResponse:any){
    const expiresAt=moment().add(authResponse.expiresIn,'second')

    localStorage.setItem('user_token',authResponse.token)
    localStorage.setItem('token_expiration',JSON.stringify(expiresAt.valueOf()))
  }

  public logout(){
    localStorage.removeItem('user_token')
    localStorage.removeItem('token_expiration')
  }

  public isLoggedIn(){
    return moment().isBefore(this.getExpiration());
  }

  public getExpiration(){
    const expiration=localStorage.getItem('token_expiration') || '0'
    const expiresAt=JSON.parse(expiration);
    return moment(expiresAt)
  }

  public isLoggedOut(){
    return !this.isLoggedIn();
  }
}
