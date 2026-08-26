const net = require("net");
const client = new net.Socket();
client.connect(6379, "127.0.0.1", () => {
    console.log("Connected to Native Windows Redis TCP!");
    client.write("PING\r\n");
});
client.on("data", (data) => {
    console.log("Received: " + data);
    client.destroy();
});
client.on("error", (err) => {
    console.error("Connection Error:", err.message);
});
