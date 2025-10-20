import { Component ,OnInit, ViewChild, inject,AfterViewInit} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import { InputComponent } from '../input-component/input-component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, InputComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private router=inject(Router);
  loginForm!: FormGroup<{ username: FormControl<string | null>; password: FormControl<string | null>; }>;

  ngOnInit(){
    this.loginForm=new FormGroup({
      username:new FormControl('',[Validators.required]),
      password:new FormControl('',[Validators.required]),
    });
  }

  submitLogin(){
    if(this.loginForm.valid){
     
      this.afterSubmit();
  }else{
   
    this.loginForm.markAllAsTouched(); 
  }
}
  
  afterSubmit(){
    this.router.navigate(['/auth/signup'])
  }
}
