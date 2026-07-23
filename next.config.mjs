/** @type {import('next').NextConfig} */
const nextConfig = {
  // De scraper draait als los node script, niet meebundelen
  outputFileTracingIncludes: {
    '/**': ['./data/**', './products.json'],
  },
};

export default nextConfig;
