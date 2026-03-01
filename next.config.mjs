/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tauri requires static export; enable only when building for desktop (npm run build:tauri).
  ...(process.env.TAURI_BUILD === '1' && { output: 'export' }),
};

export default nextConfig;
