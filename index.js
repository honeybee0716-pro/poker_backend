'use strict';
const dotEnv = require('dotenv');
dotEnv.config();

const http = require('http');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const Routes = require('./src/admin/routes');
const { retrunValidation } = require('./src/admin/middleware/validation');

// Imports
const config = require('./config');
const { startGames, initSocket } = require('./holdem');

const app = express();
app.use(
    cors({
        origin: '*'
    })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/admin', Routes);

app.use(retrunValidation);

app.use(
    express.static(path.join(__dirname, './', 'build'))
);

app.get('*', (req, res) => {
    res.sendFile(
        path.join(__dirname, './', 'build/index.html')
    );
});

const httpServer = http.createServer(app);

const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', (conn) => {
    initSocket(conn);
});


// Start the HTTP server
httpServer.listen(config.server.port,'0.0.0.0', () => {
    console.log(`Server listening on port ${config.server.port}`);
    startGames();
});
