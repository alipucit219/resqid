/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

/** @type {import('next').NextConfig} */

// Remove this if you're not using Fullcalendar features

const isProd = process.env.NODE_ENV === 'production'
const isElectronBuild = process.env.BUILD_TARGET === 'electron'

module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  transpilePackages: [
    '@fullcalendar/common',
    '@fullcalendar/core',
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/list',
    '@fullcalendar/timegrid'
  ],
  typescript: {
    ignoreBuildErrors: true
  },
  // experimental: {
  //   esmExternals: false
  // },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    return config
  },
  env: {
    NEXT_BACKEND_URL: process.env.NEXT_BACKEND_URL
  },
  output: 'export',
  assetPrefix: isProd && isElectronBuild ? './' : undefined,
  images: { unoptimized: true }
}
