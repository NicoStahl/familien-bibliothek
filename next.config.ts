import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  // Der Webpack-Filewatcher darf data/ (SQLite-Datei inkl. WAL) und cover/ nicht beobachten:
  // häufige Schreibzugriffe dort bringen den Windows-Watcher zum Absturz
  // ("Assertion failed: !_wcsnicmp(filename, dir, dirlen), file src\win\fs-event.c").
  // Dieser Projektordner liegt zudem im Synology-Drive-Sync — auch dessen Schreibzugriffe
  // gehen sonst als Dateiänderung durch und beenden den Dev-Server. Genau dieselbe Falle wie
  // bei Kochkiste; cover/ kommt hier zusätzlich dazu, weil dort bei jedem Scan eine neue
  // Bilddatei landet.
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/data/**", "**/cover/**", "**/node_modules/**", "**/.git/**", "**/design/**"],
    };
    return config;
  },
};

export default nextConfig;
