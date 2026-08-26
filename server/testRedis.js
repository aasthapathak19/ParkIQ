const Redis = require("ioredis");
const redis = new Redis("redis://172.28.155.151:6379");
redis.on("connect", () => { console.log("Connected to WSL IP!"); process.exit(0); });
redis.on("error", (e) => { console.error(e); process.exit(1); });
