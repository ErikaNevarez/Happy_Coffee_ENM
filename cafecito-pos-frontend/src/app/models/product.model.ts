export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}
