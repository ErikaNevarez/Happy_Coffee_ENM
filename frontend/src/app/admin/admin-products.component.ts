import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../services/products.service';
import { Product } from '../models/product.model';

interface ProductDraft {
  id?: string;
  name: string;
  description: string;
  price: number | null;
  stock: number | null;
  offer: boolean;
  category: string;
  imageUrl: string;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="stack">
      <div class="row-between">
        <div>
          <h1>Administrar productos</h1>
          <p class="muted">Crea, edita o elimina productos del inventario.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">+ Nuevo producto</button>
      </div>

      <div class="admin-toolbar">
        <input
          class="input"
          type="text"
          placeholder="Buscar producto por nombre..."
          [ngModel]="query()"
          (ngModelChange)="onSearch($event)"
        />
        <span class="muted" style="font-size:13px">
          {{ products().length }} producto(s)
        </span>
      </div>

      @if (loading()) {
        <div class="empty-state"><p>Cargando…</p></div>
      } @else if (loadError()) {
        <div class="alert alert-error">{{ loadError() }}</div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <div class="empty-state__icon">📦</div>
          <h3>Sin productos</h3>
          <p>Crea el primer producto para comenzar.</p>
        </div>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Stock</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td><strong>{{ p.name }}</strong></td>
                <td class="text-right">\${{ p.price.toFixed(2) }}</td>
                <td class="text-right">
                  @if (p.stock === 0) {
                    <span class="badge" style="background:rgba(180,81,58,0.1);color:var(--danger)">
                      Sin stock
                    </span>
                  } @else {
                    {{ p.stock }}
                  }
                </td>
                <td class="text-right">
                  <button class="btn btn-secondary btn-sm" (click)="openEdit(p)">Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="askDelete(p)">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <!-- MODAL: CREAR / EDITAR -->
    @if (draft(); as d) {
      <div class="modal-overlay" (click)="closeDraft()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>{{ d.id ? 'Editar producto' : 'Nuevo producto' }}</h2>
          <form (ngSubmit)="save()" class="stack" novalidate style="margin-top:16px">
            <div class="stack" style="gap:6px">
              <label class="muted" style="font-size:13px;font-weight:600">Nombre</label>
              <input
                class="input"
                type="text"
                placeholder="Ej. Café Americano"
                [(ngModel)]="d.name"
                name="name"
                required
                minlength="2"
                maxlength="100"
              />
            </div>

            <div class="stack" style="gap:6px">
              <label class="muted" style="font-size:13px;font-weight:600">Descripción</label>
              <input
                class="input"
                type="text"
                placeholder="Ej. Descripción, ingredientes, sabores, etc."
                [(ngModel)]="d.description"
                name="description"
                required
                minlength="2"
                maxlength="120"
              />
            </div>

            <div class="stack" style="gap:6px">
                <label class="muted" style="font-size:13px;font-weight:600">Categoría</label>
                <input
                  class="input"
                  type="text"
                  placeholder="Ej. bebidas calientes, bebidas frias, snacks o bakery"
                  [(ngModel)]="d.category"
                  name="category"
                  required
                  minlength="2"
                  maxlength="60"
                />
              </div>

              <div class="stack" style="gap:6px">
                <label class="muted" style="font-size:13px;font-weight:600">Imagen</label>
                <input
                  class="input"
                  type="text"
                  placeholder="Url de la imagen"
                  [(ngModel)]="d.imageUrl"
                  name="imageUrl"
                  />
              </div>

            <div class="inline" style="gap:12px">
              <div class="stack" style="gap:6px;flex:1">
                <label class="muted" style="font-size:13px;font-weight:600">Precio</label>
                <input
                  class="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  [(ngModel)]="d.price"
                  name="price"
                  required
                />
              </div>

              <div class="stack" style="gap:6px;flex:1">
                <label class="muted" style="font-size:13px;font-weight:600">Stock</label>
                <input
                  class="input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  [(ngModel)]="d.stock"
                  name="stock"
                  required
                />
              </div>



            </div>

            @if (formError()) {
              <div class="alert alert-error">{{ formError() }}</div>
            }

              <div class="row-between" style="margin-top:8px">
                <button type="button" class="btn btn-ghost" (click)="closeDraft()">
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="saving() || !canSave(d)"
                >
                  {{ saving() ? 'Guardando…' : (d.id ? 'Guardar cambios' : 'Crear producto') }}
                </button>
              </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL: CONFIRMAR ELIMINAR -->
    @if (toDelete(); as p) {
      <div class="modal-overlay" (click)="toDelete.set(null)">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:420px">
          <h2>Eliminar producto</h2>
          <p style="margin:12px 0">
            ¿Seguro que quieres eliminar <strong>{{ p.name }}</strong>? Esta acción no se puede deshacer.
          </p>
          <div class="row-between" style="margin-top:16px">
            <button class="btn btn-ghost" (click)="toDelete.set(null)">Cancelar</button>
            <button class="btn btn-primary" style="background:var(--danger);border-color:var(--danger)" (click)="confirmDelete()" [disabled]="deleting()">
              {{ deleting() ? 'Eliminando…' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  query = signal('');
  loading = signal(true);
  loadError = signal('');

  draft = signal<ProductDraft | null>(null);
  saving = signal(false);
  formError = signal('');

  toDelete = signal<Product | null>(null);
  deleting = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private productsService: ProductsService) {}

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
    this.productsService.getAll(this.query() || undefined).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('No pudimos cargar los productos.');
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.formError.set('');
    this.draft.set({
    name: '',
    description: '',
    price: null,
    stock: null,
    offer: false,
    category: '',
    imageUrl: ''
    });
  }


openEdit(p: Product) {
  this.formError.set('');
  this.draft.set({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    offer: p.offer,
    category: p.category,
    imageUrl: p.imageUrl
  });
}

  closeDraft() {
    this.draft.set(null);
    this.formError.set('');
  }

  canSave(d: ProductDraft): boolean {
    return (
      d.name.trim().length >= 2 &&
      d.name.trim().length <= 100 &&
      d.price !== null &&
      d.price > 0 &&
      d.stock !== null &&
      d.stock >= 0 &&
      Number.isInteger(d.stock)
    );
  }

  save() {
    const d = this.draft();
    if (!d || !this.canSave(d)) return;

    this.saving.set(true);
    this.formError.set('');

    const payload = {
      name: d.name.trim(),
      description: d.description.trim(),
      price: Number(d.price),
      stock: Number(d.stock),       
      offer: Boolean(d.offer),
      category: d.category,
      imageUrl: d.imageUrl
    };

    const obs = d.id
      ? this.productsService.update(d.id, payload)
      : this.productsService.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.draft.set(null);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(this.formatError(err));
      },
    });
  }

  askDelete(p: Product) {
    this.toDelete.set(p);
  }

  confirmDelete() {
    const p = this.toDelete();
    if (!p) return;
    this.deleting.set(true);
    this.productsService.delete(p.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toDelete.set(null);
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.toDelete.set(null);
        this.loadError.set('No pudimos eliminar el producto.');
      },
    });
  }

  private formatError(err: any): string {
    const body = err?.error;
    if (body?.details?.length) {
      return body.details.map((d: any) => d.message).join(', ');
    }
    return body?.error || 'No pudimos guardar el producto.';
  }
}
