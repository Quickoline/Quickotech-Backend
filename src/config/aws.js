const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

exports.uploadToS3 = async (fileData) => {
    try {
        if (!fileData || !fileData.buffer) {
            console.error('Invalid file data:', fileData);
            throw new Error('File buffer is required');
        }

        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `uploads/${Date.now()}-${fileData.originalname}`,
            Body: fileData.buffer,
            ContentType: fileData.mimetype
        };

        console.log('Uploading to S3:', { 
            bucket: params.Bucket, 
            key: params.Key, 
            contentType: params.ContentType,
            fileSize: fileData.buffer.length
        });

        const result = await s3.upload(params).promise();
        console.log('S3 upload successful:', result.Location);
        
        return {
            url: result.Location,
            key: result.Key
        };
    } catch (error) {
        console.error('S3 upload error:', error);
        throw error;
    }
};

exports.checkS3Config = async () => {
    try {
        await s3.listBuckets().promise();
        await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
        console.log('S3 configuration verified successfully');
        return true;
    } catch (error) {
        console.error('S3 configuration error:', error);
        throw new Error(`S3 configuration error: ${error.message}`);
    }
};