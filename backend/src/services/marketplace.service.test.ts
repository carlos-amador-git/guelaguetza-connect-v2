import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketplaceService } from './marketplace.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import { Prisma } from '@prisma/client';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let mockPrisma: any;
  let mockCache: any;
  let mockEventBus: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma = {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      sellerProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      productReview: {
        findUnique: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
    };

    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      invalidate: vi.fn().mockResolvedValue(undefined),
    };

    mockEventBus = {
      emitAsync: vi.fn(),
      emit: vi.fn(),
    };

    service = new MarketplaceService(mockPrisma, mockCache, mockEventBus);
  });

  // ============================================
  // PRODUCTS
  // ============================================

  describe('getProducts', () => {
    it('should return cached results if available', async () => {
      const cachedResult = { products: [], pagination: {} };
      mockCache.get.mockResolvedValue(cachedResult);

      const result = await service.getProducts({ page: 1, limit: 20 });

      expect(result).toEqual(cachedResult);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache when no cache hit', async () => {
      const mockProducts = [{ id: 'p1', name: 'Test Product', category: 'ARTESANIAS' }];
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.getProducts({ page: 1, limit: 20 });

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination.total).toBe(1);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.count.mockResolvedValue(0);

      await service.getProducts({ category: 'MEZCAL', page: 1, limit: 20 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'MEZCAL' }),
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return product from cache if available', async () => {
      const cachedProduct = { id: 'p1', name: 'Cached Product' };
      mockCache.get.mockResolvedValue(cachedProduct);

      const result = await service.getProductById('p1');

      expect(result).toEqual(cachedProduct);
      expect(mockPrisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if product does not exist', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductById('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should return and cache product from DB', async () => {
      const mockProduct = { id: 'p1', name: 'Test Product', seller: {}, reviews: [] };
      mockCache.get.mockResolvedValue(null);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.getProductById('p1');

      expect(result).toEqual(mockProduct);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe('createProduct', () => {
    it('should throw error if seller profile does not exist', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.createProduct('user-1', {
          name: 'Test',
          description: 'Test description that is long enough',
          price: 100,
          category: 'OTRO',
          stock: 5,
          images: [],
        })
      ).rejects.toThrow('Necesitas crear un perfil de vendedor primero');
    });

    it('should create product when seller profile exists', async () => {
      const mockSeller = { id: 'seller-1', userId: 'user-1' };
      const mockProduct = { id: 'p1', name: 'Test', sellerId: 'seller-1', status: 'ACTIVE' };

      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockSeller);
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.createProduct('user-1', {
        name: 'Test',
        description: 'Test description that is long enough',
        price: 100,
        category: 'OTRO',
        stock: 5,
        images: [],
      });

      expect(result).toEqual(mockProduct);
      expect(mockCache.invalidate).toHaveBeenCalledWith('products:list:*');
    });
  });

  describe('updateProduct', () => {
    it('should throw NotFoundError if product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProduct('nonexistent', 'user-1', { name: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError if user is not the seller', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        seller: { userId: 'other-user' },
      });

      await expect(
        service.updateProduct('p1', 'user-1', { name: 'New Name' })
      ).rejects.toThrow('No tienes permiso para editar este producto');
    });

    it('should update product and invalidate cache', async () => {
      const mockProduct = { id: 'p1', seller: { userId: 'user-1' } };
      const updatedProduct = { id: 'p1', name: 'New Name' };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct('p1', 'user-1', { name: 'New Name' });

      expect(result).toEqual(updatedProduct);
      expect(mockCache.del).toHaveBeenCalledWith('product:p1:detail');
      expect(mockCache.invalidate).toHaveBeenCalledWith('products:list:*');
    });
  });

  describe('deleteProduct', () => {
    it('should throw NotFoundError if product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.deleteProduct('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });

    it('should throw AppError if user is not the seller', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        seller: { userId: 'other-user' },
      });

      await expect(service.deleteProduct('p1', 'user-1')).rejects.toThrow(
        'No tienes permiso para eliminar este producto'
      );
    });

    it('should archive product and invalidate cache', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        seller: { userId: 'user-1' },
      });
      mockPrisma.product.update.mockResolvedValue({ id: 'p1', status: 'ARCHIVED' });

      const result = await service.deleteProduct('p1', 'user-1');

      expect(result).toEqual({ message: 'Producto eliminado' });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'ARCHIVED' },
      });
    });
  });

  // ============================================
  // SELLER PROFILE
  // ============================================

  describe('createSellerProfile', () => {
    it('should throw error if profile already exists', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue({ id: 'sp1' });

      await expect(
        service.createSellerProfile('user-1', { businessName: 'Test Store' })
      ).rejects.toThrow('Ya tienes un perfil de vendedor');
    });

    it('should create seller profile successfully', async () => {
      const mockProfile = { id: 'sp1', userId: 'user-1', businessName: 'Test Store' };
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);
      mockPrisma.sellerProfile.create.mockResolvedValue(mockProfile);

      const result = await service.createSellerProfile('user-1', { businessName: 'Test Store' });

      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateSellerProfile', () => {
    it('should throw NotFoundError if profile does not exist', async () => {
      mockPrisma.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSellerProfile('user-1', { businessName: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update seller profile', async () => {
      const mockProfile = { id: 'sp1', userId: 'user-1' };
      const updatedProfile = { id: 'sp1', businessName: 'New Name' };

      mockPrisma.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      mockPrisma.sellerProfile.update.mockResolvedValue(updatedProfile);

      const result = await service.updateSellerProfile('user-1', { businessName: 'New Name' });

      expect(result).toEqual(updatedProfile);
    });
  });

  // ============================================
  // REVIEWS
  // ============================================

  describe('createProductReview', () => {
    it('should throw error if review already exists', async () => {
      mockPrisma.productReview.findUnique.mockResolvedValue({ id: 'r1' });

      await expect(
        service.createProductReview('user-1', 'p1', { rating: 5 })
      ).rejects.toThrow('Ya has resenado este producto');
    });

    it('should create review and update seller rating', async () => {
      const mockReview = { id: 'r1', userId: 'user-1', productId: 'p1', rating: 4 };
      const mockProduct = { id: 'p1', sellerId: 'sp1' };

      mockPrisma.productReview.findUnique.mockResolvedValue(null);
      mockPrisma.productReview.create.mockResolvedValue(mockReview);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.productReview.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 1 },
      });
      mockPrisma.sellerProfile.update.mockResolvedValue({});

      const result = await service.createProductReview('user-1', 'p1', { rating: 4 });

      expect(result).toEqual(mockReview);
      expect(mockPrisma.sellerProfile.update).toHaveBeenCalledWith({
        where: { id: 'sp1' },
        data: { rating: 4, reviewCount: 1 },
      });
    });
  });
});
