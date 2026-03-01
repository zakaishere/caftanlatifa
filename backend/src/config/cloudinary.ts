import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// Configuration
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer to Cloudinary
 * @param buffer The file buffer from multer
 * @param folder The target folder in Cloudinary
 * @returns Promise that resolves to the Cloudinary Upload API response
 */
export const uploadToCloudinary = (
    buffer: Buffer,
    folder: string = 'ecommerce_products'
): Promise<{ secure_url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error || !result) {
                    console.error('Cloudinary upload error:', error);
                    return reject(error || new Error('Upload failed'));
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );
        uploadStream.end(buffer);
    });
};

export default cloudinary;
