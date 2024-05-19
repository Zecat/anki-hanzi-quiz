const express = require('express');
const path = require('path');
const os = require('os');

function getLocalIpAddress() {
    const ifaces = os.networkInterfaces();
    for (const iface of Object.values(ifaces)) {
        for (const { address, family, internal } of iface) {
            if (family === 'IPv4' && !internal) {
                return address;
            }
        }
    }
    return 'localhost'; // Fallback to localhost if no IP address found
}

const app = express();
const ip = getLocalIpAddress();
const port = 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS"); // Allow specified methods
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); // Allow specified headers
  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'static')));

app.listen(port, ip, () => {
    console.log(`Server is running at http://${ip}:${port}`);
});
