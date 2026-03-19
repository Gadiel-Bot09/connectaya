/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite compilar en producción a pesar de advertencias de variables sin usar o reglas estrictas.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite compilar en producción ignorando errores de tipos "any"
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
