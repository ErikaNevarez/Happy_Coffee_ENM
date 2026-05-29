export interface Product {
  id: string;
  name: string;
  description: string; 
  price: number;
  offer: boolean; 
  stock: number;
  category: string;
  imageUrl: string; 
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}



  
  