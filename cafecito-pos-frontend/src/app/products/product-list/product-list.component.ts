import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="stack">
      <div class="row-between">
        <div>
          <h1>Catálogo</h1>
          <p class="muted">Busca productos y agrégalos al carrito.</p>
        </div>
        @if (cartService.cartItems().length > 0) {
          <a routerLink="/checkout" class="btn btn-primary">
            Ir al carrito ({{ cartItemCount() }})
          </a>
        }
      </div>

      <input
        class="input"
        type="text"
        placeholder="Buscar producto por nombre..."
        [ngModel]="query()"
        (ngModelChange)="onSearch($event)"
      />

      @if (loading()) {
        <div class="empty-state">
          <p>Cargando productos…</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
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
                class="btn btn-primary"
                [disabled]="p.stock === 0"
                (click)="add(p)"
              >
                {{ p.stock === 0 ? 'Sin stock' : 'Agregar al carrito' }}
              </button>
              @if (justAddedId() === p.id) {
                <span class="badge badge-success">✓ Agregado</span>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  query = signal('');
  loading = signal(true);
  error = signal('');
  justAddedId = signal<string | null>(null);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private productsService: ProductsService,
    public cartService: CartService,
  ) {}

  cartItemCount() {
    return this.cartService.cartItems().reduce((s, i) => s + i.quantity, 0);
  }

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
    this.error.set('');
    this.productsService.getAll(this.query() || undefined).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los productos. Revisa tu conexión.');
        this.loading.set(false);
      },
    });
  }

  add(product: Product) {
    this.cartService.addProduct(product);
    this.justAddedId.set(product.id);
    setTimeout(() => {
      if (this.justAddedId() === product.id) this.justAddedId.set(null);
    }, 1500);
  }
}
