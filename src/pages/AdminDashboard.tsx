import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/useAuth';
import { apiClient } from '@/lib/apiClient';
import UserManagement from '@/components/admin/UserManagement';
import { Users, BarChart3, Mail } from 'lucide-react';

// Import a synchronous fallback for cases where dynamic import fails (e.g. CDN/module rewrite issues)
import AnalyticsDashboardSync from '@/components/admin/AnalyticsDashboard';

// Lazy loader with robust fallback: attempt dynamic import, if it fails render synchronous fallback
const LazyAnalyticsLoader: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const [Loaded, setLoaded] = React.useState<React.ComponentType<any> | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    import('@/components/admin/AnalyticsDashboard')
      .then((m) => {
        if (!mounted) return;
        setLoaded(() => m.default);
      })
      .catch((err) => {
        console.warn('Dynamic import of AnalyticsDashboard failed, falling back to synchronous build:', err);
        setFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (failed) {
    return <AnalyticsDashboardSync activeTab={activeTab} />;
  }

  if (Loaded) {
    const Comp = Loaded;
    return <Comp activeTab={activeTab} />;
  }

  // Loading state while dynamic import resolves
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">Loading analytics...</span>
    </div>
  );
};

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
  stats?: {
    verification_sent?: number;
    verification_sent_today?: number;
    verification_success?: number;
    verification_success_today?: number;
    email_send_failed?: number;
    email_send_failed_today?: number;
  };
  recentEvents?: Array<{
    event_type?: string;
    user_id?: string | null;
    created_at?: string;
  }>;
}

const AdminDashboard = React.memo(() => {
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
      const response = await apiClient.get('/admin/email-stats');
      setEmailStats(response.data as unknown as EmailStats);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching email stats:', error);
      toast.error('Failed to fetch email statistics');
    } finally {
      setEmailStatsLoading(false);
    }
  }, []);

  // Get user list
  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.get(`/admin/users?search=${encodeURIComponent(searchTerm)}&page=${page}&perPage=${perPage}`);
      const data = response.data as unknown as Record<string, unknown>;
        // Filter out users with null or undefined IDs
      const rawUsers = (data['users'] as unknown[]) || [];
      const validUsers = rawUsers.filter((u: unknown) => {
        const id = (u as unknown as Record<string, unknown>)['id'];
        return id != null && id !== 'null' && id !== '';
      }) as User[];
        setUsers(validUsers);
      setTotal(Number((data['total'] as number) || 0));
      return validUsers;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error fetching users:', error);
      toast.error('Failed to fetch user list');
    } finally {
      setLoading(false);
    }
    return [];
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
          <LazyAnalyticsLoader activeTab={activeTab} />
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
                  <p className="text-2xl font-bold text-blue-600">{emailStats.stats?.verification_sent ?? 0}</p>
                  <p className="text-xs text-gray-500">Today: {emailStats.stats?.verification_sent_today ?? 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium text-gray-600">Successful Verifications</h3>
                  <p className="text-2xl font-bold text-green-600">{emailStats.stats?.verification_success ?? 0}</p>
                  <p className="text-xs text-gray-500">Today: {emailStats.stats?.verification_success_today ?? 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium text-gray-600">Email Send Failures</h3>
                  <p className="text-2xl font-bold text-red-600">{emailStats.stats?.email_send_failed ?? 0}</p>
                  <p className="text-xs text-gray-500">Today: {emailStats.stats?.email_send_failed_today ?? 0}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {(emailStats.stats?.verification_sent ?? 0) > 0
                      ? Math.round(((emailStats.stats?.verification_success ?? 0) / (emailStats.stats?.verification_sent ?? 1)) * 100)
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
                  {emailStats.recentEvents.slice(0, 20).map((event, index: number) => {
                    const evt = event as { event_type?: string; user_id?: string | null; created_at?: string };
                    const label = evt.event_type || 'event';
                    return (
                    <div key={index} className="p-4 flex justify-between items-center">
              <div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            label === 'verification_sent' ? 'bg-blue-100 text-blue-800' :
                            label === 'verification_success' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                            {label.replace('_', ' ')}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                            User: {String((evt.user_id || '').toString()).slice(0, 8)}...
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {evt.created_at ? new Date(evt.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                    );
                  })}
                    </div>
                  </div>
                )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;