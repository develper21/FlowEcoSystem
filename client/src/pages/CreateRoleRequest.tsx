import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { roleRequestApi } from '../api/roleRequest.api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Shield } from 'lucide-react';

const AVAILABLE_ROLES = [
  { value: 'ENGINEERING', label: 'Engineering', description: 'Create and edit ECOs' },
  { value: 'APPROVER', label: 'Approver', description: 'Review and approve ECOs' },
  { value: 'OPERATIONS', label: 'Operations', description: 'View products and BOMs' },
];

export const CreateRoleRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      navigate('/role-requests');
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addNotification('error', (error as any).response?.data?.message || 'Failed to submit role request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/role-requests');
  };

  // Filter available roles (exclude ADMIN and already assigned)
  const availableRolesToRequest = AVAILABLE_ROLES.filter(
    role => !user?.roles?.includes(role.value)
  );

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Role Requests
        </Button>
      </div>

      {/* Page title */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Request Additional Roles</h1>
            <p className="text-zinc-400">Request additional roles to expand your access</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-6 rounded-xl border border-white/5 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onClick={handleBack}
              variant="ghost"
              type="button"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || selectedRoles.length === 0}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
