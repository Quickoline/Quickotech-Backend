const crypto = require('crypto');

class EncryptionService {
    static #encryptionKey = null;
    static #iv_length = 16; // For AES, this is always 16

    static initialize() {
        if (!process.env.ENCRYPTION_KEY) {
            throw new Error('ENCRYPTION_KEY environment variable is not set');
        }

        try {
            // Convert base64 key back to buffer
            const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
            
            // Validate key length
            if (keyBuffer.length !== 32) {
                throw new Error('Invalid encryption key length. Must be 32 bytes.');
            }

            this.#encryptionKey = keyBuffer;
            console.log('Encryption service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize encryption service:', error);
            throw error;
        }
    }

    static encrypt(data) {
        if (!this.#encryptionKey) {
            this.initialize();
        }

        if (!data) return null;
        
        try {
            const iv = crypto.randomBytes(this.#iv_length);
            const cipher = crypto.createCipheriv('aes-256-cbc', this.#encryptionKey, iv);
            
            let encrypted = cipher.update(JSON.stringify(data));
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    static decrypt(text) {
        if (!this.#encryptionKey) {
            this.initialize();
        }

        if (!text) return null;
        
        try {
            const [ivHex, encryptedHex] = text.split(':');
            if (!ivHex || !encryptedHex) return null;

            const iv = Buffer.from(ivHex, 'hex');
            const encryptedText = Buffer.from(encryptedHex, 'hex');
            
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.#encryptionKey, iv);
            
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return JSON.parse(decrypted.toString());
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    static encryptSensitiveData(data, sensitiveFields) {
        if (!data || !sensitiveFields || !Array.isArray(sensitiveFields)) return data;

        const encryptedData = { ...data };
        for (const field of sensitiveFields) {
            if (encryptedData[field]) {
                encryptedData[field] = this.encrypt(encryptedData[field]);
            }
        }
        return encryptedData;
    }

    static decryptSensitiveData(data, sensitiveFields) {
        if (!data || !sensitiveFields || !Array.isArray(sensitiveFields)) return data;

        const decryptedData = { ...data };
        for (const field of sensitiveFields) {
            if (decryptedData[field]) {
                decryptedData[field] = this.decrypt(decryptedData[field]);
            }
        }
        return decryptedData;
    }
}

module.exports = EncryptionService; 