import { PrismaClient, Prisma } from '@prisma/client';
import {
  IProductRepository,
  ProductFilters,
  PaginatedResult,
} from '../../domain/marketplace/repositories/IProductRepository.js';
import { Product } from '../../domain/marketplace/entities/Product.js';
import { Stock } from '../../domain/marketplace/value-objects/Stock.js';

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  // ==================== PRODUCT OPERATIONS ====================

  async save(product: Product): Promise<Product> {
    const data = {
      sellerId: product.sellerId,
      name: product.name,
      description: product.description,
      price: product.price.toDecimal(),
      status: product.status,
      stock: product.stock.quantity,
      images: product.images,
      version: product.version,
      // Add other fields from toJSON()
      ...product.toJSON(),
    };

    let saved;
    if (product.id) {
      // Update using optimistic locking
      const result = await this.prisma.product.updateMany({
        where: {
          id: product.id,
          version: product.version - 1,
        },
        data: {
          ...data,
          version: product.version,
        },
      });

      if (result.count === 0) {
        throw new Error('Concurrency conflict: product was modified');
      }

      saved = await this.prisma.product.findUnique({
        where: { id: product.id },
      });

      if (!saved) {
        throw new Error('Product not found after update');
      }
    } else {
      saved = await this.prisma.product.create({ data });
    }

    return this.toDomainProduct(saved);
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    return product ? this.toDomainProduct(product) : null;
  }

  async findBySeller(
    sellerId: string,
    filters?: ProductFilters
  ): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      sellerId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.toDomainProduct(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(filters?: ProductFilters): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.sellerId && { sellerId: filters.sellerId }),
      ...(filters?.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters?.maxPrice && { price: { lte: filters.maxPrice } }),
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => this.toDomainProduct(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== MAPPERS ====================

  private toDomainProduct(data: any): Product {
    return Product.reconstitute({
      id: data.id,
      sellerId: data.sellerId,
      name: data.name,
      description: data.description,
      price: Number(data.price),
      category: data.category,
      status: data.status,
      stock: data.stock,
      images: data.images || [],
      version: data.version,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
