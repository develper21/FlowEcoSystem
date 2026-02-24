import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { roleRequestApi, type RoleRequest } from '../api/roleRequest.api';
import { Button } from '../components/ui/Button';
import { Shield, Clock, CheckCircle, XCircle, User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminRoleRequestsPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = user?.roles?.includes('ADMIN');

  useEffect(() => {
    if (isAdmin) {
      loadRequests();
    }
  }, [filter, isAdmin]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const data = await roleRequestApi.getAllRequests(status);
      setRequests(data);
    } catch (error: any) {
      console.error('Failed to load role requests:', error);
      addNotification('error', 'Failed to load role requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await roleRequestApi.approve(requestId);
      addNotification('success', 'Role request approved successfully');
      loadRequests();
    } catch (error: any) {
      addNotification('error', error.response?.data?.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await roleRequestApi.reject(requestId);
      addNotification('success', 'Role request rejected');
      loadRequests();
    } catch (error: any) {
      addNotification('error', error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">You do not have permission to access this page</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Role Request Management</h1>
          <p className="text-zinc-400 mt-1">
            Review and approve user role requests
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <span className="text-yellow-400 font-medium">{pendingCount} Pending</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filter === status
                ? 'text-primary border-primary'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            {status}
            {status !== 'ALL' && (
              <span className="ml-2 text-xs">
                ({requests.filter(r => r.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-surface/50 border border-white/5 rounded-xl p-12 text-center">
          <Shield className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No {filter.toLowerCase()} role requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface/50 border border-white/5 rounded-xl p-6 hover:bg-surface/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-6">
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-zinc-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{request.user?.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                        <Mail className="w-4 h-4" />
                        {request.user?.email}
                      </div>
                    </div>
                  </div>

                  {/* Current Roles */}
                  <div className="mb-3">
                    <p className="text-xs text-zinc-500 mb-2">Current Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {request.user?.roles?.map(role => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-zinc-800 border border-white/5 text-zinc-300 rounded text-xs"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Requested Roles */}
                  <div className="mb-3">
                    <p className="text-xs text-zinc-500 mb-2">Requested Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {request.requestedRoles.map(role => (
                        <span
                          key={role}
                          className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded text-xs font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  {request.reason && (
                    <div className="mb-3">
                      <p className="text-xs text-zinc-500 mb-1">Reason:</p>
                      <p className="text-sm text-zinc-300 bg-background/50 border border-white/5 rounded-lg p-3">
                        {request.reason}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                    {request.reviewedAt && (
                      <>
                        <span>•</span>
                        <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                      </>
                    )}
                    {request.reviewer && (
                      <>
                        <span>•</span>
                        <span>By: {request.reviewer.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col items-end gap-3">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span
                      className={`px-3 py-1 border rounded-full text-xs font-medium ${
                        request.status === 'PENDING'
                          ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                          : request.status === 'APPROVED'
                          ? 'text-green-400 bg-green-400/10 border-green-400/20'
                          : 'text-red-400 bg-red-400/10 border-red-400/20'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        variant="secondary"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        {processingId === request.id ? 'Processing...' : 'Approve'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
