import * as migration_20260401_154422_initial from './20260401_154422_initial';
import * as migration_20260401_171417_add_api_key from './20260401_171417_add_api_key';
import * as migration_20260401_190711_add_audits from './20260401_190711_add_audits';

export const migrations = [
  {
    up: migration_20260401_154422_initial.up,
    down: migration_20260401_154422_initial.down,
    name: '20260401_154422_initial',
  },
  {
    up: migration_20260401_171417_add_api_key.up,
    down: migration_20260401_171417_add_api_key.down,
    name: '20260401_171417_add_api_key',
  },
  {
    up: migration_20260401_190711_add_audits.up,
    down: migration_20260401_190711_add_audits.down,
    name: '20260401_190711_add_audits'
  },
];
