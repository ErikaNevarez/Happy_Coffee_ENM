import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductsService } from '../services/products.service';
import { CustomerService } from '../services/customers.service';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product.model';
import { Customer } from '../models/customer.model';
import { CustomerFormComponent } from '../customers/customer-form/customer-form';
import { environment } from '../../environment/environment';

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
  selector: 'app-sale-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomerFormComponent],
  template: `
    <div class="stack">
      <div class="row-between">
        <div>
          <h1>Venta</h1>
          <p class="muted">Busca productos, agrégalos a la comanda y cobra.</p>
        </div>
      </div>

      <div class="pos-grid">
        <!-- Menú -->
        <div class="stack">
          <input
            class="input"
            type="text"
            placeholder="Buscar producto por nombre..."
            [ngModel]="query()"
            (ngModelChange)="onSearch($event)"
          />

          @if (loadingProducts()) {
            <div class="empty-state"><p>Cargando productos…</p></div>
          } @else if (productsError()) {
            <div class="alert alert-error">{{ productsError() }}</div>
          } @else if (products().length === 0) {
            <div class="empty-state">
              <div class="empty-state__icon">📦</div>
              @if (query()) {
                <h3>Sin resultados</h3>
                <p>No encontramos productos con "{{ query() }}".</p>
              } @else {
                <h3>Aún no hay productos</h3>
                <p>Pídele al administrador que cargue el inventario.</p>
              }
            </div>
          } @else {
            <div class="product-grid">
              @for (p of products(); track p.id) {
                <div class="product-card">
                  <div class="product-card__name">{{ p.name }}</div>
                  <div class="product-card__price">\${{ p.price.toFixed(2) }}</div>
                  <div
                    class="product-card__stock"
                    [class.product-card__stock--out]="p.stock === 0"
                  >
                    @if (p.stock === 0) { Sin stock }
                    @else { {{ p.stock }} disponibles }
                  </div>
                  <button
                    class="btn btn-primary btn-sm"
                    [disabled]="p.stock === 0 || inCartQty(p.id) >= p.stock"
                    (click)="cart.addProduct(p)"
                  >
                    @if (inCartQty(p.id) > 0) {
                      + Agregar otro ({{ inCartQty(p.id) }})
                    } @else {
                      Agregar
                    }
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- comanda / CLIENTE / COBRO -->
        <aside class="pos-cart">
          <h2 style="margin:0">🛒 Venta actual</h2>

          @if (cart.cartItems().length === 0) {
            <div class="empty-state" style="padding:24px 8px">
              <div class="empty-state__icon">🛒</div>
              <p>Agrega productos del Menú para empezar la venta.</p>
            </div>
          } @else {
            <div>
              @for (item of cart.cartItems(); track item.product.id) {
                <div class="cart-item">
                  <div>
                    <div class="cart-item__name">{{ item.product.name }}</div>
                    <div class="cart-item__line">
                      \${{ item.product.price.toFixed(2) }} c/u
                    </div>
                  </div>
                  <div class="cart-item__total">
                    \${{ (item.product.price * item.quantity).toFixed(2) }}
                  </div>
                  <div class="qty-control">
                    <button
                      (click)="cart.updateQuantity(item.product.id, item.quantity - 1)"
                      aria-label="Quitar uno"
                    >−</button>
                    <span>{{ item.quantity }}</span>
                    <button
                      (click)="cart.updateQuantity(item.product.id, item.quantity + 1)"
                      [disabled]="item.quantity >= item.product.stock"
                      aria-label="Agregar uno"
                    >+</button>
                  </div>
                  <button
                    class="btn btn-danger btn-sm"
                    style="justify-self:end"
                    (click)="cart.removeProduct(item.product.id)"
                  >Quitar</button>
                </div>
              }
            </div>
          }

          <!-- CLIENTE -->
          <div class="stack" style="gap:8px">
            <label class="muted" style="font-size:13px;font-weight:600">Cliente</label>
            @if (selectedCustomer(); as customer) {
              <div
                class="alert"
                style="margin:0; background: rgba(107,142,78,0.08); color: var(--success); border: 1px solid rgba(107,142,78,0.2)"
              >
                <div style="flex:1">
                  <strong>{{ customer.name }}</strong>
                  <div style="font-size:12px">
                    {{ estimatedDiscountPercent() }}% descuento
                  </div>
                </div>
                <button class="btn btn-ghost btn-sm" (click)="clearCustomer()">Cambiar</button>
              </div>
            } @else {
              <input
                class="input"
                type="text"
                placeholder="Buscar cliente (nombre, email, teléfono)"
                [ngModel]="customerQuery()"
                (ngModelChange)="onCustomerSearch($event)"
              />
              @if (searchingCustomers()) {
                <span class="muted" style="font-size:13px">Buscando…</span>
              }
              @if (customerResults().length > 0) {
                <div style="max-height:200px;overflow-y:auto">
                  @for (c of customerResults(); track c.id) {
                    <div class="customer-result" (click)="selectCustomer(c)">
                      <div>
                        <strong>{{ c.name }}</strong>
                        <div class="muted" style="font-size:12px">{{ c.phoneOrEmail }}</div>
                      </div>
                      <span class="badge badge-accent">
                        {{ getDiscount(c.purchasesCount) }}%
                      </span>
                    </div>
                  }
                </div>
              }
              @if (
                customerQuery() &&
                !searchingCustomers() &&
                customerResults().length === 0
              ) {
                <span class="muted" style="font-size:13px">
                  Sin resultados. Puedes vender sin cliente o
                  <a (click)="openNewCustomer()" style="color:var(--primary);cursor:pointer">
                    registrar uno nuevo
                  </a>.
                </span>
              }
              @if (!customerQuery()) {
                <button
                  class="btn btn-ghost btn-sm"
                  style="align-self:flex-start"
                  (click)="openNewCustomer()"
                >
                  + Registrar cliente nuevo
                </button>
              }
            }
          </div>

          <!-- MÉTODO DE PAGO -->
          <div class="stack" style="gap:8px">
            <label class="muted" style="font-size:13px;font-weight:600">
              Método de pago
            </label>
            <select
              class="input"
              [ngModel]="paymentMethod()"
              (ngModelChange)="paymentMethod.set($event)"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          <!-- TOTALES -->
          <div class="stack" style="gap:6px">
            <div class="totals-row">
              <span class="muted">Subtotal</span>
              <span>\${{ cart.subtotal().toFixed(2) }}</span>
            </div>
            @if (estimatedDiscountPercent() > 0) {
              <div class="totals-row" style="color:var(--success)">
                <span>Descuento {{ estimatedDiscountPercent() }}%</span>
                <span>−\${{ estimatedDiscountAmount().toFixed(2) }}</span>
              </div>
            }
            <div class="totals-row totals-row--big">
              <span>Total</span>
              <span>\${{ estimatedTotal().toFixed(2) }}</span>
            </div>
          </div>

          @if (saleError()) {
            <div class="alert alert-error">{{ saleError() }}</div>
          }

          <button
            class="btn btn-primary"
            style="padding:14px"
            [disabled]="cart.cartItems().length === 0 || loading()"
            (click)="confirmSale()"
          >
            {{ loading() ? 'Procesando…' : '✓ Cobrar $' + estimatedTotal().toFixed(2) }}
          </button>
        </aside>
      </div>
    </div>

    <!-- MODAL: NUEVO CLIENTE -->
    @if (showNewCustomer()) {
      <div class="modal-overlay" (click)="showNewCustomer.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <app-customer-form
            [showCancel]="true"
            (created)="onCustomerCreated($event)"
            (cancel)="showNewCustomer.set(false)"
          />
        </div>
      </div>
    }

    <!-- MODAL: TICKET -->
    @if (ticket(); as t) {
      <div class="modal-overlay">
        <div class="modal">
          <div class="ticket" style="margin:0 auto;border:2px dashed var(--border)">
            <div class="ticket__title">{{ t.storeName }}</div>
            <div class="ticket__meta">
              {{ formatDate(t.timestamp) }}<br>
              Venta #{{ t.saleId.slice(-8) }}
            </div>
            <hr class="ticket__sep">
            @for (item of t.items; track item.name) {
              <div class="ticket__row">
                <span>{{ item.name }} × {{ item.qty }}</span>
                <span>\${{ item.lineTotal.toFixed(2) }}</span>
              </div>
            }
            <hr class="ticket__sep">
            <div class="ticket__row">
              <span>Subtotal</span>
              <span>\${{ t.subtotal.toFixed(2) }}</span>
            </div>
            <div class="ticket__row">
              <span>Descuento</span>
              <span>{{ t.discount }}</span>
            </div>
            <div class="ticket__total">
              <span>TOTAL</span>
              <span>\${{ t.total.toFixed(2) }}</span>
            </div>
            <hr class="ticket__sep">
            <div class="ticket__row">
              <span>Pago</span>
              <span>{{ paymentLabel(t.paymentMethod) }}</span>
            </div>
            <div class="ticket__meta" style="margin-top:16px">
              ¡Gracias por tu compra! ☕
            </div>
          </div>
          <div class="row-between" style="margin-top:20px">
            <button class="btn btn-ghost" (click)="printTicket()">🖨 Imprimir</button>
            <button class="btn btn-primary" (click)="newSale()">+ Nueva venta</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SalePageComponent implements OnInit {
  // Menú
  products = signal<Product[]>([]);
  query = signal('');
  loadingProducts = signal(true);
  productsError = signal('');

  // Cliente
  customerQuery = signal('');
  customerResults = signal<Customer[]>([]);
  selectedCustomer = signal<Customer | null>(null);
  searchingCustomers = signal(false);
  showNewCustomer = signal(false);

  // Pago
  paymentMethod = signal<PaymentMethod>('cash');

  // Venta
  loading = signal(false);
  saleError = signal('');
  ticket = signal<Ticket | null>(null);

  private productSearchTimeout: ReturnType<typeof setTimeout> | null = null;
  private customerSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  estimatedDiscountPercent = computed(() => {
    const c = this.selectedCustomer();
    return c ? this.getDiscount(c.purchasesCount) : 0;
  });
  estimatedDiscountAmount = computed(() =>
    +(this.cart.subtotal() * (this.estimatedDiscountPercent() / 100)).toFixed(2),
  );
  estimatedTotal = computed(() =>
    +(this.cart.subtotal() - this.estimatedDiscountAmount()).toFixed(2),
  );

  constructor(
    private productsService: ProductsService,
    private customersService: CustomerService,
    public cart: CartService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  onSearch(value: string) {
    this.query.set(value);
    if (this.productSearchTimeout) clearTimeout(this.productSearchTimeout);
    this.productSearchTimeout = setTimeout(() => this.loadProducts(), 250);
  }

  loadProducts() {
    this.loadingProducts.set(true);
    this.productsError.set('');
    this.productsService.getAll(this.query() || undefined).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.productsError.set('No pudimos cargar los productos.');
        this.loadingProducts.set(false);
      },
    });
  }

  inCartQty(productId: string): number {
    return this.cart.cartItems().find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  onCustomerSearch(value: string) {
    this.customerQuery.set(value);
    if (this.customerSearchTimeout) clearTimeout(this.customerSearchTimeout);
    if (!value.trim()) {
      this.customerResults.set([]);
      this.searchingCustomers.set(false);
      return;
    }
    this.searchingCustomers.set(true);
    this.customerSearchTimeout = setTimeout(() => {
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

  selectCustomer(c: Customer) {
    this.selectedCustomer.set(c);
    this.customerResults.set([]);
    this.customerQuery.set('');
  }

  clearCustomer() {
    this.selectedCustomer.set(null);
  }

  openNewCustomer() {
    this.showNewCustomer.set(true);
  }

  onCustomerCreated(c: Customer) {
    this.showNewCustomer.set(false);
    this.selectCustomer(c);
  }

  getDiscount(count: number): number {
    if (count >= 8) return 15;
    if (count >= 4) return 10;
    if (count >= 1) return 5;
    return 0;
  }

  confirmSale() {
    if (this.cart.cartItems().length === 0) return;

    this.loading.set(true);
    this.saleError.set('');

    const body: any = {
      paymentMethod: this.paymentMethod(),
      items: this.cart.cartItems().map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };
    const customer = this.selectedCustomer();
    if (customer) body.customerId = customer.id;

    const productNames = new Map(
      this.cart.cartItems().map((i) => [i.product.id, i.product.name]),
    );

    this.http.post<any>(`${environment.apiUrl}/sales`, body).subscribe({
      next: (res) => {
        this.ticket.set(res.ticket as Ticket);
        this.cart.clear();
        this.loading.set(false);
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
        ? 'No pudimos confirmar el cliente. Intenta de nuevo o vende sin él.'
        : 'Producto o cliente no encontrado.';
    }
    if (status === 0) return 'No hay conexión con el servidor.';
    return 'No pudimos procesar la venta. Intenta de nuevo.';
  }

  newSale() {
    this.ticket.set(null);
    this.selectedCustomer.set(null);
    this.customerQuery.set('');
    this.customerResults.set([]);
    this.paymentMethod.set('cash');
    this.saleError.set('');
    this.loadProducts();
  }

  printTicket() {
    window.print();
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
