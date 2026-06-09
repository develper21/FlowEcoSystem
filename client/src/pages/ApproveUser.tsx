import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usersApi, type User } from '../api/users.api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const ApproveUserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();
  const [selectedRole, setSelectedRole] = useState('ENGINEERING');
  const [submitting, setSubmitting] = useState(false);
  
  // Get user from navigation state
  const user = location.state?.user as User | null;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await usersApi.update(user.id, {
        status: 'ACTIVE',
        role: selectedRole
      });
      addNotification('success', 'User approved and activated');
      navigate('/users');
    } catch {
      addNotification('error', 'Failed to approve user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/users');
  };

  if (!user) return <div className="text-zinc-500">User not found</div>;

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
          Back to Users
        </Button>
      </div>

      {/* Page title */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Approve User</h1>
            <p className="text-zinc-400">Select a role to activate the user account</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-6 rounded-xl border border-white/5 max-w-2xl mx-auto">
        <form onSubmit={handleApprove} className="space-y-6">
          <div className="bg-zinc-800/50 border border-white/5 rounded-lg p-4 mb-6">
            <p className="text-zinc-400">
              Select a role for <span className="text-white font-medium">{user.name}</span> to activate their account.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">Assign Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary"
              >
                <option value="ENGINEERING">Engineering</option>
                <option value="OPERATIONS">Operations</option>
                <option value="APPROVER">Approver</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {submitting ? 'Approving...' : 'Confirm & Activate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
