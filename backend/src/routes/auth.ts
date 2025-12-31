import { FastifyPluginAsync } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../schemas/auth.schema.js';
import { AppError } from '../utils/errors.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);

  // Register
  fastify.post('/register', async (request, reply) => {
    try {
      const data = registerSchema.parse(request.body);
      const user = await authService.register(data);
      const token = fastify.jwt.sign({ userId: user.id });

      return reply.status(201).send({
        success: true,
        token,
        user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    try {
      const data = loginSchema.parse(request.body);
      const user = await authService.login(data.email, data.password);
      const token = fastify.jwt.sign({ userId: user.id });

      return reply.send({
        success: true,
        token,
        user,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get profile (authenticated)
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = await authService.getProfile(request.user.userId);
      return reply.send(user);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Update profile (authenticated)
  fastify.put('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = updateProfileSchema.parse(request.body);
      const user = await authService.updateProfile(request.user.userId, data);
      return reply.send(user);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });
};

export default authRoutes;
