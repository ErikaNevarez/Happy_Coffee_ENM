import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'app-sale-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sale-cart">
      <h2>Comanda</h2>

      @if (cartService.cartItems().length === 0) {
        <p>La comanda está vacía.</p>
      }

      @if (cartService.cartItems().length > 0) {
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of cartService.cartItems(); track item.product.id) {
              <tr>
                <td>{{ item.product.name }}</td>
                <td>{{ item.quantity }}</td>
                <td>\${{ item.product.price.toFixed(2) }}</td>
                <td>\${{ (item.product.price * item.quantity).toFixed(2) }}</td>
                <td>
                  <button (click)="cartService.removeProduct(item.product.id)">Quitar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <p>
          <strong>Subtotal: \${{ cartService.subtotal().toFixed(2) }}</strong>
        </p>

        <button (click)="confirmSale()" [disabled]="loading">
          {{ loading ? 'Procesando...' : 'Confirmar venta' }}
        </button>
      }

      @if (ticket) {
        <div class="ticket">
          <h3>Ticket — {{ ticket.storeName }}</h3>
          <p>Fecha: {{ ticket.timestamp }}</p>
          <table>
            @for (item of ticket.items; track item.name) {
              <tr>
                <td>{{ item.name }} x{{ item.qty }}</td>
                <td>\${{ item.lineTotal.toFixed(2) }}</td>
              </tr>
            }
          </table>
          <p>Subtotal: \${{ ticket.subtotal.toFixed(2) }}</p>
          <p>Descuento: {{ ticket.discount }}</p>
          <p>
            <strong>Total: \${{ ticket.total.toFixed(2) }}</strong>
          </p>
          <p>Método de pago: {{ ticket.paymentMethod }}</p>
        </div>
      }

      @if (errorMessage) {
        <div class="error">{{ errorMessage }}</div>
      }
    </div>
  `,
})
export class SaleCartComponent {
  loading = false;
  ticket: any = null;
  errorMessage = '';

  constructor(
    public cartService: CartService,
    private http: HttpClient,
  ) {}

  confirmSale() {
    this.loading = true;
    this.errorMessage = '';
    this.ticket = null;

    const body = {
      paymentMethod: 'cash',
      items: this.cartService.cartItems().map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };

    this.http.post<any>(`${environment.apiUrl}/sales`, body).subscribe({
      next: (sale) => {
        this.ticket = sale.ticket;
        this.cartService.clear();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error al procesar la venta';
        this.loading = false;
      },
    });
  }
}
