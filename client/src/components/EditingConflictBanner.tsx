import { useEffect, useState } from 'react';
import { AlertTriangle, Users, X } from 'lucide-react';
import type { EditorInfo } from '../api/editingSession.api';
import { editingSessionApi } from '../api/editingSession.api';
import { useAuth } from '../context/AuthContext';

interface EditingConflictBannerProps {
    entityType: 'ECO' | 'PRODUCT' | 'BOM';
    entityId: string;
    onEditingStart?: () => void;
    onEditingEnd?: () => void;
}

export default function EditingConflictBanner({
    entityType,
    entityId,
    onEditingStart,
    onEditingEnd,
}: EditingConflictBannerProps) {
    const { user } = useAuth();
    const [activeEditors, setActiveEditors] = useState<EditorInfo[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false); // Prevent double clicks

    // Fetch active editors on mount and set up polling
    useEffect(() => {
        fetchActiveEditors();
        const interval = setInterval(fetchActiveEditors, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [entityType, entityId]);

    // Listen for SSE editing events
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const eventSource = new EventSource(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/stream`,
            { withCredentials: true }
        );

        eventSource.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'EDITING_STARTED' || data.type === 'EDITING_ENDED') {
                    if (data.entityType === entityType && data.entityId === entityId) {
                        // Refresh active editors list
                        setTimeout(() => fetchActiveEditors(), 500); // Small delay to ensure backend state is updated
                    }
                }
            } catch (error) {
                console.error('Error parsing SSE event:', error);
            }
        });

        return () => {
            eventSource.close();
        };
    }, [entityType, entityId]);

    const fetchActiveEditors = async () => {
        try {
            const editors = await editingSessionApi.getActiveEditors(entityType, entityId);
            setActiveEditors(editors);
            
            // Only update isEditing state if we're not currently processing an action
            // This prevents the fetch from overriding our optimistic updates
            if (!isProcessing) {
                const userIsEditing = editors.some((editor: EditorInfo) => editor.userId === user?.id);
                setIsEditing(userIsEditing);
            }
        } catch (error) {
            console.error('Error fetching active editors:', error);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = async () => {
        if (isProcessing) return; // Prevent double clicks
        
        try {
            setIsProcessing(true);
            setIsEditing(true); // Optimistically set to true immediately
            
            const response = await editingSessionApi.startSession(entityType, entityId);
            console.log('Started editing session:', response);
            
            onEditingStart?.();
            
            // Refresh the editors list after a delay to show other editors
            setTimeout(() => {
                fetchActiveEditors();
            }, 1000);
        } catch (error: any) {
            console.error('Error starting editing session:', error);
            setIsEditing(false); // Revert on error
            const errorMsg = error?.response?.data?.message || 'Failed to start editing session. Please try again.';
            alert(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const endEditing = async () => {
        if (isProcessing) return; // Prevent double clicks
        
        try {
            setIsProcessing(true);
            setIsEditing(false); // Optimistically set to false immediately
            
            const response = await editingSessionApi.endSession(entityType, entityId);
            console.log('Ended editing session:', response);
            
            onEditingEnd?.();
            
            // Refresh the editors list after a delay
            setTimeout(() => {
                fetchActiveEditors();
            }, 1000);
        } catch (error: any) {
            console.error('Error ending editing session:', error);
            setIsEditing(true); // Revert on error
            const errorMsg = error?.response?.data?.message || 'Failed to end editing session. Please try again.';
            alert(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    // Filter out current user from other editors
    const otherEditors = activeEditors.filter((editor: EditorInfo) => editor.userId !== user?.id);

    if (loading) {
        return null; // Don't show anything while loading
    }

    return (
        <div className="space-y-3">
            {/* Other editors warning banner */}
            {otherEditors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-yellow-800 mb-1">
                                ⚠️ Editing Conflict Warning
                            </h4>
                            <p className="text-sm text-yellow-700 mb-2">
                                {otherEditors.length === 1
                                    ? `${otherEditors[0].userName} is currently editing this ${entityType.toLowerCase()}`
                                    : `${otherEditors.length} users are currently editing this ${entityType.toLowerCase()}`}
                            </p>
                            <div className="space-y-1">
                                {otherEditors.map((editor) => (
                                    <div key={editor.userId} className="flex items-center gap-2 text-sm text-yellow-700">
                                        <Users className="w-4 h-4" />
                                        <span className="font-medium">{editor.userName}</span>
                                        <span className="text-yellow-600">
                                            • Started {new Date(editor.startedAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-yellow-700 mt-2 font-medium">
                                💡 Coordinate with other users to avoid conflicting changes
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current user editing status */}
            {!isEditing ? (
                <button
                    onClick={startEditing}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Users className="w-5 h-5" />
                    {isProcessing ? 'Starting...' : 'Start Editing'}
                </button>
            ) : (
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-800">
                                You are currently editing this {entityType.toLowerCase()}
                            </span>
                        </div>
                        <button
                            onClick={endEditing}
                            disabled={isProcessing}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-4 h-4" />
                            {isProcessing ? 'Ending...' : 'End Editing'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
