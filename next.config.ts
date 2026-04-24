import type { NextConfig } from "next";
import process from "node:process";
import { unimport } from 'unimport-loader'

const unimportLoader = unimport({
  transpilePackages: ["@assistant-ui/react", "@assistant-ui/react-ai-sdk"],
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

if (process.env.ONLY_SERVER)
  Object.assign(nextConfig, {
    adapterPath: import.meta.resolve("next-bun-compile"),
    output: 'standalone',
  })

if (process.env.ONLY_CLIENT)
  Object.assign(nextConfig, { output: 'export' })

export default nextConfig;