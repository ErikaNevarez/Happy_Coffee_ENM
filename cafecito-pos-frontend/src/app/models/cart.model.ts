import { Product } from './product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleRequest {
  customerId?: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  items: { productId: string; quantity: number }[];
}
