import 'dotenv/config';
import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   Guelaguetza Connect API                                 ║
    ║                                                           ║
    ║   Server running at http://${HOST}:${PORT}                  ║
    ║                                                           ║
    ║   Endpoints:                                              ║
    ║   • Auth:       /api/auth                                 ║
    ║   • Stories:    /api/stories                              ║
    ║   • Transport:  /api/transport                            ║
    ║   • Chat:       /api/chat                                 ║
    ║   • Bookings:   /api/bookings                             ║
    ║   • Marketplace:/api/marketplace                          ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
