import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CustomerService } from '../../services/customers.service';
import { Customer } from '../../models/customer.model';
import { environment } from '../../../environments/environments';

type Step = 'cart' | 'customer' | 'confirm' | 'ticket';
type PaymentMethod = 'cash' | 'card' | 'transfer';

interface TicketItem {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}
interface Ticket {
  saleId: string;
  timestamp: string;
  storeName: string;
  items: TicketItem[];
  subtotal: number;
  discount: string;
  total: number;
  paymentMethod: PaymentMethod;
}

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="stack">
      <div>
        <h1>Checkout</h1>
        <p class="muted">Completa la venta en cuatro pasos.</p>
      </div>

      <nav class="stepper">
        <span class="step" [class.active]="step() === 'cart'" [class.done]="isDone('cart')">
          <span class="step__num">{{ isDone('cart') ? '✓' : '1' }}</span> Comanda
        </span>
        <span class="step-sep">—</span>
        <span class="step" [class.active]="step() === 'customer'" [class.done]="isDone('customer')">
          <span class="step__num">{{ isDone('customer') ? '✓' : '2' }}</span> Cliente
        </span>
        <span class="step-sep">—</span>
        <span class="step" [class.active]="step() === 'confirm'" [class.done]="isDone('confirm')">
          <span class="step__num">{{ isDone('confirm') ? '✓' : '3' }}</span> Confirmar
        </span>
        <span class="step-sep">—</span>
        <span class="step" [class.active]="step() === 'ticket'">
          <span class="step__num">4</span> Ticket
        </span>
      </nav>

      <!-- PASO 1: comanda -->
      @if (step() === 'cart') {
        <section class="card stack">
          <h2>Tu comanda</h2>

          @if (cartService.cartItems().length === 0) {
            <div class="empty-state">
              <div class="empty-state__icon">🛒</div>
              <h3>Aún no hay productos</h3>
              <p>Agrega productos desde el Menú para continuar.</p>
              <a routerLink="/products" class="btn btn-primary" style="margin-top:12px">
                Ir al Menú
              </a>
            </div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-right">Precio</th>
                  <th>Cantidad</th>
                  <th class="text-right">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of cartService.cartItems(); track item.product.id) {
                  <tr>
                    <td>{{ item.product.name }}</td>
                    <td class="text-right">\${{ item.product.price.toFixed(2) }}</td>
                    <td>
                      <div class="qty-control">
                        <button
                          (click)="cartService.updateQuantity(item.product.id, item.quantity - 1)"
                          aria-label="Quitar uno"
                        >−</button>
                        <span>{{ item.quantity }}</span>
                        <button
                          (click)="cartService.updateQuantity(item.product.id, item.quantity + 1)"
                          [disabled]="item.quantity >= item.product.stock"
                          aria-label="Agregar uno"
                        >+</button>
                      </div>
                    </td>
                    <td class="text-right">
                      \${{ (item.product.price * item.quantity).toFixed(2) }}
                    </td>
                    <td class="text-right">
                      <button
                        class="btn btn-danger btn-sm"
                        (click)="cartService.removeProduct(item.product.id)"
                      >Quitar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="row-between">
              <span class="muted">{{ cartService.cartItems().length }} producto(s)</span>
              <h2>Subtotal: \${{ cartService.subtotal().toFixed(2) }}</h2>
            </div>

            <div class="row-between">
              <a routerLink="/products" class="btn btn-ghost">← Seguir comprando</a>
              <button
                class="btn btn-primary"
                [disabled]="cartService.cartItems().length === 0"
                (click)="step.set('customer')"
              >
                Continuar →
              </button>
            </div>
          }
        </section>
      }

      <!-- PASO 2: CLIENTE -->
      @if (step() === 'customer') {
        <section class="card stack">
          <h2>¿Hay un cliente registrado?</h2>
          <p class="muted">Si el cliente es recurrente, búscalo para aplicar su descuento.</p>

          <input
            class="input"
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            [ngModel]="customerQuery()"
            (ngModelChange)="onCustomerSearch($event)"
          />

          @if (searchingCustomers()) {
            <p class="muted">Buscando…</p>
          }

          @if (!searchingCustomers() && customerResults().length > 0) {
            <div>
              @for (c of customerResults(); track c.id) {
                <div class="customer-result" (click)="selectCustomer(c)">
                  <div>
                    <strong>{{ c.name }}</strong>
                    <div class="muted" style="font-size:13px">{{ c.phoneOrEmail }}</div>
                  </div>
                  <span class="badge badge-accent">
                    {{ c.purchasesCount }} compras · {{ getDiscount(c.purchasesCount) }}% desc.
                  </span>
                </div>
              }
            </div>
          }

          @if (customerQuery() && !searchingCustomers() && customerResults().length === 0) {
            <p class="muted">
              No encontramos ningún cliente. Puedes continuar sin cliente.
            </p>
          }

          @if (selectedCustomer()) {
            <div class="alert" style="background: rgba(107,142,78,0.08); color: var(--success); border: 1px solid rgba(107,142,78,0.2)">
              ✓ Cliente seleccionado: <strong>&nbsp;{{ selectedCustomer()!.name }}</strong>
              <span class="badge badge-accent" style="margin-left:auto">
                {{ getDiscount(selectedCustomer()!.purchasesCount) }}% de descuento
              </span>
            </div>
          }

          <div class="row-between">
            <button class="btn btn-ghost" (click)="step.set('cart')">← Volver al comanda</button>
            <div class="inline">
              @if (!selectedCustomer()) {
                <button class="btn btn-secondary" (click)="continueWithoutCustomer()">
                  Continuar sin cliente
                </button>
              }
              <button
                class="btn btn-primary"
                [disabled]="!selectedCustomer()"
                (click)="step.set('confirm')"
              >
                Continuar →
              </button>
            </div>
          </div>
        </section>
      }

      <!-- PASO 3: CONFIRMACIÓN -->
      @if (step() === 'confirm') {
        <section class="card stack">
          <h2>Confirmar venta</h2>

          <div class="stack" style="gap:8px">
            <div class="row-between">
              <span class="muted">Productos</span>
              <span>{{ cartService.cartItems().length }} línea(s)</span>
            </div>
            <div class="row-between">
              <span class="muted">Cliente</span>
              <span>
                @if (selectedCustomer()) {
                  {{ selectedCustomer()!.name }}
                } @else {
                  Venta sin cliente
                }
              </span>
            </div>
            <div class="row-between">
              <span class="muted">Subtotal</span>
              <span>\${{ cartService.subtotal().toFixed(2) }}</span>
            </div>
            @if (estimatedDiscountPercent() > 0) {
              <div class="row-between">
                <span class="muted">Descuento estimado</span>
                <span>
                  {{ estimatedDiscountPercent() }}%
                  (−\${{ estimatedDiscountAmount().toFixed(2) }})
                </span>
              </div>
            }
            <hr style="border:0;border-top:1px solid var(--border);margin:8px 0">
            <div class="row-between">
              <h3>Total estimado</h3>
              <h2>\${{ estimatedTotal().toFixed(2) }}</h2>
            </div>
            <p class="muted" style="font-size:12px">
              El total final lo calcula el sistema al confirmar.
            </p>
          </div>

          <div class="stack" style="gap:8px">
            <label class="muted" style="font-size:13px;font-weight:600">Método de pago</label>
            <select class="input" [ngModel]="paymentMethod()" (ngModelChange)="paymentMethod.set($event)">
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          @if (saleError()) {
            <div class="alert alert-error">{{ saleError() }}</div>
          }

          <div class="row-between">
            <button class="btn btn-ghost" (click)="step.set('customer')" [disabled]="loading()">
              ← Volver
            </button>
            <button class="btn btn-primary" (click)="confirmSale()" [disabled]="loading()">
              {{ loading() ? 'Procesando…' : '✓ Confirmar venta' }}
            </button>
          </div>
        </section>
      }

      <!-- PASO 4: TICKET -->
      @if (step() === 'ticket' && ticket()) {
        <section class="stack">
          <div class="ticket">
            <div class="ticket__title">{{ ticket()!.storeName }}</div>
            <div class="ticket__meta">
              {{ formatDate(ticket()!.timestamp) }}<br>
              Venta #{{ ticket()!.saleId.slice(-8) }}
            </div>
            <hr class="ticket__sep">
            @for (item of ticket()!.items; track item.name) {
              <div class="ticket__row">
                <span>{{ item.name }} × {{ item.qty }}</span>
                <span>\${{ item.lineTotal.toFixed(2) }}</span>
              </div>
            }
            <hr class="ticket__sep">
            <div class="ticket__row">
              <span>Subtotal</span>
              <span>\${{ ticket()!.subtotal.toFixed(2) }}</span>
            </div>
            <div class="ticket__row">
              <span>Descuento</span>
              <span>{{ ticket()!.discount }}</span>
            </div>
            <div class="ticket__total">
              <span>TOTAL</span>
              <span>\${{ ticket()!.total.toFixed(2) }}</span>
            </div>
            <hr class="ticket__sep">
            <div class="ticket__row">
              <span>Pago</span>
              <span>{{ paymentLabel(ticket()!.paymentMethod) }}</span>
            </div>
            <div class="ticket__meta" style="margin-top:16px">
              ¡Gracias por tu compra! ☕
            </div>
          </div>

          <div class="row-between">
            <a routerLink="/products" class="btn btn-ghost">Ir al Menú</a>
            <button class="btn btn-primary" (click)="newSale()">
              + Nueva venta
            </button>
          </div>
        </section>
      }
    </div>
  `,
})
export class CheckoutPageComponent {
  step = signal<Step>('cart');

  customerQuery = signal('');
  customerResults = signal<Customer[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  searchingCustomers = signal(false);

  paymentMethod = signal<PaymentMethod>('cash');

  loading = signal(false);
  saleError = signal('');
  ticket = signal<Ticket | null>(null);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  estimatedDiscountPercent = computed(() => {
    const c = this.selectedCustomer();
    return c ? this.getDiscount(c.purchasesCount) : 0;
  });
  estimatedDiscountAmount = computed(
    () => +(this.cartService.subtotal() * (this.estimatedDiscountPercent() / 100)).toFixed(2),
  );
  estimatedTotal = computed(
    () => +(this.cartService.subtotal() - this.estimatedDiscountAmount()).toFixed(2),
  );

  constructor(
    public cartService: CartService,
    private customersService: CustomerService,
    private http: HttpClient,
    private router: Router,
  ) {}

  isDone(s: Step): boolean {
    const order: Step[] = ['cart', 'customer', 'confirm', 'ticket'];
    return order.indexOf(s) < order.indexOf(this.step());
  }

  onCustomerSearch(value: string) {
    this.customerQuery.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (!value.trim()) {
      this.customerResults.set([]);
      this.searchingCustomers.set(false);
      return;
    }
    this.searchingCustomers.set(true);
    this.searchTimeout = setTimeout(() => {
      this.customersService.getAll(value).subscribe({
        next: (res) => {
          this.customerResults.set(res.data);
          this.searchingCustomers.set(false);
        },
        error: () => {
          this.customerResults.set([]);
          this.searchingCustomers.set(false);
        },
      });
    }, 250);
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.customerResults.set([]);
    this.customerQuery.set('');
  }

  continueWithoutCustomer() {
    this.selectedCustomer.set(null);
    this.step.set('confirm');
  }

  getDiscount(purchasesCount: number): number {
    if (purchasesCount >= 8) return 15;
    if (purchasesCount >= 4) return 10;
    if (purchasesCount >= 1) return 5;
    return 0;
  }

  confirmSale() {
    this.loading.set(true);
    this.saleError.set('');

    const items = this.cartService.cartItems().map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    }));

    const body: any = {
      paymentMethod: this.paymentMethod(),
      items,
    };
    const customer = this.selectedCustomer();
    if (customer) body.customerId = customer.id;

    // Snapshot de nombres para errores (antes de limpiar la comanda)
    const productNames = new Map(
      this.cartService.cartItems().map((i) => [i.product.id, i.product.name]),
    );

    this.http.post<any>(`${environment.apiUrl}/sales`, body).subscribe({
      next: (res) => {
        this.ticket.set(res.ticket as Ticket);
        this.cartService.clear();
        this.loading.set(false);
        this.step.set('ticket');
      },
      error: (err) => {
        this.loading.set(false);
        this.saleError.set(this.formatError(err, productNames));
      },
    });
  }

  private formatError(err: any, productNames: Map<string, string>): string {
    const status = err?.status;
    const body = err?.error;

    if (status === 400 && body?.details?.length) {
      const d = body.details[0];
      const name = productNames.get(d.productId) ?? 'un producto';
      return `Stock insuficiente para ${name}. ${d.message}`;
    }
    if (status === 422 && body?.details?.length) {
      return `Datos inválidos: ${body.details[0].message}`;
    }
    if (status === 404) {
      return body?.error === 'Customer not found'
        ? 'No pudimos confirmar el cliente. Puedes continuar sin él.'
        : 'Producto o cliente no encontrado.';
    }
    if (status === 0) {
      return 'No hay conexión con el servidor. Revisa tu red.';
    }
    return 'No pudimos procesar la venta. Intenta de nuevo.';
  }

  newSale() {
    this.ticket.set(null);
    this.selectedCustomer.set(null);
    this.customerQuery.set('');
    this.customerResults.set([]);
    this.paymentMethod.set('cash');
    this.saleError.set('');
    this.step.set('cart');
    this.router.navigateByUrl('/products');
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  paymentLabel(m: PaymentMethod): string {
    return { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }[m];
  }
}
