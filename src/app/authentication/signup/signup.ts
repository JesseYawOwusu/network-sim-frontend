import { Component,OnInit, inject} from '@angular/core';
import {KeyValuePipe} from '@angular/common';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import {confirmPasswordValidator} from '../validators/confirmPassword';
import {InputComponent} from '../input-component/input-component';

@Component({
  selector: 'app-signup',
  imports: [RouterLink,ReactiveFormsModule,InputComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements OnInit {
  private router=inject(Router);

  signupForm!:FormGroup<{username:FormControl<string|null>,email:FormControl<string|null>,password:FormControl<string|null>,confirmPassword:FormControl<string|null>,role:FormControl<string|null>}>;

  constructor(){}

  ngOnInit(){
    this.signupForm=new FormGroup({
      username:new FormControl('',[Validators.required]),
      email:new FormControl('',[Validators.required,Validators.email]),
      password:new FormControl('',[Validators.required]),
      confirmPassword:new FormControl('',[Validators.required]),
      role:new FormControl('',[Validators.required])
    },{validators:confirmPasswordValidator});
  }

  public submitSignup(){
    
    if(this.signupForm.valid){
      
      this.afterSubmit();
  }else{
      this.signupForm.markAllAsTouched();
  }
}
  
  public afterSubmit(){
    this.router.navigate(['/auth/login'])
  }
  
   


}
