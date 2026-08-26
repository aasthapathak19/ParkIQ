const Redis = require("ioredis");
const redis = new Redis("redis://127.0.0.1:6379");
redis.on("connect", () => { console.log("Connected to 127.0.0.1!"); process.exit(0); });
redis.on("error", (e) => { console.error(e); process.exit(1); });
