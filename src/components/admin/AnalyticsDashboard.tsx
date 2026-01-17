import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Type-safe Recharts component wrappers
const LineChartTyped = LineChart as React.ComponentType<React.ComponentProps<typeof LineChart>>;
const CartesianGridTyped = CartesianGrid as React.ComponentType<React.ComponentProps<typeof CartesianGrid>>;
const XAxisTyped = XAxis as React.ComponentType<React.ComponentProps<typeof XAxis>>;
const YAxisTyped = YAxis as React.ComponentType<React.ComponentProps<typeof YAxis>>;
const TooltipTyped = Tooltip as React.ComponentType<React.ComponentProps<typeof Tooltip>>;
const LegendTyped = Legend as React.ComponentType<React.ComponentProps<typeof Legend>>;
const LineTyped = Line as React.ComponentType<React.ComponentProps<typeof Line>>;
import { toast } from '@/lib/toast';
import { tokenStorage } from '@/lib/tokenStorage';
import { Globe, Activity, Users, TrendingUp } from 'lucide-react';

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
  user_id: string;
  total_events: number;
  page_views: number;
  api_calls: number;
}

interface DailyStat {
  date: string;
  total_users: number;
  active_users: number;
  total_generations: number;
  total_credits_used: number;
  period: string;
  page_views: number;
  api_calls: number;
}

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalGenerations: number;
  totalCreditsUsed: number;
  totalPageViews: number;
  totalApiCalls: number;
  uniqueUsers: number;
  uniqueSessions: number;
  apiByEndpoint: ApiEndpointStat[];
  apiByStatus: ApiStatusStat[];
  topUsers: TopUserStat[];
  dailyStats: DailyStat[];
  monthlyStats: DailyStat[];
  yearlyStats: DailyStat[];
}

interface AnalyticsDashboardProps {
  activeTab: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ activeTab }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch analytics when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = tokenStorage.getToken();
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://pawdia-ai-api.pawdia-creative.workers.dev/api';
      const response = await fetch(`${apiBaseUrl}/admin/analytics/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data.topUsers); // Debug log
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

  return (
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
            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? 'Loading...' : (analytics?.totalApiCalls || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Image generation requests</p>
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
          ) : analytics?.apiByEndpoint && analytics.apiByEndpoint.length > 0 ? (
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
          ) : analytics?.apiByStatus && analytics.apiByStatus.length > 0 ? (
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
          <CardDescription>Top 20 users by total activity (page views + API calls)</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : analytics?.topUsers && analytics.topUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Activity</TableHead>
                  <TableHead>Page Views</TableHead>
                  <TableHead>AI Generations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topUsers.map((user: TopUserStat, index: number) => {
                  const displayName = user.name || user.email || user.user_id || user.id || 'Unknown User';
                  const secondary = (user.email && user.email !== displayName) ? user.email : (user.user_id && user.user_id !== displayName ? user.user_id : '');
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{displayName}</span>
                          {secondary ? <span className="text-xs text-muted-foreground font-mono">{secondary}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell>{user.total_events}</TableCell>
                      <TableCell>{user.page_views}</TableCell>
                      <TableCell>{user.api_calls}</TableCell>
                    </TableRow>
                  );
                })}
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
            <CardDescription>Daily page views and AI image generations</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>AI Generations</TableHead>
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
            <CardDescription>Monthly page views and AI image generations</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : analytics?.monthlyStats && analytics.monthlyStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>AI Generations</TableHead>
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
            <CardDescription>Yearly page views and AI image generations</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : analytics?.yearlyStats && analytics.yearlyStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Page Views</TableHead>
                    <TableHead>AI Generations</TableHead>
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
          <CardTitle>Trends: Page Views & AI Generations</CardTitle>
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
                {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
                  <ChartContainer
                    config={{
                      page_views: { label: 'Page Views', color: 'hsl(25 95% 53%)' },
                      api_calls: { label: 'AI Generations', color: 'hsl(270 60% 35%)' },
                    }}
                    className="h-64"
                  >
                    {React.createElement(LineChartTyped, { data: analytics.dailyStats } as any,
                      React.createElement(CartesianGridTyped, { strokeDasharray: "3 3" } as any),
                      React.createElement(XAxisTyped, { dataKey: "period", tick: { fontSize: 10 } } as any),
                      React.createElement(YAxisTyped, {} as any),
                      React.createElement(TooltipTyped, { content: React.createElement(ChartTooltipContent) } as any),
                      React.createElement(LegendTyped, {} as any),
                      React.createElement(LineTyped, { type: "monotone", dataKey: "page_views", stroke: "hsl(var(--primary))", dot: false } as any),
                      React.createElement(LineTyped, { type: "monotone", dataKey: "api_calls", stroke: "hsl(var(--secondary))", dot: false } as any)
                    )}
                  </ChartContainer>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No data</div>
                )}
              </div>

              {/* 月趋势图 */}
              <div>
                <h4 className="text-sm font-medium mb-2">Monthly (last 12 months)</h4>
                {analytics?.monthlyStats && analytics.monthlyStats.length > 0 ? (
                  <ChartContainer
                    config={{
                      page_views: { label: 'Page Views', color: 'hsl(25 95% 53%)' },
                      api_calls: { label: 'AI Generations', color: 'hsl(270 60% 35%)' },
                    }}
                    className="h-64"
                  >
                    {React.createElement(LineChartTyped, { data: analytics.monthlyStats } as any,
                      React.createElement(CartesianGridTyped, { strokeDasharray: "3 3" } as any),
                      React.createElement(XAxisTyped, { dataKey: "period", tick: { fontSize: 10 } } as any),
                      React.createElement(YAxisTyped, {} as any),
                      React.createElement(TooltipTyped, { content: React.createElement(ChartTooltipContent) } as any),
                      React.createElement(LegendTyped, {} as any),
                      React.createElement(LineTyped, { type: "monotone", dataKey: "page_views", stroke: "hsl(var(--primary))", dot: false } as any),
                      React.createElement(LineTyped, { type: "monotone", dataKey: "api_calls", stroke: "hsl(var(--secondary))", dot: false } as any)
                    )}
                  </ChartContainer>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No data</div>
                )}
              </div>

              {/* 年趋势图 */}
              <div>
                <h4 className="text-sm font-medium mb-2">Yearly (last 5 years)</h4>
                {analytics?.yearlyStats && analytics.yearlyStats.length > 0 ? (
                  <ChartContainer
                    config={{
                      page_views: { label: 'Page Views', color: 'hsl(25 95% 53%)' },
                      api_calls: { label: 'AI Generations', color: 'hsl(270 60% 35%)' },
                    }}
                    className="h-64"
                  >
                    {React.createElement(LineChartTyped, { data: analytics.yearlyStats } as any,
                      React.createElement(CartesianGridTyped, { strokeDasharray: "3 3" } as any),
                      React.createElement(XAxisTyped, { dataKey: "period", tick: { fontSize: 10 } } as any),
                      React.createElement(YAxisTyped, {} as any),
                      React.createElement(TooltipTyped, { content: React.createElement(ChartTooltipContent) } as any),
                      React.createElement(LegendTyped, {} as any),
                      React.createElement(LineTyped, { type: "monotone", dataKey: "page_views", stroke: "hsl(var(--primary))", dot: false } as any),
                      React.createElement(LineTyped, { type: "monotone", dataKey: "api_calls", stroke: "hsl(var(--secondary))", dot: false } as any)
                    )}
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
  );
};

export default AnalyticsDashboard;
