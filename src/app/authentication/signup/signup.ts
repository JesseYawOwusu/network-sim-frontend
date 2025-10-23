import { Component,OnInit, inject,ViewChild,OnDestroy} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import {confirmPasswordValidator} from '../validators/confirmPassword';
import {InputComponent} from '../input-component/input-component';
import {AuthServices} from '../../services/authService/authService';
import { SwalComponent, SwalPortalDirective,SwalPortalTargets} from '@sweetalert2/ngx-sweetalert2';
import {Subject, takeUntil} from 'rxjs'



@Component({
  selector: 'app-signup',
  imports: [RouterLink, ReactiveFormsModule, InputComponent,SwalComponent, SwalPortalDirective],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements OnInit,OnDestroy {
  private router=inject(Router);
  private authService=inject(AuthServices)
  private _destroy$=new Subject<void>();

  public errorMessage='';
  @ViewChild('errorSwal')
  errorSwal!:SwalComponent

  

  signupForm!:FormGroup<{username:FormControl<string|null>,email:FormControl<string|null>,password:FormControl<string|null>,confirmPassword:FormControl<string|null>}>;

  constructor(public readonly swalTargets:SwalPortalTargets){}

  ngOnInit(){
    this.signupForm=new FormGroup({
      username:new FormControl('',[Validators.required]),
      email:new FormControl('',[Validators.required,Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]),
      password:new FormControl('',[Validators.required]),
      confirmPassword:new FormControl('',[Validators.required]),

    },{validators:confirmPasswordValidator});
  }

  

  public submitSignup(){
    
    if(this.signupForm.valid){
      const newUser={
        username:this.signupForm.controls.username.value || '',
        password:this.signupForm.controls.password.value || '',
        email:this.signupForm.controls.email.value||'',
      }
      this.authService.signup(newUser)
      .subscribe({
        next:()=> {
          this.router.navigate(['/auth/login'])
          takeUntil(this._destroy$)
        },
        error:(err)=>{
          this.errorMessage=err?.error?.error||err?.message||'Unknown error'
          this.errorSwal.fire()
        },
})
      
      
  }else{
      this.signupForm.markAllAsTouched();
  }
}


ngOnDestroy(){
    this._destroy$.next();
    this._destroy$.complete();
  }

  
   


}
