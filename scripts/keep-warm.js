const https = require('https');

const ENDPOINTS = [
    '/',
    '/api/warmup',
    '/api/health',
    '/api/v1/blog',
    '/api/v1/admin/products',
    '/api/v1/users/stats',
    '/api/v1/auth',
    '/api/v1/cyber-cafe/orders'
];

const BASE_URL = process.env.BASE_URL || 'quickotech-backend.onrender.com';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(path, retryCount = 0) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Warmup-Script/1.0',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000 // 10 seconds timeout
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`[${new Date().toISOString()}] Warmed up ${path} - Status: ${res.statusCode}`);
                resolve({ status: res.statusCode, data });
            });
        });

        req.on('error', async (error) => {
            console.error(`Error warming up ${path}:`, error.message);
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying ${path} (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                await sleep(RETRY_DELAY);
                try {
                    const result = await makeRequest(path, retryCount + 1);
                    resolve(result);
                } catch (retryError) {
                    reject(retryError);
                }
            } else {
                reject(error);
            }
        });

        req.on('timeout', () => {
            req.destroy();
            const timeoutError = new Error(`Request timeout for ${path}`);
            console.error(timeoutError.message);
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying ${path} after timeout (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                makeRequest(path, retryCount + 1).then(resolve).catch(reject);
            } else {
                reject(timeoutError);
            }
        });

        req.end();
    });
}

async function warmupEndpoints() {
    console.log(`[${new Date().toISOString()}] Starting warmup...`);
    const results = {
        success: 0,
        failed: 0,
        endpoints: []
    };
    
    try {
        const promises = ENDPOINTS.map(async endpoint => {
            try {
                const result = await makeRequest(endpoint);
                results.success++;
                results.endpoints.push({
                    path: endpoint,
                    status: result.status,
                    success: true
                });
            } catch (error) {
                results.failed++;
                results.endpoints.push({
                    path: endpoint,
                    error: error.message,
                    success: false
                });
            }
        });

        await Promise.all(promises);
        
        console.log(`[${new Date().toISOString()}] Warmup completed:`, {
            total: ENDPOINTS.length,
            successful: results.success,
            failed: results.failed
        });

        if (results.failed > 0) {
            console.log('Failed endpoints:', results.endpoints.filter(e => !e.success));
        }
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Warmup failed:`, error);
    }
}

// Run warmup if script is run directly
if (require.main === module) {
    warmupEndpoints();
}

module.exports = warmupEndpoints; 