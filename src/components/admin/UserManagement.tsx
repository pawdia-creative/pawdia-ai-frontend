import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth, tokenStorage } from '@/contexts/AuthContext';
import { Search, CreditCard, Eye, Save, ShieldCheck, KeyRound, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
  subscription?: {
    plan?: string | null;
    status?: string | null;
    expiresAt?: string | null;
  };
  lastLogin?: string;
  createdAt: string;
}

interface CreditOperation {
  userId: string;
  amount: number;
  type: 'add' | 'subtract' | 'set';
}

interface SubscriptionForm {
  plan: string;
  status: string;
  expiresAt: string;
  setCredits: string;
  addPlanCredits: boolean;
}

interface UserManagementProps {
  users: User[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onRefreshUsers: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  loading,
  searchTerm,
  onSearchChange,
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  onRefreshUsers,
}) => {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [creditOperation, setCreditOperation] = useState<CreditOperation>({
    userId: '',
    amount: 0,
    type: 'add'
  });

  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionForm>({
    plan: '',
    status: '',
    expiresAt: '',
    setCredits: '',
    addPlanCredits: false,
  });

  const [originalExpiresAt, setOriginalExpiresAt] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleCreditDialogOpen = (user: User) => {
    setSelectedUser(user);
    setCreditOperation({
      userId: user.id,
      amount: 0,
      type: 'add'
    });
    setCreditDialogOpen(true);
  };

  const handleCreditOperationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreditOperation(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseInt(value) || 0 : value
    }));
  };

  const handleCreditOperationSubmit = async () => {
    try {
      const token = tokenStorage.getToken();
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      let endpoint = '';

      switch (creditOperation.type) {
        case 'add':
          endpoint = `/admin/users/${creditOperation.userId}/credits/add`;
          break;
        case 'subtract':
          endpoint = `/admin/users/${creditOperation.userId}/credits/remove`;
          break;
        case 'set':
          endpoint = `/admin/users/${creditOperation.userId}/credits/set`;
          break;
        default:
          throw new Error('Invalid credit operation type');
      }

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: creditOperation.amount,
          // remove reason requirement
        }),
      });

      if (response.ok) {
        toast.success('Credit operation successful');
        setCreditDialogOpen(false);
        onRefreshUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Credit operation failed');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error performing credit operation:', error);
      toast.error('Error performing credit operation');
    }
  };

  const handleSubscriptionDialogOpen = (user: User) => {
    setSelectedUser(user);
    const initialExpiresAt = user.subscription?.expiresAt || '';
    setSubscriptionForm({
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'inactive',
      expiresAt: initialExpiresAt,
      setCredits: '',
      addPlanCredits: false,
    });
    setOriginalExpiresAt(initialExpiresAt);
    setSubscriptionDialogOpen(true);
  };

  const handleSubscriptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    setSubscriptionForm((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleSubscriptionSubmit = async () => {
    if (!selectedUser) return;
    try {
      const token = tokenStorage.getToken();
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const payload: Record<string, unknown> = {};
      if (subscriptionForm.plan) payload.plan = subscriptionForm.plan;
      if (subscriptionForm.status) payload.status = subscriptionForm.status;

      // Always send expiresAt if it has been changed or explicitly set
      // Check if expiresAt has been modified from original value
      const expiresAtChanged = subscriptionForm.expiresAt !== originalExpiresAt;
      if (expiresAtChanged || subscriptionForm.expiresAt === 'PERMANENT' || subscriptionForm.expiresAt === '') {
        // Send 'PERMANENT', empty string, or the datetime value
        payload.expiresAt = subscriptionForm.expiresAt;
      }

      if (subscriptionForm.setCredits !== '') payload.setCredits = Number(subscriptionForm.setCredits);
      payload.addPlanCredits = subscriptionForm.addPlanCredits;

      if (import.meta.env.DEV) console.log('[ADMIN] Submitting subscription update:', payload);

      const response = await fetch(`${apiBaseUrl}/admin/users/${selectedUser.id}/subscription`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Subscription updated successfully');
        setSubscriptionDialogOpen(false);
        onRefreshUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Subscription update failed');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating subscription:', error);
      toast.error('Error updating subscription');
    }
  };

  const handlePasswordDialogOpen = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: '' });
    setPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = async () => {
    if (!selectedUser) return;
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const token = tokenStorage.getToken();
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const response = await fetch(`${apiBaseUrl}/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });
      if (response.ok) {
        toast.success('Password reset successful');
        setPasswordDialogOpen(false);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Password reset failed');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error resetting password:', error);
      toast.error('Error resetting password');
    }
  };

  const handleDeleteUser = (userToDelete: User) => {
    // Check if user has valid ID
    if (!userToDelete.id || userToDelete.id === 'null' || userToDelete.id === '') {
      toast.error('Invalid user ID, cannot delete');
      return;
    }
    // Prevent deleting yourself
    if (userToDelete.id === currentUser?.id) {
      toast.error('Cannot delete your own account');
      return;
    }
    // Prevent deleting other admins
    if (userToDelete.isAdmin) {
      toast.error('Cannot delete an admin account');
      return;
    }
    setUserToDelete(userToDelete);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    // Debug: ensure handler invoked
    if (import.meta.env.DEV) console.log('[ADMIN-DEBUG] handleDeleteConfirm invoked, userToDelete:', userToDelete);
    if (!userToDelete) return;

    // Double check ID validity
    if (!userToDelete.id || userToDelete.id === 'null' || userToDelete.id === '') {
      toast.error('Invalid user ID, cannot delete');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      return;
    }

    try {
      // Debug: check token presence before calling API
      const token = tokenStorage.getToken();
      if (import.meta.env.DEV) console.log('[ADMIN-DEBUG] delete token present?', !!token);
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      if (import.meta.env.DEV) console.log('[ADMIN-DEBUG] delete request url:', `${apiBaseUrl}/admin/users/${userToDelete.id}`);
      const response = await fetch(`${apiBaseUrl}/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast.success('User deleted successfully');
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        onRefreshUsers();
      } else {
        let data = null;
        try {
          data = await response.json();
        } catch (e) {
          if (import.meta.env.DEV) console.warn('[ADMIN-DEBUG] failed to parse delete response JSON', e);
        }
        if (import.meta.env.DEV) console.warn('[ADMIN-DEBUG] delete response not ok', { status: response.status, body: data });
        toast.error((data && data.message) ? data.message : 'Failed to delete user');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[ADMIN-DEBUG] Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3 ml-4">
              <label className="text-sm">Per page:</label>
              <select
                value={perPage}
                onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
                className="rounded-md border px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="text-sm text-muted-foreground ml-2">
                Page {page} / {Math.max(1, Math.ceil(total / perPage))}
              </div>
              <button
                className="px-2 py-1 rounded border"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <button
                className="px-2 py-1 rounded border"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= Math.max(1, Math.ceil(total / perPage))}
              >
                Next
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.credits} Credits</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? "default" : "secondary"}>
                        {user.isAdmin ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.subscription?.plan ? "default" : "secondary"}>
                        {user.subscription?.plan || 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.subscription?.status === 'active' ? "default" :
                        user.subscription?.status === 'expired' ? "destructive" :
                        "secondary"
                      }>
                        {user.subscription?.status === 'active' ? 'Active' :
                         user.subscription?.status === 'expired' ? 'Expired' :
                         user.subscription?.status === 'inactive' ? 'Inactive' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleUserClick(user)} title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCreditDialogOpen(user)} title="Manage credits">
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSubscriptionDialogOpen(user)} title="Manage subscription">
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handlePasswordDialogOpen(user)} title="Reset password">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {!user.isAdmin && user.id !== currentUser?.id && user.id && user.id !== 'null' && user.id !== '' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            title="Delete user"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open: boolean) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View user's detailed information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <div className="mt-1 p-2 bg-muted rounded">{selectedUser.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="mt-1 p-2 bg-muted rounded">{selectedUser.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Credits</Label>
                  <div className="mt-1 p-2 bg-muted rounded">{selectedUser.credits}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <div className="mt-1 p-2 bg-muted rounded">{selectedUser.isAdmin ? "Admin" : "User"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <div className="mt-1 p-2 bg-muted rounded">{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : "Never"}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <div className="mt-1 p-2 bg-muted rounded">{formatDate(selectedUser.createdAt)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Subscription Plan</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    <Badge variant={selectedUser.subscription?.plan ? "default" : "secondary"}>
                      {selectedUser.subscription?.plan || 'Free'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subscription Status</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    <Badge variant={
                      selectedUser.subscription?.status === 'active' ? "default" :
                      selectedUser.subscription?.status === 'expired' ? "destructive" :
                      "secondary"
                    }>
                      {selectedUser.subscription?.status === 'active' ? 'Active' :
                       selectedUser.subscription?.status === 'expired' ? 'Expired' :
                       selectedUser.subscription?.status === 'inactive' ? 'Inactive' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Subscription Expires At</Label>
                <div className="mt-1 p-2 bg-muted rounded">
                  {selectedUser.subscription?.expiresAt ? formatDate(selectedUser.subscription.expiresAt) : 'Permanent'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Operation Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {creditOperation.type === 'add' ? 'Add Credits' :
               creditOperation.type === 'subtract' ? 'Subtract Credits' : 'Set Credits'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <p>Perform credit operation for user {selectedUser.name}</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="1"
                  value={creditOperation.amount}
                  onChange={handleCreditOperationChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type">Operation Type</Label>
                <select
                  id="type"
                  name="type"
                  value={creditOperation.type}
                  onChange={handleCreditOperationChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="add">Add</option>
                  <option value="subtract">Subtract</option>
                  <option value="set">Set</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreditOperationSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Subscription</DialogTitle>
            <DialogDescription>
              {selectedUser && <p>Update subscription for user {selectedUser.name}</p>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan">套餐</Label>
                <select
                  id="plan"
                  name="plan"
                  value={subscriptionForm.plan}
                  onChange={handleSubscriptionChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">(no change)</option>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={subscriptionForm.status}
                  onChange={handleSubscriptionChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">(no change)</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At</Label>
              <div className="flex gap-3 items-center mt-1">
                <Input
                  id="expiresAt"
                  name="expiresAt"
                  type="datetime-local"
                  value={subscriptionForm.expiresAt === 'PERMANENT' ? '' : subscriptionForm.expiresAt}
                  onChange={handleSubscriptionChange}
                  className="flex-1"
                  disabled={subscriptionForm.status === 'active' && subscriptionForm.plan === 'free' || subscriptionForm.expiresAt === 'PERMANENT'}
                  placeholder={subscriptionForm.expiresAt === 'PERMANENT' ? 'Permanent (no expiration)' : ''}
                />
                <Button
                  type="button"
                  variant={subscriptionForm.expiresAt === 'PERMANENT' ? 'default' : 'outline'}
                  size="sm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (import.meta.env.DEV) console.log('[ADMIN] Permanent button clicked');
                    setSubscriptionForm((prev) => {
                      const newState = { ...prev, expiresAt: 'PERMANENT' };
                      if (import.meta.env.DEV) console.log('[ADMIN] Setting expiresAt to PERMANENT:', newState);
                      return newState;
                    });
                  }}
                >
                  Permanent
                </Button>
                <Button
                  type="button"
                  variant={subscriptionForm.expiresAt === '' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (import.meta.env.DEV) console.log('[ADMIN] Clear button clicked');
                    setSubscriptionForm((prev) => {
                      const newState = { ...prev, expiresAt: '' };
                      if (import.meta.env.DEV) console.log('[ADMIN] Clearing expiresAt:', newState);
                      return newState;
                    });
                  }}
                >
                  Clear
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {subscriptionForm.expiresAt === 'PERMANENT'
                  ? '✓ Set to permanent (no expiration)'
                  : subscriptionForm.expiresAt === ''
                  ? '✓ Cleared (no expiration)'
                  : 'Optional: set a specific time; click "Permanent" for no expiration; "Clear" will remove expiration.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="setCredits">Set Credits (optional)</Label>
                <Input
                  id="setCredits"
                  name="setCredits"
                  type="number"
                  min="0"
                  value={subscriptionForm.setCredits}
                  onChange={handleSubscriptionChange}
                  className="mt-1"
                  placeholder="Leave blank to keep current value"
                />
              </div>
              <div className="flex items-end gap-2">
                <input
                  id="addPlanCredits"
                  name="addPlanCredits"
                  type="checkbox"
                  checked={subscriptionForm.addPlanCredits}
                  onChange={handleSubscriptionChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="addPlanCredits" className="text-sm">Add plan default credits</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubscriptionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubscriptionSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {selectedUser && <p>Reset password for user {selectedUser.name}</p>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordForm({ newPassword: e.target.value })}
                className="mt-1"
                placeholder="At least 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePasswordSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete User</DialogTitle>
            <DialogDescription>
              {userToDelete && (
                <p>Are you sure you want to delete user <strong>{userToDelete.name}</strong> ({userToDelete.email})? This action cannot be undone.</p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Deleting a user will permanently remove all their data, including credits and subscription records. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setDeleteDialogOpen(false);
              setUserToDelete(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;
