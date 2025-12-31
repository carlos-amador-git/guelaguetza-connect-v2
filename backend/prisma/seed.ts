import { PrismaClient, RouteType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.story.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.busRoute.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@guelaguetza.mx',
      password: '$2a$10$rQnRHs5Zvz5Zvz5Zvz5ZvuqWGcXOqWGcXOqWGcXOqWGcXOqWGcXO', // "password123"
      nombre: 'Usuario Demo',
      apellido: 'Oaxaca',
      region: 'Valles Centrales',
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
        mediaUrl: 'https://picsum.photos/400/600?random=101',
        location: 'Auditorio Guelaguetza',
        views: 342,
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        description: 'Probando los mejores mezcales artesanales.',
        mediaUrl: 'https://picsum.photos/400/600?random=102',
        location: 'Feria del Mezcal',
        views: 89,
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        description: 'El desfile de delegaciones es impresionante.',
        mediaUrl: 'https://picsum.photos/400/600?random=103',
        location: 'Santo Domingo',
        views: 1205,
      },
    }),
  ]);

  console.log('Created', stories.length, 'demo stories');

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
