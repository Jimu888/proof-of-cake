import { resolve } from 'node:path';

const configured = process.env.MEMENT_DATA_DIR;
export const platformDirectory = configured
  ? resolve(/* turbopackIgnore: true */ configured)
  : resolve(process.cwd(), 'delivery/platform-demo');
