import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',

    images: {
        domains: ["utfs.io"]
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    }
};

export default withPWA(nextConfig);
