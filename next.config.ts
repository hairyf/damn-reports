import type { NextConfig } from "next";
import process from "node:process";

const nextConfig: NextConfig = {};

if (process.env.ONLY_SERVER)
  Object.assign(nextConfig, {
    adapterPath: import.meta.resolve("next-bun-compile"),
    output: 'standalone',
  })

if (process.env.ONLY_CLIENT)
  Object.assign(nextConfig, { output: 'export' })

export default nextConfig;