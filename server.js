const express = require('express');
const path = require('path');
const apiApp = require('./api/index');

const server = express();

// Serve static frontend files
server.use(express.static(path.join(__dirname)));

// Mount the API application (which already handles routes under /api/)
server.use(apiApp);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Local development server running on http://localhost:${PORT}`);
});
