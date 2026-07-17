/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  images: {
    // Farm/product photos uploaded via the backend admin are now served
    // from Cloudinary - next/image refuses to load external domains that
    // aren't explicitly allowlisted here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
