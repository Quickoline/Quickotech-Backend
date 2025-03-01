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
        if (data && data.success && data.data) {
            const route = req.baseUrl + req.path;
            const sensitiveFields = route.includes('/users') 
                ? USER_SENSITIVE_FIELDS 
                : ORDER_SENSITIVE_FIELDS;

            if (Array.isArray(data.data)) {
                data.data = data.data.map(item => 
                    EncryptionService.encryptSensitiveData(item, sensitiveFields)
                );
            } else {
                data.data = EncryptionService.encryptSensitiveData(data.data, sensitiveFields);
            }
        }
        return originalJson.call(this, data);
    };
    next();
};

const decryptRequest = (req, res, next) => {
    if (req.body) {
        const route = req.baseUrl + req.path;
        const sensitiveFields = route.includes('/users') 
            ? USER_SENSITIVE_FIELDS 
            : ORDER_SENSITIVE_FIELDS;

        req.body = EncryptionService.decryptSensitiveData(req.body, sensitiveFields);
    }
    next();
};

module.exports = {
    encryptResponse,
    decryptRequest,
    USER_SENSITIVE_FIELDS,
    ORDER_SENSITIVE_FIELDS
}; 