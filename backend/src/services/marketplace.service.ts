import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
  AddToCartInput,
  UpdateCartItemInput,
  CreateOrderInput,
  OrderQuery,
  CreateProductReviewInput,
  CreateSellerProfileInput,
  UpdateSellerProfileInput,
} from '../schemas/marketplace.schema.js';
import { stripeService } from './stripe.service.js';
import { AppError, NotFoundError } from '../utils/errors.js';

export class MarketplaceService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(query: ProductQuery) {
    const { category, minPrice, maxPrice, status, sellerId, search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: status || 'ACTIVE',
      ...(category && { category }),
      ...(sellerId && { sellerId }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          seller: {
            include: {
              user: {
                select: { id: true, nombre: true, avatar: true },
              },
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            user: {
              select: { id: true, nombre: true, apellido: true, avatar: true },
            },
          },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, nombre: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    return product;
  }

  async createProduct(userId: string, data: CreateProductInput) {
    // Get or create seller profile
    let seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!seller) {
      throw new AppError('Necesitas crear un perfil de vendedor primero', 400);
    }

    return this.prisma.product.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
        sellerId: seller.id,
        status: 'ACTIVE',
      },
      include: {
        seller: true,
      },
    });
  }

  async updateProduct(id: string, userId: string, data: UpdateProductInput) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    if (product.seller.userId !== userId) {
      throw new AppError('No tienes permiso para editar este producto', 403);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.price && { price: new Prisma.Decimal(data.price) }),
      },
    });
  }

  async deleteProduct(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    if (product.seller.userId !== userId) {
      throw new AppError('No tienes permiso para eliminar este producto', 403);
    }

    await this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { message: 'Producto eliminado' };
  }

  // ============================================
  // CART
  // ============================================

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  include: {
                    user: {
                      select: { id: true, nombre: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  seller: {
                    include: {
                      user: {
                        select: { id: true, nombre: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    return {
      ...cart,
      subtotal,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addToCart(userId: string, data: AddToCartInput) {
    const { productId, quantity } = data;

    // Get product
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Producto no encontrado');
    }

    if (product.status !== 'ACTIVE') {
      throw new AppError('Este producto no está disponible', 400);
    }

    if (product.stock < quantity) {
      throw new AppError(`Solo hay ${product.stock} unidades disponibles`, 400);
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new AppError(`Solo hay ${product.stock} unidades disponibles`, 400);
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, data: UpdateCartItemInput) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundError('Carrito no encontrado');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundError('Item no encontrado');
    }

    if (data.quantity > item.product.stock) {
      throw new AppError(`Solo hay ${item.product.stock} unidades disponibles`, 400);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: data.quantity },
    });

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundError('Carrito no encontrado');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundError('Item no encontrado');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return { message: 'Carrito vaciado' };
  }

  // ============================================
  // ORDERS
  // ============================================

  async createOrder(userId: string, data: CreateOrderInput) {
    const cart = await this.getCart(userId);

    if (cart.items.length === 0) {
      throw new AppError('El carrito está vacío', 400);
    }

    // Group items by seller
    const itemsBySeller = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      const sellerId = item.product.sellerId;
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, []);
      }
      itemsBySeller.get(sellerId)!.push(item);
    }

    // Create orders for each seller
    const orders = await this.prisma.$transaction(async (tx) => {
      const createdOrders = [];

      for (const [sellerId, items] of itemsBySeller) {
        const total = items.reduce(
          (sum, item) => sum + Number(item.product.price) * item.quantity,
          0
        );

        // Create payment intent
        const payment = await stripeService.createPaymentIntent({
          amount: Math.round(total * 100),
          description: `Orden de compra - Guelaguetza Connect`,
          metadata: { userId, sellerId },
        });

        // Create order
        const order = await tx.order.create({
          data: {
            userId,
            sellerId,
            total: new Prisma.Decimal(total),
            shippingAddress: data.shippingAddress as object,
            stripePaymentId: payment?.paymentIntentId,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
          include: {
            items: {
              include: { product: true },
            },
            seller: {
              include: {
                user: {
                  select: { id: true, nombre: true },
                },
              },
            },
          },
        });

        // Update product stock
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }

        createdOrders.push({
          order,
          clientSecret: payment?.clientSecret,
        });
      }

      // Clear cart
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return createdOrders;
    });

    return orders;
  }

  async getMyOrders(userId: string, query: OrderQuery) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: { product: true },
          },
          seller: {
            include: {
              user: {
                select: { id: true, nombre: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        seller: {
          include: {
            user: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        user: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // Check permission
    if (order.userId !== userId && order.seller.userId !== userId) {
      throw new AppError('No tienes permiso para ver esta orden', 403);
    }

    return order;
  }

  async updateOrderStatus(id: string, userId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!order) {
      throw new NotFoundError('Orden no encontrada');
    }

    // Only seller can update status
    if (order.seller.userId !== userId) {
      throw new AppError('No tienes permiso para actualizar esta orden', 403);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  }

  // ============================================
  // SELLER PROFILE
  // ============================================

  async getSellerProfile(userId: string) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, nombre: true, apellido: true, avatar: true },
        },
        products: {
          where: { status: 'ACTIVE' },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    return profile;
  }

  async createSellerProfile(userId: string, data: CreateSellerProfileInput) {
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new AppError('Ya tienes un perfil de vendedor', 400);
    }

    return this.prisma.sellerProfile.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateSellerProfile(userId: string, data: UpdateSellerProfileInput) {
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundError('Perfil de vendedor no encontrado');
    }

    return this.prisma.sellerProfile.update({
      where: { userId },
      data,
    });
  }

  // ============================================
  // REVIEWS
  // ============================================

  async createProductReview(userId: string, productId: string, data: CreateProductReviewInput) {
    // Check if user has purchased this product
    const hasPurchased = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: { productId },
        },
      },
    });

    if (!hasPurchased) {
      throw new AppError('Solo puedes resenar productos que hayas comprado', 403);
    }

    // Check for existing review
    const existingReview = await this.prisma.productReview.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existingReview) {
      throw new AppError('Ya has resenado este producto', 400);
    }

    const review = await this.prisma.productReview.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        user: {
          select: { id: true, nombre: true, avatar: true },
        },
      },
    });

    // Update seller rating
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (product) {
      const stats = await this.prisma.productReview.aggregate({
        where: { product: { sellerId: product.sellerId } },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await this.prisma.sellerProfile.update({
        where: { id: product.sellerId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count.rating,
        },
      });
    }

    return review;
  }
}
