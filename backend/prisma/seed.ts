import { PrismaClient, RouteType, UserRole, ProductCategory, ProductStatus, StreamCategory, StreamStatus, POICategory, ExperienceCategory, EventCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Clear existing data (Phase 6 first due to foreign keys)
  await prisma.booking.deleteMany();
  await prisma.experienceTimeSlot.deleteMany();
  await prisma.experienceReview.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.pOICheckIn.deleteMany();
  await prisma.pOIFavorite.deleteMany();
  await prisma.pOIReview.deleteMany();
  await prisma.pointOfInterest.deleteMany();
  await prisma.streamMessage.deleteMany();
  await prisma.liveStream.deleteMany();
  await prisma.productReview.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.eventReminder.deleteMany();
  await prisma.eventRSVP.deleteMany();
  await prisma.event.deleteMany();
  // Original cleanup
  await prisma.activityLog.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.story.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.busRoute.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@guelaguetza.mx',
      password: adminPassword,
      nombre: 'Admin',
      apellido: 'Guelaguetza',
      region: 'Valles Centrales',
      role: UserRole.ADMIN,
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@guelaguetza.mx',
      password: hashedPassword,
      nombre: 'Usuario Demo',
      apellido: 'Oaxaca',
      region: 'Valles Centrales',
      role: UserRole.USER,
    },
  });

  console.log('Created demo user:', demoUser.email);

  // Create BinniBus routes
  const route1 = await prisma.busRoute.create({
    data: {
      routeCode: 'RC01',
      name: 'Ruta Auditorio (Guelaguetza Segura)',
      color: '#D9006C',
      type: RouteType.ESPECIAL,
      description: 'Ruta especial que conecta el centro con el Auditorio Guelaguetza durante el festival',
      startTime: '06:00',
      endTime: '23:00',
      frequency: 10,
      stops: {
        create: [
          { name: 'Alameda de León', latitude: 17.0618, longitude: -96.7252, sequence: 1 },
          { name: 'Chedraui Madero', latitude: 17.0634, longitude: -96.7189, sequence: 2 },
          { name: 'Museo Infantil', latitude: 17.0689, longitude: -96.7156, sequence: 3 },
          { name: 'Auditorio Guelaguetza', latitude: 17.0712, longitude: -96.7098, sequence: 4 },
        ],
      },
      buses: {
        create: [
          { busCode: 'RC01-001', capacity: 40 },
          { busCode: 'RC01-002', capacity: 40 },
        ],
      },
    },
  });

  const route2 = await prisma.busRoute.create({
    data: {
      routeCode: 'RC02',
      name: 'Ruta Feria del Mezcal',
      color: '#00AEEF',
      type: RouteType.ESPECIAL,
      description: 'Ruta especial que conecta con la Feria del Mezcal en el Centro de Convenciones',
      startTime: '10:00',
      endTime: '22:00',
      frequency: 15,
      stops: {
        create: [
          { name: 'Centro Convenciones (CCCO)', latitude: 17.0823, longitude: -96.6956, sequence: 1 },
          { name: 'Parque Juárez', latitude: 17.0645, longitude: -96.7201, sequence: 2 },
          { name: 'Centro Histórico', latitude: 17.0612, longitude: -96.7256, sequence: 3 },
        ],
      },
      buses: {
        create: [
          { busCode: 'RC02-001', capacity: 40 },
        ],
      },
    },
  });

  const route3 = await prisma.busRoute.create({
    data: {
      routeCode: 'T01',
      name: 'Viguera - San Sebastián',
      color: '#6A0F49',
      type: RouteType.TRONCAL,
      description: 'Ruta troncal principal que cruza la ciudad de norte a sur',
      startTime: '05:30',
      endTime: '23:30',
      frequency: 8,
      stops: {
        create: [
          { name: 'Viguera', latitude: 17.0923, longitude: -96.7312, sequence: 1 },
          { name: 'Tecnológico', latitude: 17.0756, longitude: -96.7234, sequence: 2 },
          { name: 'Centro', latitude: 17.0612, longitude: -96.7256, sequence: 3 },
          { name: 'Rosario', latitude: 17.0489, longitude: -96.7189, sequence: 4 },
        ],
      },
      buses: {
        create: [
          { busCode: 'T01-001', capacity: 50 },
          { busCode: 'T01-002', capacity: 50 },
          { busCode: 'T01-003', capacity: 50 },
        ],
      },
    },
  });

  console.log('Created routes:', route1.routeCode, route2.routeCode, route3.routeCode);

  // Create demo stories
  const stories = await Promise.all([
    prisma.story.create({
      data: {
        userId: demoUser.id,
        description: '¡Viviendo la magia del Lunes del Cerro! #Guelaguetza2025',
        mediaUrl: '/images/dance_pluma.png',
        location: 'Auditorio Guelaguetza',
        views: 342,
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        description: 'Probando los mejores mezcales artesanales.',
        mediaUrl: '/images/product_mezcal.png',
        location: 'Feria del Mezcal',
        views: 89,
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        description: 'El desfile de delegaciones es impresionante.',
        mediaUrl: '/images/dance_flor_de_pina.png',
        location: 'Santo Domingo',
        views: 1205,
      },
    }),
  ]);

  console.log('Created', stories.length, 'demo stories');

  // Create sample communities
  const communities = await Promise.all([
    prisma.community.create({
      data: {
        name: 'Amantes del Mezcal',
        slug: 'amantes-del-mezcal',
        description: 'Comunidad para quienes aprecian el mezcal artesanal oaxaqueño. Compartimos recomendaciones, historias y experiencias.',
        imageUrl: '/images/product_mezcal.png',
        coverUrl: '/images/product_mezcal.png',
        isPublic: true,
        createdById: adminUser.id,
        members: {
          create: [
            { userId: adminUser.id, role: 'ADMIN' },
            { userId: demoUser.id, role: 'MEMBER' },
          ],
        },
      },
    }),
    prisma.community.create({
      data: {
        name: 'Danzas Tradicionales',
        slug: 'danzas-tradicionales',
        description: 'Espacio para compartir la pasión por las danzas tradicionales de las 8 regiones de Oaxaca.',
        imageUrl: '/images/dance_pluma.png',
        coverUrl: '/images/dance_pluma.png',
        isPublic: true,
        createdById: demoUser.id,
        members: {
          create: [
            { userId: demoUser.id, role: 'ADMIN' },
          ],
        },
      },
    }),
    prisma.community.create({
      data: {
        name: 'Fotografía Guelaguetza',
        slug: 'fotografia-guelaguetza',
        description: 'Fotógrafos profesionales y aficionados compartiendo las mejores tomas del festival.',
        imageUrl: '/images/poi_auditorio_guelaguetza.png',
        coverUrl: '/images/poi_auditorio_guelaguetza.png',
        isPublic: true,
        createdById: adminUser.id,
        members: {
          create: [
            { userId: adminUser.id, role: 'ADMIN' },
          ],
        },
      },
    }),
  ]);

  console.log('Created', communities.length, 'demo communities');

  // Create demo conversation
  const conversation = await prisma.conversation.create({
    data: {
      userId: demoUser.id,
      messages: {
        create: [
          {
            role: 'model',
            text: '¡Hola! Soy GuelaBot. Pregúntame sobre rutas de transporte, horarios o la historia de las danzas.',
          },
          {
            role: 'user',
            text: '¿Cuándo es la Guelaguetza?',
          },
          {
            role: 'model',
            text: 'La Guelaguetza 2025 se celebra los días 21 y 28 de julio en el Auditorio Guelaguetza. Los eventos principales son los "Lunes del Cerro". ¡Te recomiendo llegar temprano!',
          },
        ],
      },
    },
  });

  console.log('Created demo conversation');

  // ============================================
  // PHASE 6: MARKETPLACE SEED DATA
  // ============================================

  // Create additional users for sellers
  const seller1 = await prisma.user.create({
    data: {
      email: 'artesano@guelaguetza.mx',
      password: hashedPassword,
      nombre: 'Maria',
      apellido: 'Gonzalez',
      region: 'Valles Centrales',
      role: UserRole.USER,
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'mezcalero@guelaguetza.mx',
      password: hashedPassword,
      nombre: 'Juan',
      apellido: 'Martinez',
      region: 'Sierra Sur',
      role: UserRole.USER,
    },
  });

  // Create seller profiles
  const sellerProfile1 = await prisma.sellerProfile.create({
    data: {
      userId: seller1.id,
      businessName: 'Artesanias Oaxaca',
      description: 'Artesanias tradicionales hechas a mano por familias oaxaquenas. Textiles, barro negro y alebrijes.',
      location: 'Mercado de Artesanias, Centro Historico',
      rating: 4.8,
      reviewCount: 156,
      verified: true,
    },
  });

  const sellerProfile2 = await prisma.sellerProfile.create({
    data: {
      userId: seller2.id,
      businessName: 'Mezcales Don Juan',
      description: 'Mezcales artesanales de agave espadin, tobala y madrecuishe. Tradicion familiar de 4 generaciones.',
      location: 'Santiago Matatlan, Oaxaca',
      rating: 4.9,
      reviewCount: 243,
      verified: true,
    },
  });

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Alebrije Jaguar Grande',
        description: 'Alebrije tallado a mano en madera de copal. Pintado con colores vibrantes y detalles intrincados. Pieza unica de arte popular oaxaqueno.',
        price: 2500,
        category: ProductCategory.ARTESANIA,
        status: ProductStatus.ACTIVE,
        stock: 5,
        images: ['/images/product_alebrije.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Rebozo de Telar de Cintura',
        description: 'Rebozo tradicional tejido en telar de cintura. Hilos de algodon tenidos con tintes naturales. Patron de grecas zapotecas.',
        price: 3800,
        category: ProductCategory.TEXTIL,
        status: ProductStatus.ACTIVE,
        stock: 3,
        images: ['/images/textil_rebozo.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Barro Negro - Vasija Dona Rosa',
        description: 'Vasija de barro negro pulido, tecnica tradicional de San Bartolo Coyotepec. Acabado brillante sin esmalte.',
        price: 1200,
        category: ProductCategory.CERAMICA,
        status: ProductStatus.ACTIVE,
        stock: 8,
        images: ['/images/product_barro_negro.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile2.id,
        name: 'Mezcal Espadin Joven 750ml',
        description: 'Mezcal artesanal de agave espadin. Destilado en alambique de cobre. Notas ahumadas y citricos. 45% alc.',
        price: 850,
        category: ProductCategory.MEZCAL,
        status: ProductStatus.ACTIVE,
        stock: 25,
        images: ['/images/product_mezcal.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile2.id,
        name: 'Mezcal Tobala Reposado 750ml',
        description: 'Mezcal premium de agave tobala silvestre. Reposado 6 meses en barrica de roble. Edicion limitada. 48% alc.',
        price: 2200,
        category: ProductCategory.MEZCAL,
        status: ProductStatus.ACTIVE,
        stock: 10,
        images: ['/images/product_mezcal_tobala.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Aretes Filigrana de Plata',
        description: 'Aretes de plata .925 con tecnica de filigrana tradicional. Diseno de flores de Oaxaca.',
        price: 1500,
        category: ProductCategory.JOYERIA,
        status: ProductStatus.ACTIVE,
        stock: 12,
        images: ['/images/product_joyeria.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile2.id,
        name: 'Chocolate de Metate 500g',
        description: 'Chocolate tradicional molido en metate. Cacao oaxaqueno, canela y almendra. Para preparar chocolate caliente.',
        price: 180,
        category: ProductCategory.GASTRONOMIA,
        status: ProductStatus.ACTIVE,
        stock: 50,
        images: ['/images/product_chocolate.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Tapete Zapoteco Mediano',
        description: 'Tapete tejido a mano con lana de borrego. Diseno geometrico tradicional de Teotitlan del Valle. 1.2m x 0.8m.',
        price: 4500,
        category: ProductCategory.TEXTIL,
        status: ProductStatus.ACTIVE,
        stock: 2,
        images: ['/images/textil_tapete_zapoteco.png'],
      },
    }),
    // --- 7 productos adicionales ---
    prisma.product.create({
      data: {
        sellerId: sellerProfile2.id,
        name: 'Mezcal Madrecuishe Ancestral 750ml',
        description: 'Mezcal ancestral de agave madrecuishe destilado en olla de barro. Sabor complejo con notas herbales y minerales. 47% alc.',
        price: 1800,
        category: ProductCategory.MEZCAL,
        status: ProductStatus.ACTIVE,
        stock: 8,
        images: ['/images/product_mezcal.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Alebrije Buho Mediano',
        description: 'Buho tallado en madera de copal por artesanos de San Martin Tilcajete. Pintado a mano con motivos cosmicos mixteco-zapotecas.',
        price: 1400,
        category: ProductCategory.ARTESANIA,
        status: ProductStatus.ACTIVE,
        stock: 7,
        images: ['/images/product_alebrije.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Huipil Bordado a Mano',
        description: 'Huipil tradicional bordado a mano por artesanas de San Antonino Castillo Velasco. Flores multicolor sobre manta de algodon.',
        price: 5200,
        category: ProductCategory.TEXTIL,
        status: ProductStatus.ACTIVE,
        stock: 2,
        images: ['/images/textil_rebozo.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Barro Negro - Calavera Decorativa',
        description: 'Calavera de barro negro con detalles calados. Tecnica de San Bartolo Coyotepec. Ideal para Dia de Muertos o decoracion.',
        price: 680,
        category: ProductCategory.CERAMICA,
        status: ProductStatus.ACTIVE,
        stock: 15,
        images: ['/images/product_barro_negro.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile2.id,
        name: 'Mole Negro Oaxaqueno 500g',
        description: 'Pasta de mole negro preparada artesanalmente. Receta tradicional con mas de 30 ingredientes incluyendo chocolate, chile y especias.',
        price: 250,
        category: ProductCategory.GASTRONOMIA,
        status: ProductStatus.ACTIVE,
        stock: 40,
        images: ['/images/gastro_tlayuda_dish.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile1.id,
        name: 'Collar de Filigrana Oaxaquena',
        description: 'Collar de plata .925 con tecnica de filigrana. Diseno de mariposas entrelazadas, tradicion orfebre de Oaxaca.',
        price: 2800,
        category: ProductCategory.JOYERIA,
        status: ProductStatus.ACTIVE,
        stock: 4,
        images: ['/images/product_joyeria.png'],
      },
    }),
    prisma.product.create({
      data: {
        sellerId: sellerProfile2.id,
        name: 'Chapulines Preparados 250g',
        description: 'Chapulines tostados con ajo, limon y sal de gusano. Snack tradicional oaxaqueno, alto en proteina. Cosechados en temporada.',
        price: 120,
        category: ProductCategory.GASTRONOMIA,
        status: ProductStatus.ACTIVE,
        stock: 60,
        images: ['/images/gastro_tlayuda_dish.png'],
      },
    }),
  ]);

  console.log('Created', products.length, 'products for marketplace');

  // ============================================
  // PHASE 6: STREAMING SEED DATA
  // ============================================

  const streams = await Promise.all([
    prisma.liveStream.create({
      data: {
        userId: adminUser.id,
        title: 'Danza de la Pluma en Vivo - Delegacion de los Valles',
        description: 'Transmision en vivo desde el Auditorio Guelaguetza. La majestuosa Danza de la Pluma interpretada por la delegacion de los Valles Centrales.',
        category: StreamCategory.DANZA,
        status: StreamStatus.LIVE,
        startedAt: new Date(),
        viewerCount: 1547,
        peakViewers: 2103,
        thumbnailUrl: '/images/dance_pluma.png',
      },
    }),
    prisma.liveStream.create({
      data: {
        userId: seller2.id,
        title: 'Clase de Cata de Mezcal - Don Juan Martinez',
        description: 'Aprende a catar mezcal como un experto. Conoce las diferencias entre espadin, tobala, madrecuishe y mas.',
        category: StreamCategory.CHARLA,
        status: StreamStatus.LIVE,
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        viewerCount: 234,
        peakViewers: 312,
        thumbnailUrl: '/images/product_mezcal.png',
      },
    }),
    prisma.liveStream.create({
      data: {
        userId: demoUser.id,
        title: 'Preparacion de Mole Negro Oaxaqueno',
        description: 'Receta tradicional de mole negro paso a paso. Los secretos de la cocina oaxaquena.',
        category: StreamCategory.COCINA,
        status: StreamStatus.SCHEDULED,
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        viewerCount: 0,
        peakViewers: 0,
        thumbnailUrl: '/images/product_barro_negro.png',
      },
    }),
    prisma.liveStream.create({
      data: {
        userId: seller1.id,
        title: 'Taller de Alebrijes - Tecnica de Pintado',
        description: 'Aprende las tecnicas tradicionales de pintado de alebrijes con la maestra Maria Gonzalez.',
        category: StreamCategory.ARTESANIA,
        status: StreamStatus.SCHEDULED,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        viewerCount: 0,
        peakViewers: 0,
        thumbnailUrl: '/images/product_alebrije.png',
      },
    }),
    prisma.liveStream.create({
      data: {
        userId: adminUser.id,
        title: 'Concierto de Marimba - Feria del Mezcal',
        description: 'Musica tradicional oaxaquena en vivo desde la Feria del Mezcal en el CCCO.',
        category: StreamCategory.MUSICA,
        status: StreamStatus.ENDED,
        startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        viewerCount: 0,
        peakViewers: 892,
        vodUrl: 'https://example.com/vod/marimba',
        thumbnailUrl: '/images/poi_auditorio_guelaguetza.png',
      },
    }),
  ]);

  console.log('Created', streams.length, 'streams');

  // ============================================
  // PHASE 6: AR MAP / POI SEED DATA
  // ============================================

  const pois = await Promise.all([
    prisma.pointOfInterest.create({
      data: {
        name: 'Auditorio Guelaguetza',
        description: 'Sede principal de la fiesta mas grande de Oaxaca. Construido en 1974, tiene capacidad para 11,000 espectadores. Aqui se realizan las presentaciones de los Lunes del Cerro.',
        category: POICategory.CULTURAL,
        latitude: 17.0712,
        longitude: -96.7098,
        address: 'Cerro del Fortin s/n, Centro, Oaxaca',
        rating: 4.9,
        reviewCount: 2341,
        isVerified: true,
        imageUrl: '/images/poi_auditorio_guelaguetza.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Mercado 20 de Noviembre',
        description: 'Mercado gastronomico famoso por sus pasillos de carnes asadas, chapulines, quesos y chocolate. Imperdible para probar la autentica cocina oaxaquena.',
        category: POICategory.GASTRONOMIA,
        latitude: 17.0598,
        longitude: -96.7234,
        address: '20 de Noviembre s/n, Centro, Oaxaca',
        rating: 4.7,
        reviewCount: 1856,
        isVerified: true,
        imageUrl: '/images/poi_santo_domingo.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Templo de Santo Domingo',
        description: 'Joya del barroco novohispano. Construido entre 1551 y 1608. Su interior dorado es considerado una de las maravillas de Mexico.',
        category: POICategory.CULTURAL,
        latitude: 17.0649,
        longitude: -96.7256,
        address: 'Alcala s/n, Centro Historico, Oaxaca',
        rating: 4.9,
        reviewCount: 3421,
        isVerified: true,
        imageUrl: '/images/poi_santo_domingo.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Centro de Convenciones (CCCO)',
        description: 'Sede de la Feria del Mezcal durante la Guelaguetza. Aqui podras degustar mezcales de todo el estado y disfrutar de musica en vivo.',
        category: POICategory.EVENTO,
        latitude: 17.0823,
        longitude: -96.6956,
        address: 'Blvd. Guadalupe Hinojosa s/n, Oaxaca',
        rating: 4.5,
        reviewCount: 567,
        isVerified: true,
        imageUrl: '/images/product_mezcal.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Mercado de Artesanias',
        description: 'El mejor lugar para comprar artesanias oaxaquenas. Alebrijes, barro negro, textiles, joyeria de plata y mas.',
        category: POICategory.ARTESANIA,
        latitude: 17.0623,
        longitude: -96.7267,
        address: 'J.P. Garcia 503, Centro, Oaxaca',
        rating: 4.6,
        reviewCount: 1234,
        isVerified: true,
        imageUrl: '/images/product_alebrije.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Hierve el Agua',
        description: 'Formaciones rocosas petrificadas con pozas naturales. Vistas espectaculares de los Valles Centrales. A 70km de la ciudad.',
        category: POICategory.NATURALEZA,
        latitude: 16.8661,
        longitude: -96.2756,
        address: 'San Lorenzo Albarradas, Oaxaca',
        rating: 4.8,
        reviewCount: 2156,
        isVerified: true,
        imageUrl: '/images/poi_hierve_el_agua.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Monte Alban',
        description: 'Antigua capital zapoteca y Patrimonio de la Humanidad. Centro ceremonial con piramides, juego de pelota y tumbas. Fundada 500 a.C.',
        category: POICategory.CULTURAL,
        latitude: 17.0436,
        longitude: -96.7677,
        address: 'Carretera Monte Alban km 8, Oaxaca',
        rating: 4.9,
        reviewCount: 4532,
        isVerified: true,
        imageUrl: '/images/poi_monte_alban.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Parada BinniBus - Alameda',
        description: 'Parada principal del servicio BinniBus. Rutas hacia el Auditorio Guelaguetza y Centro de Convenciones.',
        category: POICategory.TRANSPORTE,
        latitude: 17.0618,
        longitude: -96.7252,
        address: 'Alameda de Leon, Centro, Oaxaca',
        rating: 4.2,
        reviewCount: 89,
        isVerified: true,
        imageUrl: '/images/poi_auditorio_guelaguetza.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'San Bartolo Coyotepec - Barro Negro',
        description: 'Pueblo famoso por el barro negro. Visita talleres familiares y conoce la tecnica de Dona Rosa. A 12km de la ciudad.',
        category: POICategory.ARTESANIA,
        latitude: 16.9612,
        longitude: -96.7234,
        address: 'San Bartolo Coyotepec, Oaxaca',
        rating: 4.7,
        reviewCount: 876,
        isVerified: true,
        imageUrl: '/images/product_barro_negro.png',
      },
    }),
    prisma.pointOfInterest.create({
      data: {
        name: 'Teotitlan del Valle - Tapetes',
        description: 'Comunidad zapoteca famosa por sus tapetes de lana tejidos a mano. Tradicion que data de la epoca prehispanica.',
        category: POICategory.ARTESANIA,
        latitude: 17.0267,
        longitude: -96.5234,
        address: 'Teotitlan del Valle, Oaxaca',
        rating: 4.8,
        reviewCount: 1243,
        isVerified: true,
        imageUrl: '/images/product_textiles.png',
      },
    }),
  ]);

  console.log('Created', pois.length, 'points of interest');

  // ============================================
  // PHASE 6: EXPERIENCES / RESERVATIONS SEED DATA
  // ============================================

  // Create experience host user
  const hostUser = await prisma.user.create({
    data: {
      email: 'guia@guelaguetza.mx',
      password: hashedPassword,
      nombre: 'Roberto',
      apellido: 'Hernandez',
      region: 'Valles Centrales',
      role: UserRole.USER,
    },
  });

  const experiences = await Promise.all([
    prisma.experience.create({
      data: {
        hostId: hostUser.id,
        title: 'Tour Guelaguetza VIP',
        description: 'Vive la Guelaguetza como nunca antes. Incluye asientos VIP en el Auditorio, visita a camerinos, foto con delegaciones y degustacion de mezcal.',
        category: ExperienceCategory.TOUR,
        price: 2500,
        duration: 240,
        maxCapacity: 12,
        location: 'Auditorio Guelaguetza',
        latitude: 17.0712,
        longitude: -96.7098,
        includes: ['Asientos VIP', 'Acceso a camerinos', 'Degustacion de mezcal', 'Foto con delegaciones', 'Transporte desde centro'],
        languages: ['Espanol', 'Ingles'],
        rating: 4.9,
        reviewCount: 87,
        imageUrl: '/images/poi_auditorio_guelaguetza.png',
        images: ['/images/poi_auditorio_guelaguetza.png', '/images/dance_pluma.png'],
      },
    }),
    prisma.experience.create({
      data: {
        hostId: seller1.id,
        title: 'Taller de Alebrijes',
        description: 'Aprende a tallar y pintar tu propio alebrije con la maestra Maria Gonzalez. Te llevas tu creacion a casa.',
        category: ExperienceCategory.TALLER,
        price: 800,
        duration: 180,
        maxCapacity: 8,
        location: 'Taller Artesanias Oaxaca, Centro',
        latitude: 17.0623,
        longitude: -96.7267,
        includes: ['Materiales', 'Madera de copal', 'Pinturas', 'Pinceles', 'Tu alebrije terminado'],
        languages: ['Espanol'],
        rating: 4.8,
        reviewCount: 156,
        imageUrl: '/images/product_alebrije.png',
        images: ['/images/product_alebrije.png'],
      },
    }),
    prisma.experience.create({
      data: {
        hostId: seller2.id,
        title: 'Ruta del Mezcal',
        description: 'Visita 3 palenques artesanales en Santiago Matatlan, la capital mundial del mezcal. Conoce el proceso de produccion y degusta variedades exclusivas.',
        category: ExperienceCategory.DEGUSTACION,
        price: 1500,
        duration: 360,
        maxCapacity: 10,
        location: 'Santiago Matatlan, Oaxaca',
        latitude: 16.8567,
        longitude: -96.3789,
        includes: ['Transporte desde Oaxaca', 'Visita a 3 palenques', 'Degustacion de 8 mezcales', 'Comida tradicional', 'Botella de mezcal'],
        languages: ['Espanol', 'Ingles'],
        rating: 4.9,
        reviewCount: 234,
        imageUrl: '/images/product_mezcal.png',
        images: ['/images/product_mezcal.png'],
      },
    }),
    prisma.experience.create({
      data: {
        hostId: hostUser.id,
        title: 'Monte Alban al Amanecer',
        description: 'Experiencia unica de visitar Monte Alban antes de que abra al publico. Ve el amanecer desde la Gran Plaza con un arqueologo experto.',
        category: ExperienceCategory.VISITA,
        price: 1200,
        duration: 240,
        maxCapacity: 15,
        location: 'Zona Arqueologica Monte Alban',
        latitude: 17.0436,
        longitude: -96.7677,
        includes: ['Entrada especial', 'Guia arqueologo', 'Desayuno oaxaqueno', 'Transporte'],
        languages: ['Espanol', 'Ingles', 'Frances'],
        rating: 5.0,
        reviewCount: 89,
        imageUrl: '/images/poi_monte_alban.png',
        images: ['/images/poi_monte_alban.png'],
      },
    }),
    prisma.experience.create({
      data: {
        hostId: demoUser.id,
        title: 'Clase de Cocina Oaxaquena',
        description: 'Aprende a preparar mole negro, tlayudas y agua de chilacayota en una cocina tradicional. Incluye visita al mercado.',
        category: ExperienceCategory.CLASE,
        price: 950,
        duration: 300,
        maxCapacity: 6,
        location: 'Casa particular, Centro Historico',
        latitude: 17.0612,
        longitude: -96.7256,
        includes: ['Visita al mercado', 'Ingredientes', 'Recetario', 'Comida que preparaste', 'Delantal de regalo'],
        languages: ['Espanol', 'Ingles'],
        rating: 4.9,
        reviewCount: 178,
        imageUrl: '/images/poi_santo_domingo.png',
        images: ['/images/poi_santo_domingo.png', '/images/product_barro_negro.png'],
      },
    }),
    prisma.experience.create({
      data: {
        hostId: hostUser.id,
        title: 'Tour Fotografia en Hierve el Agua',
        description: 'Excursion fotografica a Hierve el Agua. Aprovecha la mejor luz del amanecer con un fotografo profesional.',
        category: ExperienceCategory.TOUR,
        price: 1800,
        duration: 480,
        maxCapacity: 8,
        location: 'Hierve el Agua',
        latitude: 16.8661,
        longitude: -96.2756,
        includes: ['Transporte', 'Entrada', 'Guia fotografico', 'Tips de fotografia', 'Desayuno', 'Edicion de 5 fotos'],
        languages: ['Espanol', 'Ingles'],
        rating: 4.8,
        reviewCount: 67,
        imageUrl: '/images/poi_hierve_el_agua.png',
        images: ['/images/poi_hierve_el_agua.png'],
      },
    }),
  ]);

  console.log('Created', experiences.length, 'experiences');

  // Create time slots for experiences (next 7 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const exp of experiences) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      // Morning slot
      await prisma.experienceTimeSlot.create({
        data: {
          experienceId: exp.id,
          date: date,
          startTime: '09:00',
          endTime: exp.duration <= 180 ? '12:00' : '13:00',
          capacity: exp.maxCapacity,
          bookedCount: day === 0 ? Math.floor(Math.random() * 3) : 0,
          isAvailable: true,
        },
      });

      // Afternoon slot (except for long tours)
      if (exp.duration <= 300) {
        await prisma.experienceTimeSlot.create({
          data: {
            experienceId: exp.id,
            date: date,
            startTime: '15:00',
            endTime: exp.duration <= 180 ? '18:00' : '20:00',
            capacity: exp.maxCapacity,
            bookedCount: 0,
            isAvailable: true,
          },
        });
      }
    }
  }

  console.log('Created time slots for all experiences');

  // ============================================
  // EVENTS SEED DATA
  // ============================================

  const now = new Date();
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Lunes del Cerro - Primera Guelaguetza',
        description: 'Presentacion de las delegaciones de las 8 regiones de Oaxaca con sus danzas, musica y vestimenta tradicional en el Auditorio Guelaguetza.',
        imageUrl: '/images/poi_auditorio_guelaguetza.png',
        location: 'Auditorio Guelaguetza, Cerro del Fortin',
        latitude: 17.0712,
        longitude: -96.7098,
        startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        category: EventCategory.DANZA,
        isOfficial: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Lunes del Cerro - Segunda Guelaguetza',
        description: 'Segunda jornada del festival con nuevas delegaciones. Danza de la Pluma, Flor de Pina y mas tradiciones.',
        imageUrl: '/images/dance_pluma.png',
        location: 'Auditorio Guelaguetza, Cerro del Fortin',
        latitude: 17.0712,
        longitude: -96.7098,
        startDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        category: EventCategory.DANZA,
        isOfficial: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Feria del Mezcal 2026',
        description: 'Degustacion de mezcales artesanales de todo Oaxaca. Mas de 100 marcas, musica en vivo y gastronomia.',
        imageUrl: '/images/product_mezcal.png',
        location: 'Centro de Convenciones (CCCO)',
        latitude: 17.0823,
        longitude: -96.6956,
        startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        category: EventCategory.GASTRONOMIA,
        isOfficial: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Desfile de Delegaciones',
        description: 'Colorido desfile por las calles del centro historico. Las delegaciones marchan con sus trajes tipicos acompanadas de bandas de musica.',
        imageUrl: '/images/dance_flor_de_pina.png',
        location: 'Centro Historico de Oaxaca',
        latitude: 17.0612,
        longitude: -96.7256,
        startDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        category: EventCategory.DESFILE,
        isOfficial: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Noche de Rábanos',
        description: 'Exposicion de figuras talladas en rabanos gigantes. Tradicion oaxaquena desde 1897.',
        imageUrl: '/images/poi_santo_domingo.png',
        location: 'Zocalo de Oaxaca',
        latitude: 17.0612,
        longitude: -96.7256,
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        category: EventCategory.ARTESANIA,
        isOfficial: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Concierto de Marimba y Banda de Viento',
        description: 'Musica tradicional oaxaquena en vivo. Marimba, banda de viento y chilenas.',
        imageUrl: '/images/poi_auditorio_guelaguetza.png',
        location: 'Plaza de la Danza',
        latitude: 17.0598,
        longitude: -96.7234,
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        category: EventCategory.MUSICA,
        isOfficial: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Ceremonia de la Diosa Centéotl',
        description: 'Eleccion de la Diosa Centeotl, representante de la fertilidad y el maiz. Ceremonia con danzas prehispanicas.',
        imageUrl: '/images/dance_tehuana.png',
        location: 'Auditorio Guelaguetza',
        latitude: 17.0712,
        longitude: -96.7098,
        startDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        category: EventCategory.CEREMONIA,
        isOfficial: true,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Taller de Barro Negro en San Bartolo',
        description: 'Taller abierto en los talleres de San Bartolo Coyotepec. Aprende la tecnica ancestral del barro negro.',
        imageUrl: '/images/product_barro_negro.png',
        location: 'San Bartolo Coyotepec',
        latitude: 16.9612,
        longitude: -96.7234,
        startDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        category: EventCategory.ARTESANIA,
        isOfficial: false,
      },
    }),
  ]);

  console.log('Created', events.length, 'events');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
