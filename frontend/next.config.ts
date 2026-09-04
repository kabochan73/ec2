import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番の Docker イメージ（docs/04）は .next/standalone を使うので、standalone 出力を有効化する。
  // ローカルの next dev には影響しない。
  output: "standalone",
};

export default nextConfig;
