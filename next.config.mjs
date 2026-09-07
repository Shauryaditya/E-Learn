import withPWAInit, { runtimeCaching } from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  reloadOnOnline: false,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && /^\/(?:api\/|teacher\/)?contests(?:\/|$)/.test(url.pathname),
        handler: "NetworkOnly",
        method: "GET",
      },
      ...runtimeCaching,
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["utfs.io"], // 👈 ADD THIS
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);
