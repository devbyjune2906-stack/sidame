/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit & exceljs dijalankan di server (route handler), bukan di-bundle ke client
  serverExternalPackages: ["pdfkit", "exceljs"],
};

export default nextConfig;
