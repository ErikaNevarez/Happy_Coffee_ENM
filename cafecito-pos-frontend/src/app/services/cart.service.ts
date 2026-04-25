import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private items = signal<CartItem[]>([]);

  cartItems = this.items.asReadonly();

  subtotal = computed(() => this.items().reduce((sum, i) => sum + i.product.price * i.quantity, 0));

  addProduct(product: Product) {
    const existing = this.items().find((i) => i.product.id === product.id);
    if (existing) {
      this.items.update((items) =>
        items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)),
      );
    } else {
      this.items.update((items) => [...items, { product, quantity: 1 }]);
    }
  }

  removeProduct(productId: string) {
    this.items.update((items) => items.filter((i) => i.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeProduct(productId);
      return;
    }
    this.items.update((items) =>
      items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
  }

  clear() {
    this.items.set([]);
  }
}
