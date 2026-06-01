import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { CustomerService } from '../../services/customers.service';
import { Customer } from '../../models/customer.model';

function emailOrPhone(control: AbstractControl) {
  const value = control.value ?? '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?\d{7,15}$/; 
  if (emailRegex.test(value) || phoneRegex.test(value)) return null;
  return { emailOrPhone: true };
}

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card stack" style="max-width:560px;margin:0 auto">
      @if (showTitle) {
        <div>
          <h2>Nuevo cliente</h2>  
          <p class="muted">
            Regístralo para aplicar descuentos por compras frecuentes.
          </p>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="stack" novalidate>
        <div class="stack" style="gap:6px">
          <label class="muted" style="font-size:13px;font-weight:600">Nombre</label>
          <input
            class="input"
            formControlName="name"
            type="text"
            placeholder="Ej. Juan García"
            autocomplete="name"
          />
          @if (form.get('name')?.touched && form.get('name')?.errors?.['required']) {
            <span class="muted" style="color:var(--danger);font-size:13px">
              El nombre es obligatorio.
            </span>
          }
          @if (form.get('name')?.touched && form.get('name')?.errors?.['minlength']) {
            <span class="muted" style="color:var(--danger);font-size:13px">
              Mínimo 2 caracteres.
            </span>
          }
          @if (form.get('name')?.touched && form.get('name')?.errors?.['maxlength']) {
            <span class="muted" style="color:var(--danger);font-size:13px">
              Máximo 100 caracteres.
            </span>
          }
        </div>

        <div class="stack" style="gap:6px">
          <label class="muted" style="font-size:13px;font-weight:600">
            Email o teléfono
          </label>
          <input
            class="input"
            formControlName="phoneOrEmail"
            type="text"
            placeholder="cliente@correo.com o +525512345678"
            autocomplete="email"
          />
          <span class="muted" style="font-size:12px">
            Usa un email válido o teléfono con código de país (ej. +525512345678).
          </span>
          @if (
            form.get('phoneOrEmail')?.touched &&
            form.get('phoneOrEmail')?.errors?.['required']
          ) {
            <span class="muted" style="color:var(--danger);font-size:13px">
              Este campo es obligatorio.
            </span>
          }
          @if (
            form.get('phoneOrEmail')?.touched &&
            form.get('phoneOrEmail')?.errors?.['emailOrPhone']
          ) {
            <span class="muted" style="color:var(--danger);font-size:13px">
              Formato inválido. Usa email o teléfono con +.
            </span>
          }
        </div>

        @if (errorMessage) {
          <div class="alert alert-error">{{ errorMessage }}</div>
        }

        @if (successMessage) {
          <div
            class="alert"
            style="background: rgba(107,142,78,0.08); color: var(--success); border: 1px solid rgba(107,142,78,0.2)"
          >
            ✓ {{ successMessage }}
          </div>
        }

        <div class="row-between">
          @if (showCancel) {
            <button type="button" class="btn btn-ghost" (click)="cancel.emit()">
              Cancelar
            </button>
          } @else {
            <span></span>
          }
          <button  
            type="submit"
            class="btn btn-primary"
            [disabled]="form.invalid || loading"
            (click)="onSubmit()"
          >
            {{ loading ? 'Guardando…' : 'Registrar cliente' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CustomerFormComponent {
  @Input() showTitle = true;
  @Input() showCancel = false;
  @Output() created = new EventEmitter<Customer>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    phoneOrEmail: ['', [Validators.required, emailOrPhone]],
  });

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private customersService: CustomerService) {}

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const { name, phoneOrEmail } = this.form.value;

    this.customersService
      .create({ name: name!, phoneOrEmail: phoneOrEmail! })
      .subscribe({
        next: (customer) => {
          this.successMessage = `Cliente "${customer.name}" registrado.`;
          this.form.reset();
          this.loading = false;
          this.created.emit(customer);
        },
        error: (err) => {
          const details = err.error?.details;
          this.errorMessage = details
            ? details.map((d: { message: string }) => d.message).join(', ')
            : err.error?.error || 'No pudimos registrar el cliente.';
          this.loading = false;
        },
      });
  }
}
