import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  experimental: { serverActions: { bodySizeLimit: '42mb' } },
  outputFileTracingExcludes: { '/*': ['./delivery/**/*'] },
};
export default config;
