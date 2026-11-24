/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "wsrv.nl",
      },
      {
        protocol: "https",
        hostname: "images.weserv.nl",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/watched",
        destination: "/watchlist?tab=watched",
        permanent: false,
      },
      {
        source: "/favorites",
        destination: "/watchlist?tab=favorites",
        permanent: false,
      },
      {
        source: "/collections",
        destination: "/activity?tab=collections",
        permanent: false,
      },
      {
        source: "/import",
        destination: "/activity?tab=import",
        permanent: false,
      },
      {
        source: "/timeline",
        destination: "/activity?tab=timeline",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
