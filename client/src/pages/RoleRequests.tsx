import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { roleRequestApi, type RoleRequest } from '../api/roleRequest.api';
import { Button } from '../components/ui/Button';
import { Shield, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AVAILABLE_ROLES = [
  { value: 'ENGINEERING', label: 'Engineering', description: 'Create and edit ECOs' },
  { value: 'APPROVER', label: 'Approver', description: 'Review and approve ECOs' },
  { value: 'OPERATIONS', label: 'Operations', description: 'View products and BOMs' },
];

export const RoleRequestPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMyRequests = async () => {
    try {
      const requests = await roleRequestApi.getMyRequests();
      setMyRequests(requests);
    } catch (error: unknown) {
      console.error('Failed to load role requests:', error);
      addNotification('error', 'Failed to load your role requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter available roles (exclude ADMIN and already assigned)
  const availableRolesToRequest = AVAILABLE_ROLES.filter(
    role => !user?.roles?.includes(role.value)
  );

  const hasPendingRequest = myRequests.some(req => req.status === 'PENDING');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'APPROVED':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'REJECTED':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Role Requests</h1>
          <p className="text-zinc-400 mt-1">
            Request additional roles to expand your access
          </p>
        </div>
        <Button
          onClick={() => navigate('/role-requests/create')}
          disabled={hasPendingRequest || availableRolesToRequest.length === 0}
        >
          <Shield className="w-4 h-4 mr-2" />
          Request New Role
        </Button>
      </div>

      {/* Current Roles */}
      <div className="bg-surface/50 border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Your Current Roles
        </h2>
        <div className="flex flex-wrap gap-2">
          {user?.roles?.map(role => (
            <span
              key={role}
              className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm font-medium"
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Pending Request Alert */}
      {hasPendingRequest && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 flex items-start gap-3"
        >
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Pending Request</p>
            <p className="text-zinc-400 text-sm mt-1">
              You have a pending role request. Please wait for admin review before submitting another request.
            </p>
          </div>
        </motion.div>
      )}

      {/* No Available Roles */}
      {availableRolesToRequest.length === 0 && !hasPendingRequest && (
        <div className="bg-surface/50 border border-white/5 rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">
            You have access to all available roles. No additional roles can be requested.
          </p>
        </div>
      )}

      {/* Request History */}
      <div className="bg-surface/50 border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Request History</h2>
        {myRequests.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">No role requests yet</p>
        ) : (
          <div className="space-y-3">
            {myRequests.map(request => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-background/50 border border-white/5 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(request.status)}
                      <div className="flex flex-wrap gap-2">
                        {request.requestedRoles.map(role => (
                          <span
                            key={role}
                            className="px-2 py-1 bg-zinc-800 border border-white/5 text-zinc-300 rounded text-sm"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    {request.reason && (
                      <p className="text-zinc-400 text-sm mb-2">
                        <span className="text-zinc-500">Reason:</span> {request.reason}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                      {request.reviewedAt && (
                        <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                      )}
                      {request.reviewer && (
                        <span>By: {request.reviewer.name}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 border rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                  >
                    {request.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
