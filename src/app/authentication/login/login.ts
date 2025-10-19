import { Component ,OnInit, inject} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private router=inject(Router);
  loginForm!: FormGroup<{ username: FormControl<string | null>; password: FormControl<string | null>; }>;


  constructor(){}

  ngOnInit(){
    this.loginForm=new FormGroup({
      username:new FormControl('',[Validators.required]),
      password:new FormControl('',[Validators.required]),
    });
  }

  submitLogin(){
    if(this.loginForm.valid){
      console.log(this.loginForm.value);
      this.afterSubmit();
  }else{
      this.loginForm.markAllAsTouched();
  }
}
  
  afterSubmit(){
    this.router.navigate(['/signup'])

  }
  
   


}
