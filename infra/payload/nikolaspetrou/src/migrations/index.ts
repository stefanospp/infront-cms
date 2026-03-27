import * as migration_20260327_081754 from './20260327_081754';
import * as migration_20260327_164956 from './20260327_164956';

export const migrations = [
  {
    up: migration_20260327_081754.up,
    down: migration_20260327_081754.down,
    name: '20260327_081754',
  },
  {
    up: migration_20260327_164956.up,
    down: migration_20260327_164956.down,
    name: '20260327_164956'
  },
];
