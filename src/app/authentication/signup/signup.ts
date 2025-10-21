import { Component,OnInit, inject} from '@angular/core';
import {KeyValuePipe} from '@angular/common';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import {confirmPasswordValidator} from '../validators/confirmPassword';
import {InputComponent} from '../input-component/input-component';
import {AuthServices} from '../../services/authService/authService';

@Component({
  selector: 'app-signup',
  imports: [RouterLink,ReactiveFormsModule,InputComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements OnInit {
  private router=inject(Router);
  private authService=inject(AuthServices)

  signupForm!:FormGroup<{username:FormControl<string|null>,email:FormControl<string|null>,password:FormControl<string|null>,confirmPassword:FormControl<string|null>,role:FormControl<string|null>}>;

  constructor(){}

  ngOnInit(){
    this.signupForm=new FormGroup({
      username:new FormControl('',[Validators.required]),
      email:new FormControl('',[Validators.required,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
      password:new FormControl('',[Validators.required]),
      confirmPassword:new FormControl('',[Validators.required]),
      role:new FormControl('',[Validators.required])
    },{validators:confirmPasswordValidator});
  }

  public submitSignup(){
    
    if(this.signupForm.valid){
      const newUser={
        username:this.signupForm.controls.username.value || '',
        password:this.signupForm.controls.password.value || '',
        email:this.signupForm.controls.email.value||'',
        role:this.signupForm.controls.role.value||''
      }
      this.authService.signup(newUser)
      .subscribe({
        next:()=> {
          this.router.navigate(['/auth/signup'])
          console.log('User logged in successfully')
        },
        error:(err)=>console.log('We received this login error: ',err),
        complete:()=>console.log('no errors, we are done logging in the user')
      })
      
      this.afterSubmit();
  }else{
      this.signupForm.markAllAsTouched();
  }
}
  
  public afterSubmit(){
    this.router.navigate(['/auth/login'])
  }
  
   


}
