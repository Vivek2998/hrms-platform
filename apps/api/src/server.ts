import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = await buildApp();

const address = await app.listen({
  port: env.PORT,
  host: env.HOST,
});

console.log(`\n🚀 HRMS API running at ${address}`);
console.log(`📚 Swagger docs: ${address}/api/v1/docs\n`);
