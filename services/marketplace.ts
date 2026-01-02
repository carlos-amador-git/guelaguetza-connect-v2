import { api } from './api';

// Types
export type ProductCategory = 'ARTESANIA' | 'MEZCAL' | 'TEXTIL' | 'CERAMICA' | 'JOYERIA' | 'GASTRONOMIA' | 'OTRO';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'ARCHIVED';
export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  bannerUrl: string | null;
  location: string | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  user: {
    id: string;
    nombre: string;
    apellido?: string;
    avatar: string | null;
  };
  _count?: {
    products: number;
    orders: number;
  };
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  status: ProductStatus;
  stock: number;
  images: string[];
  createdAt: string;
  seller: SellerProfile;
  _count?: {
    reviews: number;
  };
}

export interface ProductReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    avatar: string | null;
  };
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  sellerId: string;
  status: OrderStatus;
  total: string;
  shippingAddress: ShippingAddress;
  stripePaymentId: string | null;
  createdAt: string;
  items: OrderItem[];
  seller: SellerProfile;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface ProductQuery {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderQuery {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

// API Functions

// Products
export async function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await api.get<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/marketplace/products?${params}`);
  return response;
}

export async function getProduct(id: string) {
  const response = await api.get<Product & { reviews: ProductReview[] }>(`/marketplace/products/${id}`);
  return response;
}

// Cart
export async function getCart() {
  const response = await api.get<Cart>('/marketplace/cart');
  return response;
}

export async function addToCart(productId: string, quantity: number = 1) {
  const response = await api.post<Cart>('/marketplace/cart/items', { productId, quantity });
  return response;
}

export async function updateCartItem(itemId: string, quantity: number) {
  const response = await api.put<Cart>(`/marketplace/cart/items/${itemId}`, { quantity });
  return response;
}

export async function removeFromCart(itemId: string) {
  const response = await api.delete<Cart>(`/marketplace/cart/items/${itemId}`);
  return response;
}

export async function clearCart() {
  const response = await api.delete<{ message: string }>('/marketplace/cart');
  return response;
}

// Orders
export async function checkout(shippingAddress: ShippingAddress) {
  const response = await api.post<Array<{ order: Order; clientSecret: string | null }>>('/marketplace/checkout', {
    shippingAddress,
  });
  return response;
}

export async function getMyOrders(query: OrderQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await api.get<{
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/marketplace/orders?${params}`);
  return response;
}

export async function getOrder(id: string) {
  const response = await api.get<Order>(`/marketplace/orders/${id}`);
  return response;
}

// Seller
export async function getSellerProfile() {
  const response = await api.get<SellerProfile | null>('/marketplace/seller/profile');
  return response;
}

export async function createSellerProfile(data: {
  businessName: string;
  description?: string;
  location?: string;
}) {
  const response = await api.post<SellerProfile>('/marketplace/seller/profile', data);
  return response;
}

// Reviews
export async function createProductReview(productId: string, data: { rating: number; comment?: string }) {
  const response = await api.post<ProductReview>(`/marketplace/products/${productId}/reviews`, data);
  return response;
}

// Helpers
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ARTESANIA: 'Artesania',
  MEZCAL: 'Mezcal',
  TEXTIL: 'Textiles',
  CERAMICA: 'Ceramica',
  JOYERIA: 'Joyeria',
  GASTRONOMIA: 'Gastronomia',
  OTRO: 'Otro',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  PROCESSING: 'Procesando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: '#FCD34D',
  PAID: '#34D399',
  PROCESSING: '#60A5FA',
  SHIPPED: '#A78BFA',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
  REFUNDED: '#F97316',
};

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(numPrice);
}
