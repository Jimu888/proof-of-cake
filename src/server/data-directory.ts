import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const configured = process.env.MEMENT_DATA_DIR;
export const platformDirectory = configured
  ? resolve(/* turbopackIgnore: true */ configured)
  : process.env.VERCEL
    ? join(tmpdir(), 'mement-platform-demo')
    : resolve(process.cwd(), 'delivery/platform-demo');
