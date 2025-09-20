/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This will allow the build to succeed even with ESLint errors
  },
};

module.exports = nextConfig;
