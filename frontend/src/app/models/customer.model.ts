export interface Customer {
  id: string;
  name: string;
  phoneOrEmail: string;
  purchasesCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
}
