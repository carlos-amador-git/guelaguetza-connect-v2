import { describe, it, expect, beforeEach } from 'vitest';
import { MarketplaceService } from '../../src/services/marketplace.service.js';
import { prisma } from './setup-integration.js';
import bcrypt from 'bcryptjs';

describe('MarketplaceService Integration Tests', () => {
  let marketplaceService: MarketplaceService;
  let testUserId: string;
  let testSellerId: string;
  let testSellerProfileId: string;
  let testProductId: string;
  let testProduct2Id: string;

  beforeEach(async () => {
    marketplaceService = new MarketplaceService(prisma);

    // Crear usuario comprador
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
      data: {
        email: `test-buyer-${Date.now()}@example.com`,
        password: hashedPassword,
        nombre: 'Test',
        apellido: 'Buyer',
      },
    });
    testUserId = user.id;

    // Crear usuario vendedor
    const seller = await prisma.user.create({
      data: {
        email: `test-seller-${Date.now()}@example.com`,
        password: hashedPassword,
        nombre: 'Test',
        apellido: 'Seller',
        role: 'SELLER',
      },
    });
    testSellerId = seller.id;

    // Crear perfil de vendedor
    const sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId: testSellerId,
        storeName: 'Artesanías Oaxaqueñas',
        description: 'Productos artesanales auténticos',
        phoneNumber: '9511234567',
      },
    });
    testSellerProfileId = sellerProfile.id;

    // Crear producto de prueba
    const product = await prisma.product.create({
      data: {
        sellerId: testSellerProfileId,
        name: 'Alebrijes Pequeños',
        description: 'Figuras de madera tallada y pintada a mano',
        price: 250,
        category: 'ARTESANIAS',
        stock: 10,
        images: ['alebrije1.jpg'],
        status: 'ACTIVE',
      },
    });
    testProductId = product.id;

    // Crear segundo producto
    const product2 = await prisma.product.create({
      data: {
        sellerId: testSellerProfileId,
        name: 'Textil Zapoteco',
        description: 'Tapete tejido a mano',
        price: 800,
        category: 'ARTESANIAS',
        stock: 5,
        images: ['textil1.jpg'],
        status: 'ACTIVE',
      },
    });
    testProduct2Id = product2.id;
  });

  describe('getProducts', () => {
    it('should return products with filters', async () => {
      const result = await marketplaceService.getProducts({
        category: 'ARTESANIAS',
        page: 1,
        limit: 10,
      });

      expect(result.products.length).toBeGreaterThanOrEqual(2);
      expect(result.products.every((p) => p.category === 'ARTESANIAS')).toBe(true);
    });

    it('should filter by price range', async () => {
      const result = await marketplaceService.getProducts({
        minPrice: 200,
        maxPrice: 300,
        page: 1,
        limit: 10,
      });

      expect(result.products).toHaveLength(1);
      expect(Number(result.products[0].price)).toBe(250);
    });

    it('should search by name or description', async () => {
      const result = await marketplaceService.getProducts({
        search: 'Alebrijes',
        page: 1,
        limit: 10,
      });

      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products[0].name).toContain('Alebrijes');
    });

    it('should filter by seller', async () => {
      const result = await marketplaceService.getProducts({
        sellerId: testSellerProfileId,
        page: 1,
        limit: 10,
      });

      expect(result.products.length).toBeGreaterThanOrEqual(2);
      expect(result.products.every((p) => p.sellerId === testSellerProfileId)).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should return a product by id', async () => {
      const product = await marketplaceService.getProductById(testProductId);
      expect(product.id).toBe(testProductId);
      expect(product.name).toBe('Alebrijes Pequeños');
    });

    it('should throw NotFoundError for non-existent product', async () => {
      await expect(
        marketplaceService.getProductById('cld000000000000000000000')
      ).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('createSellerProfile', () => {
    it('should create seller profile successfully', async () => {
      const newSeller = await prisma.user.create({
        data: {
          email: `new-seller-${Date.now()}@example.com`,
          password: await bcrypt.hash('Password123!', 10),
          nombre: 'New',
          apellido: 'Seller',
        },
      });

      const profile = await marketplaceService.createSellerProfile(newSeller.id, {
        storeName: 'Nueva Tienda',
        description: 'Descripción de la tienda',
        phoneNumber: '9511111111',
      });

      expect(profile.userId).toBe(newSeller.id);
      expect(profile.storeName).toBe('Nueva Tienda');
    });

    it('should throw error if profile already exists', async () => {
      await expect(
        marketplaceService.createSellerProfile(testSellerId, {
          storeName: 'Duplicate',
          description: 'Test',
          phoneNumber: '9512222222',
        })
      ).rejects.toThrow('Ya tienes un perfil de vendedor');
    });
  });

  describe('createProduct', () => {
    it('should create a product for an existing seller profile', async () => {
      const product = await marketplaceService.createProduct(testSellerId, {
        name: 'Nuevo Producto',
        description: 'Descripción del nuevo producto de prueba',
        price: 350,
        category: 'CERAMICA',
        stock: 20,
        images: [],
      });

      expect(product.name).toBe('Nuevo Producto');
      expect(product.sellerId).toBe(testSellerProfileId);
      expect(product.status).toBe('ACTIVE');
    });

    it('should throw error if seller profile does not exist', async () => {
      await expect(
        marketplaceService.createProduct(testUserId, {
          name: 'Producto Sin Perfil',
          description: 'No debería crearse este producto',
          price: 100,
          category: 'OTRO',
          stock: 1,
          images: [],
        })
      ).rejects.toThrow('Necesitas crear un perfil de vendedor primero');
    });
  });

  describe('updateProduct', () => {
    it('should update a product owned by the seller', async () => {
      const updated = await marketplaceService.updateProduct(testProductId, testSellerId, {
        name: 'Alebrijes Actualizado',
      });

      expect(updated.name).toBe('Alebrijes Actualizado');
    });

    it('should throw error when non-owner tries to update', async () => {
      await expect(
        marketplaceService.updateProduct(testProductId, testUserId, {
          name: 'Intento de modificación',
        })
      ).rejects.toThrow('No tienes permiso para editar este producto');
    });
  });

  describe('deleteProduct', () => {
    it('should archive a product owned by the seller', async () => {
      const result = await marketplaceService.deleteProduct(testProductId, testSellerId);
      expect(result.message).toBe('Producto eliminado');

      const archivedProduct = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(archivedProduct?.status).toBe('ARCHIVED');
    });

    it('should throw error when non-owner tries to delete', async () => {
      await expect(
        marketplaceService.deleteProduct(testProductId, testUserId)
      ).rejects.toThrow('No tienes permiso para eliminar este producto');
    });
  });
});
