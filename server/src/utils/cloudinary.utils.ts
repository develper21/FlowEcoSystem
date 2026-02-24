import cloudinary from '../config/cloudinary';

interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Upload file to Cloudinary
 * @param fileBuffer - File buffer from multer
 * @param mimetype - File MIME type
 * @param folder - Cloudinary folder path
 * @returns Promise with URL and public_id
 */
export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    mimetype: string,
    folder: string
): Promise<UploadResult> => {
    try {
        // Convert buffer to base64 data URI
        const b64 = fileBuffer.toString('base64');
        const dataURI = `data:${mimetype};base64,${b64}`;

        // Determine resource type
        const resourceType = mimetype === 'application/pdf' ? 'raw' : 'auto';

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: `ecoflow/${folder}`,
            resource_type: resourceType,
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to cloud storage');
    }
};

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public_id
 * @returns Promise<void>
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        // Determine resource type from public_id
        const resourceType = publicId.includes('.pdf') ? 'raw' : 'image';
        
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        // Don't throw - deletion failure shouldn't block the operation
    }
};
