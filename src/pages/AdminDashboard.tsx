import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth, tokenStorage } from '@/contexts/AuthContext';
import UserManagement from '@/components/admin/UserManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { Users, BarChart3, Mail } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface EmailStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  verificationRate: number;
}

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [total, setTotal] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('users');
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);
  const [emailStatsLoading, setEmailStatsLoading] = useState(false);

  // Get email statistics
  const fetchEmailStats = useCallback(async () => {
    try {
      setEmailStatsLoading(true);
      const token = tokenStorage.getToken();
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const response = await fetch(`${apiBaseUrl}/admin/email-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmailStats(data);
      } else {
        toast.error('Failed to fetch email statistics');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching email stats:', error);
      toast.error('Error fetching email statistics');
    } finally {
      setEmailStatsLoading(false);
    }
  }, []);

  // Get user list
  const fetchUsers = useCallback(async () => {
    try {
      const token = tokenStorage.getToken();
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const response = await fetch(`${apiBaseUrl}/admin/users?search=${encodeURIComponent(searchTerm)}&page=${page}&perPage=${perPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out users with null or undefined IDs
        const validUsers = (data.users || []).filter((u: { id?: string | null }) => u.id != null && u.id !== 'null' && u.id !== '');
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
  }, [searchTerm, page, perPage]);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'emails' && !emailStats) {
      fetchEmailStats();
    }
  }, [activeTab, emailStats, fetchEmailStats]);

  useEffect(() => {
    // refetch when page or perPage changes
    fetchUsers();
  }, [page, perPage, fetchUsers]);

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
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
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement
            users={users}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onRefreshUsers={fetchUsers}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard activeTab={activeTab} />
        </TabsContent>

        <TabsContent value="emails">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Email Statistics</h2>
                              <Button 
                variant="outline"
                                size="sm" 
                onClick={fetchEmailStats}
                disabled={emailStatsLoading}
                              >
                {emailStatsLoading ? 'Loading...' : 'Refresh Stats'}
                              </Button>
                          </div>

            {emailStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium text-gray-600">Verification Emails Sent</h3>
                  <p className="text-2xl font-bold text-blue-600">{emailStats.stats?.verification_sent || 0}</p>
                  <p className="text-xs text-gray-500">Today: {emailStats.stats?.verification_sent_today || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium text-gray-600">Successful Verifications</h3>
                  <p className="text-2xl font-bold text-green-600">{emailStats.stats?.verification_success || 0}</p>
                  <p className="text-xs text-gray-500">Today: {emailStats.stats?.verification_success_today || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium text-gray-600">Email Send Failures</h3>
                  <p className="text-2xl font-bold text-red-600">{emailStats.stats?.email_send_failed || 0}</p>
                  <p className="text-xs text-gray-500">Today: {emailStats.stats?.email_send_failed_today || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {emailStats.stats?.verification_sent > 0
                      ? Math.round(((emailStats.stats?.verification_success || 0) / emailStats.stats?.verification_sent) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Overall success rate</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Click "Refresh Stats" to load email statistics</p>
              </div>
            )}

            {emailStats?.recentEvents && emailStats.recentEvents.length > 0 && (
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">Recent Email Events</h3>
                </div>
                <div className="divide-y">
                  {emailStats.recentEvents.slice(0, 20).map((event: { event_type: string; email: string; created_at: string }, index: number) => (
                    <div key={index} className="p-4 flex justify-between items-center">
              <div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          event.event_type === 'verification_sent' ? 'bg-blue-100 text-blue-800' :
                          event.event_type === 'verification_success' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {event.event_type.replace('_', ' ')}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          User: {event.user_id?.substring(0, 8)}...
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                    </div>
                  </div>
                )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;