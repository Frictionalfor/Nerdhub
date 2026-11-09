import { defineConfig } from 'prisma/config';

/**
 * NerdHub Prisma configuration.
 *
 * The schema lives at the repository root (`prisma/schema.prisma`) so it is
 * shared by the API and worker processes. This file replaces the deprecated
 * `prisma` key in package.json (removed in Prisma 7).
 */
export default defineConfig({
  schema: '../../prisma/schema.prisma',
});
