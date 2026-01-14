import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: unknown;
}

const DiagnosticTool: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 0: Basic internet connectivity
    addResult({ test: 'Internet Connectivity', status: 'pending', message: 'Testing basic internet connection...' });
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      addResult({ test: 'Internet Connectivity', status: 'success', message: 'Internet connection OK', details: 'Can reach external sites' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({ test: 'Internet Connectivity', status: 'error', message: 'Internet connection failed', details: errorMessage });
    }

    // Test 1: Basic connectivity to API
    addResult({ test: 'API Connectivity', status: 'pending', message: 'Testing API connection...' });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://pawdia-ai-api.pawdia-creative.workers.dev/api/health', {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        addResult({ test: 'API Connectivity', status: 'success', message: 'API is reachable', details: `Status: ${response.status}` });
      } else {
        addResult({ test: 'API Connectivity', status: 'error', message: `API responded with status ${response.status}`, details: response.statusText });
      }
    } catch (error: unknown) {
      const errorObj = error as { name?: string; message?: string };
      if (errorObj.name === 'AbortError') {
        addResult({ test: 'API Connectivity', status: 'error', message: 'Connection timeout (10s)', details: 'API server may be down or unreachable' });
      } else if (errorObj.message?.includes('ERR_TUNNEL_CONNECTION_FAILED')) {
        addResult({ test: 'API Connectivity', status: 'error', message: 'Tunnel connection failed', details: 'Possible proxy/VPN/firewall issue. Try disabling VPN or proxy.' });
      } else {
        addResult({ test: 'API Connectivity', status: 'error', message: 'Connection failed', details: errorObj.message || 'Unknown error' });
      }
    }

    // Test 2: CORS preflight
    addResult({ test: 'CORS Preflight', status: 'pending', message: 'Testing CORS preflight...' });
    try {
      const response = await fetch('https://pawdia-ai-api.pawdia-creative.workers.dev/api/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok || response.status === 200) {
        addResult({ test: 'CORS Preflight', status: 'success', message: 'CORS preflight successful', details: `Status: ${response.status}` });
      } else {
        addResult({ test: 'CORS Preflight', status: 'error', message: `CORS preflight failed: ${response.status}`, details: response.statusText });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({ test: 'CORS Preflight', status: 'error', message: 'CORS preflight failed', details: errorMessage });
    }

    // Test 3: Login attempt
    addResult({ test: 'Admin Login', status: 'pending', message: 'Testing admin login...' });
    try {
      const response = await fetch('https://pawdia-ai-api.pawdia-creative.workers.dev/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@pawdia.ai',
          password: 'admin123456'
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.token) {
        addResult({ test: 'Admin Login', status: 'success', message: 'Admin login successful', details: `User: ${data.user.email}` });
      } else {
        addResult({ test: 'Admin Login', status: 'error', message: `Login failed: ${data.message || 'Unknown error'}`, details: `Status: ${response.status}` });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({ test: 'Admin Login', status: 'error', message: 'Login request failed', details: errorMessage });
    }

    // Test 4: Auth check
    addResult({ test: 'Auth Check', status: 'pending', message: 'Testing auth check...' });
    try {
      const response = await fetch('https://pawdia-ai-api.pawdia-creative.workers.dev/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        addResult({ test: 'Auth Check', status: 'success', message: 'Auth check successful', details: `User: ${data.user?.email || 'Unknown'}` });
      } else if (response.status === 401) {
        addResult({ test: 'Auth Check', status: 'error', message: 'Not authenticated (expected if no login)', details: `Status: ${response.status}` });
      } else {
        addResult({ test: 'Auth Check', status: 'error', message: `Auth check failed: ${response.status}`, details: response.statusText });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({ test: 'Auth Check', status: 'error', message: 'Auth check request failed', details: errorMessage });
    }

    setIsRunning(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Network Diagnostics</CardTitle>
        <CardDescription>
          Test connectivity to Pawdia AI API services. This helps identify network or configuration issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
          {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
        </Button>

        <div className="space-y-2">
          {results.map((result, index) => (
            <Alert key={index} className={`${
              result.status === 'success' ? 'border-green-500' :
              result.status === 'error' ? 'border-red-500' :
              'border-yellow-500'
            }`}>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{result.test}:</strong> {result.message}
                    {result.details && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {typeof result.details === 'string' ? result.details : String(result.details)}
                      </div>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    result.status === 'success' ? 'bg-green-500' :
                    result.status === 'error' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Troubleshooting Tips:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>ERR_TUNNEL_CONNECTION_FAILED</strong>: This indicates a proxy, VPN, or firewall issue</li>
              <li>• Try <strong>disabling your VPN</strong> or proxy server temporarily</li>
              <li>• Check if your <strong>firewall/antivirus</strong> is blocking HTTPS connections</li>
              <li>• Try using a <strong>different network</strong> (mobile hotspot, different WiFi)</li>
              <li>• Clear browser cache and try <strong>incognito/private mode</strong></li>
              <li>• If using Chrome, try <strong>disabling "Use secure DNS"</strong> in settings</li>
              <li>• Check if your ISP is blocking certain HTTPS traffic</li>
            </ul>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800 mb-1">Quick Fix Options:</h4>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. <strong>Disable VPN/Proxy</strong> - Most common solution</li>
                <li>2. <strong>Try different browser</strong> (Firefox, Safari, Edge)</li>
                <li>3. <strong>Use mobile data</strong> instead of WiFi</li>
                <li>4. <strong>Contact your network administrator</strong> if on corporate network</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosticTool;
