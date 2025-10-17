import { Component,OnInit, inject} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup} from "@angular/forms";

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
      username:new FormControl(''),
      email:new FormControl(''),
      password:new FormControl(''),
      confirmPassword:new FormControl('')
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
