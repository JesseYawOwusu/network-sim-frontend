import { Component,OnInit, inject} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";


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
      email:new FormControl(''),
      password:new FormControl('',[Validators.maxLength(8),Validators.minLength(4)]),
      confirmPassword:new FormControl('',[Validators.maxLength(8),Validators.minLength(4)])
    })
  }

  confirmPassword(){

    
  }

  submitSignup(){
    console.log(this.signupForm.value);
  }
  
  afterSubmit(){
    this.router.navigate(['/login'])

  }
  
   


}
