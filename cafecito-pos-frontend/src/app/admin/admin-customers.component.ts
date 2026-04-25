import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../services/customers.service';
import { Customer } from '../models/customer.model';
import { CustomerFormComponent } from '../customers/customer-form/customer-form';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerFormComponent],
  template: `
    <div class="stack">
      <div class="row-between">
        <div>
          <h1>Administrar clientes</h1>
          <p class="muted">
            Consulta clientes registrados y agrega nuevos.
          </p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(true)">
          + Nuevo cliente
        </button>
      </div>

      <div class="admin-toolbar">
        <input
          class="input"
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          [ngModel]="query()"
          (ngModelChange)="onSearch($event)"
        />
        <span class="muted" style="font-size:13px">
          {{ customers().length }} cliente(s)
        </span>
      </div>

      @if (loading()) {
        <div class="empty-state"><p>Cargando…</p></div>
      } @else if (loadError()) {
        <div class="alert alert-error">{{ loadError() }}</div>
      } @else if (customers().length === 0) {
        <div class="empty-state">
          <div class="empty-state__icon">👥</div>
          <h3>Sin clientes</h3>
          <p>Registra el primer cliente para empezar a aplicar descuentos.</p>
        </div>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th class="text-right">Compras</th>
              <th class="text-right">Descuento actual</th>
            </tr>
          </thead>
          <tbody>
            @for (c of customers(); track c.id) {
              <tr>
                <td><strong>{{ c.name }}</strong></td>
                <td class="muted">{{ c.phoneOrEmail }}</td>
                <td class="text-right">{{ c.purchasesCount }}</td>
                <td class="text-right">
                  @if (getDiscount(c.purchasesCount) > 0) {
                    <span class="badge badge-accent">
                      {{ getDiscount(c.purchasesCount) }}%
                    </span>
                  } @else {
                    <span class="muted">—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="showForm.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <app-customer-form
            [showCancel]="true"
            (created)="onCreated($event)"
            (cancel)="showForm.set(false)"
          />
        </div>
      </div>
    }
  `,
})
export class AdminCustomersComponent implements OnInit {
  customers = signal<Customer[]>([]);
  query = signal('');
  loading = signal(true);
  loadError = signal('');
  showForm = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private customersService: CustomerService) {}

  ngOnInit() {
    this.load();
  }

  onSearch(value: string) {
    this.query.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 250);
  }

  load() {
    this.loading.set(true);
    this.loadError.set('');
    this.customersService.getAll(this.query() || undefined).subscribe({
      next: (res) => {
        this.customers.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No pudimos cargar los clientes.');
        this.loading.set(false);
      },
    });
  }

  onCreated(_: Customer) {
    this.showForm.set(false);
    this.load();
  }

  getDiscount(count: number): number {
    if (count >= 8) return 15;
    if (count >= 4) return 10;
    if (count >= 1) return 5;
    return 0;
  }
}
