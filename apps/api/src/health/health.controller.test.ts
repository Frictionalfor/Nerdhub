import { HealthController } from './health.controller';
import type { PinoLogger } from '../common/logger/logger.service';

describe('HealthController', () => {
  it('returns an ok health response without database access', () => {
    const logger = { debug: jest.fn() } as unknown as PinoLogger;
    const controller = new HealthController(logger);

    const result = controller.health();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(logger.debug).toHaveBeenCalled();
  });
});
