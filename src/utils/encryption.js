const crypto = require('crypto');

class EncryptionService {
    static #encryptionKey = null;
    static #AUTH_TAG_LENGTH = 16;
    static #IV_LENGTH = 12; // GCM recommended IV length

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
            // Generate a random IV
            const iv = crypto.randomBytes(this.#IV_LENGTH);
            
            // Create cipher with GCM mode
            const cipher = crypto.createCipheriv('aes-256-gcm', this.#encryptionKey, iv);
            
            // Encrypt the data
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
            encrypted += cipher.final('base64');
            
            // Get the auth tag
            const authTag = cipher.getAuthTag();
            
            // Combine IV, encrypted data, and auth tag
            const result = {
                iv: iv.toString('base64'),
                data: encrypted,
                tag: authTag.toString('base64')
            };

            // Return in the format expected by frontend
            return {
                data: Buffer.from(JSON.stringify(result)).toString('base64')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    static decrypt(encryptedData) {
        if (!this.#encryptionKey) {
            this.initialize();
        }

        if (!encryptedData || !encryptedData.data) return null;
        
        try {
            // Parse the encrypted data
            const parsed = JSON.parse(Buffer.from(encryptedData.data, 'base64').toString());
            
            // Extract components
            const iv = Buffer.from(parsed.iv, 'base64');
            const tag = Buffer.from(parsed.tag, 'base64');
            const encrypted = parsed.data;
            
            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-gcm', this.#encryptionKey, iv);
            decipher.setAuthTag(tag);
            
            // Decrypt
            let decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
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