import { Component,OnInit, inject,ViewChild, viewChild} from '@angular/core';
import {KeyValuePipe} from '@angular/common';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import {MatSnackBar} from '@angular/material/snack-bar';
import {confirmPasswordValidator} from '../validators/confirmPassword';
import {InputComponent} from '../input-component/input-component';
import {AuthServices} from '../../services/authService/authService';
import { SwalDirective, SwalComponent, SwalPortalDirective,SwalPortalTargets} from '@sweetalert2/ngx-sweetalert2';


@Component({
  selector: 'app-signup',
  imports: [RouterLink, ReactiveFormsModule, InputComponent, SwalDirective, SwalComponent, SwalPortalDirective],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements OnInit {
  private router=inject(Router);
  private authService=inject(AuthServices)

  public errorMessage='';
  @ViewChild('errorSwal')
  errorSwal!:SwalComponent

  

  signupForm!:FormGroup<{username:FormControl<string|null>,email:FormControl<string|null>,password:FormControl<string|null>,confirmPassword:FormControl<string|null>,role:FormControl<string|null>}>;

  constructor(public readonly swalTargets:SwalPortalTargets){}

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
        error:(err)=>{
          this.errorMessage=err.error.error
          this.errorSwal.fire()
          console.log('We received this login error: ',err.error.error)
        },
        complete:()=>{
          this.router.navigate(['/auth/login'])
          console.log('no errors, we are done logging in the user')
    }})
      
      
  }else{
      this.signupForm.markAllAsTouched();
  }
}

  
   


}
