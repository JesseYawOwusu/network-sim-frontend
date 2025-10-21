import { Component ,OnInit, ViewChild, inject,AfterViewInit} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import { InputComponent } from '../input-component/input-component';
import {AuthServices} from '../../services/authService/authService';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, InputComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private router=inject(Router);
  private authService=inject(AuthServices)

  public loginForm!: FormGroup<{ email: FormControl<string | null>; password: FormControl<string | null>; }>;

  ngOnInit(){
    this.loginForm=new FormGroup({
      email:new FormControl('',[Validators.required,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
      password:new FormControl('',[Validators.required]),
    });
  }

  public submitLogin(){
    if(this.loginForm.valid){
      this.authService.login(this.loginForm.controls.email.value??'',this.loginForm.controls.password.value??'')
      .subscribe({
        next:()=> {
          this.router.navigate(['/auth/signup'])
          console.log('User logged in successfully')
        },
        error:(err)=>console.log('We received this login error: ',err),
        complete:()=>console.log('no errors, we are done logging in the user')
      }
        
      )
  }else{
    this.loginForm.markAllAsTouched(); 
    this.loginForm.markAllAsDirty();
  
  }
}

}
