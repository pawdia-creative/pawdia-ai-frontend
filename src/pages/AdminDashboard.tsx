import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Users, CreditCard, Edit, Eye, Save, ShieldCheck, KeyRound, Trash2, BarChart3, Activity, TrendingUp, Globe } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';

// Analytics data interfaces
interface ApiEndpointStat {
  endpoint: string;
  count: number;
  avg_response_time: number;
}

interface ApiStatusStat {
  status_code: string;
  count: number;
}

interface TopUserStat {
  id: string;
  name: string;
  email: string;
  credits: number;
  total_generations: number;
}

interface DailyStat {
  date: string;
  total_users: number;
  active_users: number;
  total_generations: number;
  total_credits_used: number;
}

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalGenerations: number;
  totalCreditsUsed: number;
  apiByEndpoint: ApiEndpointStat[];
  apiByStatus: ApiStatusStat[];
  topUsers: TopUserStat[];
  dailyStats: DailyStat[];
  monthlyStats: DailyStat[];
  yearlyStats: DailyStat[];
}

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

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [total, setTotal] = useState<number>(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [creditOperation, setCreditOperation] = useState<CreditOperation>({
    userId: '',
    amount: 0,
    type: 'add'
  });
  const [subscriptionForm, setSubscriptionForm] = useState({
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('users');

  // Get user list
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const response = await fetch(`${apiBaseUrl}/admin/users?search=${encodeURIComponent(searchTerm)}&page=${page}&perPage=${perPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out users with null or undefined IDs
        const validUsers = (data.users || []).filter((u: User) => u.id != null && u.id !== 'null' && u.id !== '');
        setUsers(validUsers);
        setTotal(Number(data.total || 0));
      } else {
        toast.error('Failed to fetch user list');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching users:', error);
      toast.error('Error fetching user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  useEffect(() => {
    // refetch when page or perPage changes
    fetchUsers();
  }, [page, perPage]);

  // Real-time polling to keep subscription/credits fresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUsers();
      if (activeTab === 'analytics') {
        fetchAnalytics();
      }
    }, 15000); // 15s interval
    return () => clearInterval(intervalId);
  }, [searchTerm, activeTab]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const response = await fetch(`${apiBaseUrl}/admin/analytics/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching analytics:', error);
      toast.error('Error fetching analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch analytics when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
      const token = localStorage.getItem('token');
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
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Credit operation failed');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error performing credit operation:', error);
      toast.error('Error performing credit operation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      const token = localStorage.getItem('token');
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
        fetchUsers();
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
      const token = localStorage.getItem('token');
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
    if (!userToDelete) return;
    
    // Double check ID validity
    if (!userToDelete.id || userToDelete.id === 'null' || userToDelete.id === '') {
      toast.error('Invalid user ID, cannot delete');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
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
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Console</h1>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          Refresh now
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
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
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <label className="text-sm">Per page:</label>
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() => setPage((p) => p + 1)}
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
          <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
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
        </TabsContent>

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
                    onClick={(e) => {
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
                    onClick={(e) => {
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
                  onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
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

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? 'Loading...' : (analytics?.totalPageViews || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Page views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? 'Loading...' : (analytics?.totalApiCalls || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total API requests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? 'Loading...' : (analytics?.uniqueUsers || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Unique users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analyticsLoading ? 'Loading...' : (analytics?.uniqueSessions || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Unique sessions</p>
                </CardContent>
              </Card>
            </div>

            {/* API Calls by Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle>API Calls by Endpoint</CardTitle>
                <CardDescription>Call counts and average response times per API endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : analytics?.apiByEndpoint?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Calls</TableHead>
                        <TableHead>Avg response time (ms)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.apiByEndpoint.map((item: ApiEndpointStat, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{item.endpoint}</TableCell>
                          <TableCell>{item.count}</TableCell>
                          <TableCell>{item.avg_response_time ? Math.round(item.avg_response_time) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>

            {/* API Calls by Status Code */}
            <Card>
              <CardHeader>
                <CardTitle>API Response Status</CardTitle>
                <CardDescription>Distribution of HTTP status codes</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : analytics?.apiByStatus?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analytics.apiByStatus.map((item: ApiStatusStat, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-semibold">{item.status_code}</span>
                        <span className="text-muted-foreground">{item.count} times</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>

            {/* Top Active Users */}
            <Card>
              <CardHeader>
                <CardTitle>Top Active Users</CardTitle>
                <CardDescription>Top 20 users by activity</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : analytics?.topUsers?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Total Activity</TableHead>
                        <TableHead>Page Views</TableHead>
                        <TableHead>AI Calls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.topUsers.map((user: TopUserStat, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{user.user_id}</TableCell>
                          <TableCell>{user.total_events}</TableCell>
                          <TableCell>{user.page_views}</TableCell>
                          <TableCell>{user.api_calls}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No data</div>
                )}
              </CardContent>
            </Card>

            {/* Daily / Monthly / Yearly Statistics - Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card>
              <CardHeader>
                  <CardTitle>Daily Stats (last 30 days)</CardTitle>
                  <CardDescription>Daily page views and AI generation calls</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : analytics?.dailyStats?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Page Views</TableHead>
                          <TableHead>AI Calls</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.dailyStats.map((item: DailyStat, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.period}</TableCell>
                            <TableCell>{item.page_views}</TableCell>
                            <TableCell>{item.api_calls}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No data</div>
                  )}
                </CardContent>
              </Card>

              <Card>
              <CardHeader>
                <CardTitle>Monthly Stats (last 12 months)</CardTitle>
                <CardDescription>Monthly page views and AI generation calls</CardDescription>
              </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : analytics?.monthlyStats?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Page Views</TableHead>
                          <TableHead>AI Calls</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.monthlyStats.map((item: DailyStat, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.period}</TableCell>
                            <TableCell>{item.page_views}</TableCell>
                            <TableCell>{item.api_calls}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No data</div>
                  )}
                </CardContent>
              </Card>

              <Card>
              <CardHeader>
                <CardTitle>Yearly Stats (last 5 years)</CardTitle>
                <CardDescription>Yearly page views and AI generation calls</CardDescription>
              </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : analytics?.yearlyStats?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead>Page Views</TableHead>
                          <TableHead>AI Calls</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.yearlyStats.map((item: DailyStat, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.period}</TableCell>
                            <TableCell>{item.page_views}</TableCell>
                            <TableCell>{item.api_calls}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily / Monthly / Yearly Statistics - Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Trends: Page Views & AI Calls</CardTitle>
                <CardDescription>View trends over daily / monthly / yearly timeframes</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="space-y-4">
                    {/* 日趋势图 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Daily (last 30 days)</h4>
                      {analytics?.dailyStats?.length > 0 ? (
                        <ChartContainer
                          config={{
                            page_views: { label: 'Page Views', color: 'hsl(25 95% 53%)' },
                            api_calls: { label: 'AI Calls', color: 'hsl(270 60% 35%)' },
                          }}
                          className="h-64"
                        >
                          <LineChart data={analytics.dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Line type="monotone" dataKey="page_views" stroke="hsl(var(--primary))" dot={false} />
                            <Line type="monotone" dataKey="api_calls" stroke="hsl(var(--secondary))" dot={false} />
                          </LineChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">No data</div>
                      )}
                    </div>

                    {/* 月趋势图 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Monthly (last 12 months)</h4>
                      {analytics?.monthlyStats?.length > 0 ? (
                        <ChartContainer
                          config={{
                            page_views: { label: 'Page Views', color: 'hsl(25 95% 53%)' },
                            api_calls: { label: 'AI Calls', color: 'hsl(270 60% 35%)' },
                          }}
                          className="h-64"
                        >
                          <LineChart data={analytics.monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Line type="monotone" dataKey="page_views" stroke="hsl(var(--primary))" dot={false} />
                            <Line type="monotone" dataKey="api_calls" stroke="hsl(var(--secondary))" dot={false} />
                          </LineChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">No data</div>
                      )}
                    </div>

                    {/* 年趋势图 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Yearly (last 5 years)</h4>
                      {analytics?.yearlyStats?.length > 0 ? (
                        <ChartContainer
                          config={{
                            page_views: { label: 'Page Views', color: 'hsl(25 95% 53%)' },
                            api_calls: { label: 'AI Calls', color: 'hsl(270 60% 35%)' },
                          }}
                          className="h-64"
                        >
                          <LineChart data={analytics.yearlyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Line type="monotone" dataKey="page_views" stroke="hsl(var(--primary))" dot={false} />
                            <Line type="monotone" dataKey="api_calls" stroke="hsl(var(--secondary))" dot={false} />
                          </LineChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">No data</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={fetchAnalytics} disabled={analyticsLoading}>
                {analyticsLoading ? 'Loading...' : 'Refresh Data'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;