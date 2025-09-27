/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: "export", // <-- tells Next.js to do static export
};

module.exports = nextConfig;
