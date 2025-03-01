const crypto = require('crypto');

function generateEncryptionKey() {
    // Generate a random 32-byte (256-bit) key
    const key = crypto.randomBytes(32);
    
    // Convert to base64 for storage
    const base64Key = key.toString('base64');
    
    console.log('Generated Encryption Key (save this securely):', base64Key);
    console.log('Key Length:', key.length, 'bytes');
    
    return base64Key;
}

// Generate and display a new key if this file is run directly
if (require.main === module) {
    generateEncryptionKey();
}

module.exports = generateEncryptionKey; 