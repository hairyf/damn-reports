import type { NextConfig } from 'next'
import { unimport } from 'unimport-loader'

const unimportLoader = unimport({
  presets: ['react', 'react-dom'],
  dts: true,
  dirs: [
    'src/store/index.ts',
    'src/components/**',
    'src/config/**',
    'src/hooks/**',
    'src/utils/**',
  ],
  imports: [
    { from: 'valtio-define', imports: ['useStore', 'defineStore'] },
    { from: 'react-if-lite', imports: ['If', 'Then', 'Else'] },
    {
      from: '@tanstack/react-query',
      imports: ['useQuery', 'useMutation', 'useInfiniteQuery'],
    },
  ],
})

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.{tsx,ts,jsx,js}': {
        condition: { not: 'foreign' },
        loaders: [unimportLoader],
      },
    },
  },
  reactStrictMode: false,
}

export default nextConfig
