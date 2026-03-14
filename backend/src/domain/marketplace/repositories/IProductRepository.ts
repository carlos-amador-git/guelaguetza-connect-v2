import { Product } from '../entities/Product.js';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sellerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IProductRepository {
  // Product operations
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySeller(sellerId: string, filters?: ProductFilters): Promise<PaginatedResult<Product>>;
  findAll(filters?: ProductFilters): Promise<PaginatedResult<Product>>;
}
