import React, { useState, useEffect } from 'react';
import { Paperclip, Upload, X, Download, FileText, Image as ImageIcon, File } from 'lucide-react';
import { attachmentsApi, type Attachment } from '../../api/attachments.api';
import { motion, AnimatePresence } from 'framer-motion';

interface AttachmentSectionProps {
    entityType: 'product' | 'eco';
    entityId: string;
    entityStatus: string;
    canUpload: boolean;
    canDelete: boolean;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
    entityType,
    entityId,
    entityStatus,
    canUpload,
    canDelete,
}) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAttachments();
    }, [entityId]);

    const loadAttachments = async () => {
        setLoading(true);
        try {
            const data = entityType === 'product'
                ? await attachmentsApi.getProductAttachments(entityId)
                : await attachmentsApi.getECOAttachments(entityId);
            setAttachments(data);
        } catch (err) {
            console.error('Failed to load attachments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setError('Only images (PNG, JPG, JPEG, WEBP, GIF) and PDF files are allowed');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        setError('');
        try {
            await (entityType === 'product'
                ? attachmentsApi.uploadProductAttachment(entityId, file)
                : attachmentsApi.uploadECOAttachment(entityId, file));
            await loadAttachments();
            e.target.value = ''; // Reset input
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload attachment');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId: string) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;

        try {
            await (entityType === 'product'
                ? attachmentsApi.deleteProductAttachment(attachmentId)
                : attachmentsApi.deleteECOAttachment(attachmentId));
            await loadAttachments();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete attachment');
        }
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
        if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
        return <File className="w-4 h-4" />;
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isDraft = entityStatus === 'DRAFT';
    const showUploadButton = canUpload && isDraft;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-xl border border-white/5"
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-primary" />
                    Attachments ({attachments.length})
                </h2>
                {showUploadButton && (
                    <label className="cursor-pointer inline-flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-lg bg-primary hover:bg-primary-hover text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-white/10 transition-all duration-200">
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Upload'}
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {!isDraft && attachments.length > 0 && (
                <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs">
                    ℹ️ Attachments are read-only in {entityStatus} status
                </div>
            )}

            {loading ? (
                <div className="text-zinc-500 text-center py-8">Loading attachments...</div>
            ) : attachments.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">
                    No attachments yet
                    {showUploadButton && ' - Upload files to get started'}
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {attachments.map((attachment) => (
                            <motion.div
                                key={attachment.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 flex-shrink-0">
                                        {getFileIcon(attachment.fileType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-zinc-200 font-medium truncate">
                                            {attachment.fileName}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {formatFileSize(attachment.fileSize)} • 
                                            Uploaded by {attachment.uploader?.name || 'Unknown'} • 
                                            {new Date(attachment.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-primary transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                    {canDelete && isDraft && (
                                        <button
                                            onClick={() => handleDelete(attachment.id)}
                                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};
