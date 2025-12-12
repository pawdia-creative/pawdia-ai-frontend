import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Users, CreditCard, Plus, Minus, Edit, Eye, Save } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  isAdmin: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface CreditOperation {
  userId: string;
  amount: number;
  type: 'add' | 'subtract' | 'set';
  reason: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditOperation, setCreditOperation] = useState<CreditOperation>({
    userId: '',
    amount: 0,
    type: 'add',
    reason: ''
  });

  const [activeTab, setActiveTab] = useState('users');

  // Get user list
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBaseUrl}/admin/users?search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch user list');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error occurred while fetching user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

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
      type: 'add',
      reason: ''
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
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      let endpoint = '';
      
      switch (creditOperation.type) {
        case 'add':
          endpoint = `/admin/users/${creditOperation.userId}/credits/add`;
          break;
        case 'subtract':
          endpoint = `/admin/users/${creditOperation.userId}/credits/deduct`;
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
          reason: creditOperation.reason
        }),
      });
      
      if (response.ok) {
        toast.success('Credit operation successful');
        setCreditDialogOpen(false);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to perform credit operation');
      }
    } catch (error) {
      console.error('Error performing credit operation:', error);
      toast.error('Error occurred while performing credit operation');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!user || !user.isAdmin) {
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
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
                          <Badge variant="outline">{user.credits} credits</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? "default" : "secondary"}>
                            {user.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleUserClick(user)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCreditDialogOpen(user)}>
                              <CreditCard className="h-4 w-4" />
                            </Button>
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
                <DialogDescription>View detailed information about the user</DialogDescription>
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
                    <p>Perform credit operation for {selectedUser.name}</p>
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
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    placeholder="Enter reason for this operation"
                    value={creditOperation.reason}
                    onChange={handleCreditOperationChange}
                    className="mt-1"
                  />
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
      </Tabs>
    </div>
  );
};

export default AdminDashboard;