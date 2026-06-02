import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { Customer, CustomersResponse } from '../models/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private url = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getAll(query?: string): Observable<CustomersResponse> {
    let params = new HttpParams();
    if (query) params = params.set('q', query);
    return this.http.get<CustomersResponse>(this.url, { params });
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.url}/${id}`);
  }

  create(customer: Pick<Customer, 'name' | 'phoneOrEmail'>): Observable<Customer> {
    return this.http.post<Customer>(this.url, customer);
  }
}
