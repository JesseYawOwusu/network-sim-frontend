import { Component,Input } from '@angular/core';
import {ReactiveFormsModule,FormControl} from '@angular/forms';
import {KeyValuePipe} from '@angular/common';
@Component({
  selector: 'app-input-component',
  imports: [ReactiveFormsModule, KeyValuePipe],
  templateUrl: './input-component.html',
  styleUrl: './input-component.css'
})
export class InputComponent {
  @Input() controlName=new FormControl('');
  @Input() label="";
 

  public errorMessages:Record<string, string>={
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    passwordMismatch: 'Passwords do not match.'
  
  }
  static controlName: any;

}
