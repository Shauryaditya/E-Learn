/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ["utfs.io"]
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals = [...(config.externals || []), "canvas"];
        }
        config.resolve.fallback = { canvas: false };
        return config;
    }
};

export default nextConfig;
