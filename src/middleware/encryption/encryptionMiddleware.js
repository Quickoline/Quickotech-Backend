const EncryptionService = require('../../utils/encryption');

const USER_SENSITIVE_FIELDS = [
    'phone',
    'email',
    'address',
    'documents',
    'additionalFields'
];

const ORDER_SENSITIVE_FIELDS = [
    'documents',
    'additionalFields',
    'ocrData'
];

const encryptResponse = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && data.success) {
            // Encrypt the entire data object
            const encryptedResponse = EncryptionService.encrypt(data);
            return originalJson.call(this, encryptedResponse);
        }
        return originalJson.call(this, data);
    };
    next();
};

const decryptRequest = (req, res, next) => {
    try {
        if (req.body && req.body.data) {
            // Decrypt the request body
            const decryptedData = EncryptionService.decrypt(req.body);
            if (decryptedData) {
                req.body = decryptedData;
            } else {
                throw new Error('Failed to decrypt request data');
            }
        }
        next();
    } catch (error) {
        console.error('Decryption middleware error:', error);
        res.status(400).json({
            success: false,
            error: 'Invalid encrypted data format'
        });
    }
};

// Validate encrypted request format
const validateEncryptedRequest = (req, res, next) => {
    if (req.headers['content-type'] === 'application/json' && req.body) {
        if (!req.body.data || typeof req.body.data !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request format. Expected encrypted data.'
            });
        }
    }
    next();
};

module.exports = {
    encryptResponse,
    decryptRequest,
    validateEncryptedRequest,
    USER_SENSITIVE_FIELDS,
    ORDER_SENSITIVE_FIELDS
}; 