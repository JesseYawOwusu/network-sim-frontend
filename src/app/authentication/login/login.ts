import { Component ,OnInit, ViewChild, inject,OnDestroy} from '@angular/core';
import {RouterLink,Router} from "@angular/router";
import {ReactiveFormsModule,FormControl,FormGroup,Validators} from "@angular/forms";
import { InputComponent } from '../input-component/input-component';
import {AuthServices} from '../../services/authService/authService';
import { SwalComponent, SwalPortalDirective,SwalPortalTargets} from '@sweetalert2/ngx-sweetalert2';
import {Subject, takeUntil} from 'rxjs'


@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, InputComponent,SwalComponent,SwalPortalDirective],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit,OnDestroy {
  private router=inject(Router);
  private authService=inject(AuthServices);
  private _destroy$=new Subject<void>();

  public errorMessage='';
  @ViewChild('errorSwal')
  errorSwal!:SwalComponent

  constructor(public readonly swalTargets:SwalPortalTargets){

  }

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
        next:()=>
          {
            this.router.navigate(['/auth/signup']);
            takeUntil(this._destroy$)
          },
        error:(err)=>
          {
            this.errorMessage=err.error.error
            this.errorSwal.fire()
          },
        
      }
        
      )
  }else{
    this.loginForm.markAllAsTouched(); 
    this.loginForm.markAllAsDirty();
  
  }
}


ngOnDestroy(){
    this._destroy$.next();
    this._destroy$.complete();
  }


}
