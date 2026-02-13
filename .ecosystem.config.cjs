// ecosystem.config.cjs - PM2 necesita CommonJS
module.exports = {
  apps: [
    {
      name: "karbot",
      script: "./index.js",
      interpreter: "node",
      interpreter_args: "--experimental-modules", // Si Node < 16
      watch: true,
      ignore_watch: [
        "node_modules",
        "sessions", 
        "tmp",
        ".git",
        "*.log"
      ],
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      node_args: "--es-module-specifier-resolution=node"
    },
    {
      name: "keepalive",
      script: "./keepalive.js",
      interpreter: "node",
      watch: false,
      env: {
        PORT: 3000,
        NODE_ENV: "production"
      },
      node_args: "--es-module-specifier-resolution=node"
    }
  ]
};