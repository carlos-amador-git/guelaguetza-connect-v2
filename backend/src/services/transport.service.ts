import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';

export class TransportService {
  constructor(private prisma: PrismaClient) {}

  async listRoutes() {
    const routes = await this.prisma.busRoute.findMany({
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: { buses: true },
        },
      },
    });

    return routes;
  }

  async getRouteById(id: string) {
    const route = await this.prisma.busRoute.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
        buses: true,
      },
    });

    if (!route) {
      throw new NotFoundError('Ruta no encontrada');
    }

    return route;
  }

  async getRouteByCode(routeCode: string) {
    const route = await this.prisma.busRoute.findUnique({
      where: { routeCode },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
        buses: true,
      },
    });

    if (!route) {
      throw new NotFoundError('Ruta no encontrada');
    }

    return route;
  }

  async getRealtimePosition(routeId: string) {
    const route = await this.prisma.busRoute.findUnique({
      where: { id: routeId },
      include: {
        stops: {
          orderBy: { sequence: 'asc' },
        },
        buses: true,
      },
    });

    if (!route) {
      throw new NotFoundError('Ruta no encontrada');
    }

    // Simulate bus position based on current time
    const now = new Date();
    const minutes = now.getMinutes();
    const totalStops = route.stops.length;
    const currentStopIndex = minutes % totalStops;
    const nextStopIndex = (currentStopIndex + 1) % totalStops;

    const currentStop = route.stops[currentStopIndex];
    const nextStop = route.stops[nextStopIndex];

    // Simulate position between stops
    const progress = (now.getSeconds() / 60);
    const latitude = currentStop.latitude + (nextStop.latitude - currentStop.latitude) * progress;
    const longitude = currentStop.longitude + (nextStop.longitude - currentStop.longitude) * progress;

    // Calculate ETA based on frequency and position
    const frequency = route.frequency || 10;
    const eta = Math.ceil(frequency * (1 - progress));

    return {
      routeId: route.id,
      routeCode: route.routeCode,
      busId: route.buses[0]?.id || 'BUS-001',
      currentStop: {
        id: currentStop.id,
        name: currentStop.name,
        latitude: currentStop.latitude,
        longitude: currentStop.longitude,
      },
      nextStop: {
        id: nextStop.id,
        name: nextStop.name,
        eta,
      },
      latitude,
      longitude,
      heading: this.calculateHeading(currentStop, nextStop),
      speed: 25 + Math.random() * 10, // 25-35 km/h
      capacity: {
        total: 40,
        occupied: Math.floor(Math.random() * 30),
        available: 0,
      },
    };
  }

  async getStopById(id: string) {
    const stop = await this.prisma.stop.findUnique({
      where: { id },
      include: {
        route: {
          select: {
            id: true,
            routeCode: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!stop) {
      throw new NotFoundError('Parada no encontrada');
    }

    return stop;
  }

  private calculateHeading(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
    const dLon = to.longitude - from.longitude;
    const y = Math.sin(dLon) * Math.cos(to.latitude);
    const x = Math.cos(from.latitude) * Math.sin(to.latitude) -
              Math.sin(from.latitude) * Math.cos(to.latitude) * Math.cos(dLon);
    const heading = Math.atan2(y, x) * (180 / Math.PI);
    return (heading + 360) % 360;
  }
}
