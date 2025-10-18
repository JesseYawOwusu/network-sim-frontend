import { Component,OnInit, inject} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import {confirmPasswordVaidator} from '../validators/confirmPassword';

@Component({
  selector: 'app-signup',
  imports: [RouterLink,ReactiveFormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements OnInit {
  private router=inject(Router);

  signupForm:FormGroup=new FormGroup({
      username:new FormControl(''),
      email:new FormControl(''),
      password:new FormControl(''),
      confirmPassword:new FormControl('')
  });

  constructor(){}

  ngOnInit(){
    this.signupForm=new FormGroup({
      username:new FormControl('',[Validators.required]),
      email:new FormControl('',[Validators.required,Validators.email]),
      password:new FormControl('',[Validators.required]),
      confirmPassword:new FormControl('',[Validators.required])
    },{validators:confirmPasswordVaidator});
  }

  submitSignup(){
    
    if(this.signupForm.valid){
      console.log(this.signupForm.value);
      this.afterSubmit();
  }else{
      this.signupForm.markAllAsTouched();
  }
}
  
  afterSubmit(){
    this.router.navigate(['/login'])

  }
  
   


}
