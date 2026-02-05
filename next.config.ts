/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
    },
    async redirects() {
        return [
            {
                source: '/veiculo/:id',
                destination: '/mobile/vehicle/:id',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
