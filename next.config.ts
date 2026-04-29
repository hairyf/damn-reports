import type { NextConfig } from 'next'
import { unimport } from 'unimport-loader'

const unimportLoader = unimport({
  presets: ['react', 'react-dom'],
  dts: true,
  dirs: [
    'src/store/index.ts',
    'src/layout/index.ts',
    'src/components/**',
    'src/config/**',
    'src/hooks/**',
    'src/utils/**',
  ],
  imports: [
    { from: 'next/navigation', imports: ['useRouter'] },
    { from: 'valtio-define', imports: ['useStore', 'defineStore'] },
    { from: 'react-if-lite', imports: ['If', 'Then', 'Else'] },
    {
      from: '@tanstack/react-query',
      imports: ['useQuery', 'useMutation', 'useInfiniteQuery'],
    },
  ],
})

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    rules: {
      '*.{tsx,ts,jsx,js}': {
        condition: { not: 'foreign' },
        loaders: [unimportLoader],
      },
    },
  },
  outputFileTracingIncludes: {
    '*': ['./prisma/**/*', './data/storage.default.json'],
  },
  reactStrictMode: false,
}

export default nextConfig
