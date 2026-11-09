import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvSchema, type Env } from './env.schema';

/**
 * Root configuration module. Loads, validates and exposes typed env.
 */
export const ConfigRootModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
  ignoreEnvFile: process.env.NODE_ENV === 'production',
  expandVariables: true,
  validate: (config: Record<string, unknown>) => {
    const parsed = EnvSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration:\n${parsed.error.flatten().fieldErrors}`);
    }
    return parsed.data as Env;
  },
});

export { ConfigService, type Env };
