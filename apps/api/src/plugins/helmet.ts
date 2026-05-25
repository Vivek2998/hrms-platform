import fp from 'fastify-plugin';
import fastifyHelmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

// MINOR-01 FIX: Enable Content Security Policy.
// The previous config had `contentSecurityPolicy: false` with a note about
// "managed by reverse proxy in prod" — but no reverse-proxy CSP was ever
// configured, leaving the API completely without CSP headers.
//
// This is a Fastify JSON API — it never serves HTML, scripts, or media.
// The policy below reflects that: block everything that isn't pure data.
// Browsers talking to this API won't try to render content, so these
// directives act as a last-resort safety net.
export const helmetPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc:    ["'none'"],    // API returns JSON — no embedded resources
        scriptSrc:     ["'none'"],    // Never execute scripts from this origin
        objectSrc:     ["'none'"],    // No plugins (Flash, etc.)
        frameAncestors:["'none'"],    // Prevent this origin being framed (clickjacking)
        formAction:    ["'none'"],    // No HTML forms on an API server
        imgSrc:        ["'none'"],    // No images served by the API
      },
    },
    // X-Frame-Options: DENY — belt-and-suspenders with frameAncestors above
    frameguard: { action: 'deny' },
  });
});
