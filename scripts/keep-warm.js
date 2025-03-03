const https = require('https');

const ENDPOINTS = [
    '/',
    '/api/warmup',
    '/api/v1/blog',
    '/api/v1/admin/products'
];

const BASE_URL = 'quickotech-backend.vercel.app';

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Warmup-Script'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`[${new Date().toISOString()}] Warmed up ${path} - Status: ${res.statusCode}`);
                resolve(data);
            });
        });

        req.on('error', (error) => {
            console.error(`Error warming up ${path}:`, error);
            reject(error);
        });

        req.end();
    });
}

async function warmupEndpoints() {
    console.log(`[${new Date().toISOString()}] Starting warmup...`);
    
    try {
        await Promise.all(ENDPOINTS.map(endpoint => makeRequest(endpoint)));
        console.log(`[${new Date().toISOString()}] Warmup completed successfully`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Warmup failed:`, error);
    }
}

// Run warmup
warmupEndpoints(); 