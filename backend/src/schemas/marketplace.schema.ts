import { z } from 'zod';

// Enums matching Prisma
export const ProductCategoryEnum = z.enum([
  'ARTESANIA',
  'MEZCAL',
  'TEXTIL',
  'CERAMICA',
  'JOYERIA',
  'GASTRONOMIA',
  'OTRO',
]);

export const ProductStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'SOLD_OUT',
  'ARCHIVED',
]);

export const OrderStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

// Product schemas
export const CreateProductSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().positive(),
  category: ProductCategoryEnum,
  stock: z.number().int().nonnegative().default(0),
  images: z.array(z.string().url()).optional().default([]),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  status: ProductStatusEnum.optional(),
});

// Query schemas
export const ProductQuerySchema = z.object({
  category: ProductCategoryEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  status: ProductStatusEnum.optional(),
  sellerId: z.string().cuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Cart schemas
export const AddToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive().default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

// Order schemas
export const ShippingAddressSchema = z.object({
  name: z.string().min(2).max(100),
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(10),
  phone: z.string().min(10).max(15),
  notes: z.string().max(500).optional(),
});

export const CreateOrderSchema = z.object({
  shippingAddress: ShippingAddressSchema,
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
});

export const OrderQuerySchema = z.object({
  status: OrderStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// Review schema
export const CreateProductReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// Seller profile schema
export const CreateSellerProfileSchema = z.object({
  businessName: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
});

export const UpdateSellerProfileSchema = CreateSellerProfileSchema.partial().extend({
  bannerUrl: z.string().url().optional(),
});

// Types
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderQuery = z.infer<typeof OrderQuerySchema>;
export type CreateProductReviewInput = z.infer<typeof CreateProductReviewSchema>;
export type CreateSellerProfileInput = z.infer<typeof CreateSellerProfileSchema>;
export type UpdateSellerProfileInput = z.infer<typeof UpdateSellerProfileSchema>;
