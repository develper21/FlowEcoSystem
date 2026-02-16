import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { roleRequestApi, type RoleRequest } from '../api/roleRequest.api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Shield, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AVAILABLE_ROLES = [
  { value: 'ENGINEERING', label: 'Engineering', description: 'Create and edit ECOs' },
  { value: 'APPROVER', label: 'Approver', description: 'Review and approve ECOs' },
  { value: 'OPERATIONS', label: 'Operations', description: 'View products and BOMs' },
];

export const RoleRequestPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [myRequests, setMyRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      const requests = await roleRequestApi.getMyRequests();
      setMyRequests(requests);
    } catch (error: any) {
      console.error('Failed to load role requests:', error);
      addNotification('error', 'Failed to load your role requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (selectedRoles.length === 0) {
      addNotification('error', 'Please select at least one role');
      return;
    }

    setSubmitting(true);
    try {
      await roleRequestApi.create({
        requestedRoles: selectedRoles,
        reason: reason.trim() || undefined,
      });
      addNotification('success', 'Role request submitted successfully');
      setShowRequestModal(false);
      setSelectedRoles([]);
      setReason('');
      loadMyRequests();
    } catch (error: any) {
      addNotification('error', error.response?.data?.message || 'Failed to submit role request');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
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
          onClick={() => setShowRequestModal(true)}
          disabled={hasPendingRequest || availableRolesToRequest.length === 0}
        >
          <Plus className="w-4 h-4 mr-2" />
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

      {/* Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRoles([]);
          setReason('');
        }}
        title="Request Additional Roles"
      >
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Select the roles you would like to request. An administrator will review your request.
          </p>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">Select Roles</label>
            {availableRolesToRequest.map(role => (
              <label
                key={role.value}
                className="flex items-start gap-3 p-3 bg-surface/50 border border-white/5 rounded-lg cursor-pointer hover:bg-surface/70 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.value)}
                  onChange={() => toggleRole(role.value)}
                  className="mt-1 w-4 h-4 text-primary bg-zinc-800 border-zinc-700 rounded focus:ring-primary focus:ring-2"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{role.label}</div>
                  <div className="text-zinc-400 text-sm">{role.description}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Why do you need these roles?"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => {
                setShowRequestModal(false);
                setSelectedRoles([]);
                setReason('');
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={submitting || selectedRoles.length === 0}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
