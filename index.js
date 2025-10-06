const https = require('https');
const fs = require('fs');
const selfsigned = require('selfsigned');
const { config } = require('process');

const port = 5995;

const attrs = [{name: 'commonName', value: 'traincraft.cz'}];
const pems = selfsigned.generate(attrs, {days:365});

const options = {
    key: pems.private,
    cert: pems.cert,
    minVersion: 'TLSv1.2',
}

const configFile = fs.readFileSync('config.json', 'utf8');
const configData = JSON.parse(configFile);

const server = https.createServer(options, (req, res) => {
    if(req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Access-Control-Allow-Origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS, GET, POST');
        res.writeHead(204);
        res.end();
        return;
    }

    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Access-Control-Allow-Origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS, GET, POST');

    if(req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            let data = JSON.parse(body);
            console.log(data);
            let stationID = data.stationID;
            let switchID = data.switchID;
            let state = data.state;
            sendCommand(stationID, switchID, state);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        });
    } else if(req.method === 'GET') {
        let data = "Certifikat potvrzen.";
        res.writeHead(200);
        res.end(data);
    } else {
        res.writeHead(405);
        res.end();
    }
});

function sendCommand(stationID, switchID, state) {
    let pos1 = configData[stationID][switchID].x;
    let pos2 = configData[stationID][switchID].y;
    let pos3 = configData[stationID][switchID].z;
    let arg = "";

    if(state === 0) {
        arg = "dirt";
    }
    if(state === 1) {
        arg = "redstone_torch";
    }
    console.log(pos1, pos2, pos3, arg);
    fetch(`http://localhost:8765/console?command=minecraft:setblock ${pos1} ${pos2} ${pos3} ${arg} 0 replace world`)
}

server.listen(port, "0.0.0.0", ()=> console.log('server running at ' + port));