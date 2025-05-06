/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Add support for web workers
    if (!isServer) {
      config.output.globalObject = 'self';
      
      // Handle worker files
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        loader: 'worker-loader',
        options: {
          filename: 'static/chunks/workers/[name].[contenthash].js',
          publicPath: '/_next/',
        },
      });
    }
    
    return config;
  },
};

export default nextConfig;
