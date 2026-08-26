const net = require("net");
const client = new net.Socket();
client.connect(6379, "172.28.155.151", () => {
    console.log("Connected to Redis TCP!");
    client.write("PING\r\n");
});
client.on("data", (data) => {
    console.log("Received: " + data);
    client.destroy();
});
client.on("error", (err) => {
    console.error("Connection Error:", err.message);
});
