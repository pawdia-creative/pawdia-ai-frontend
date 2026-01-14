import React from 'react';
import DiagnosticTool from '@/components/DiagnosticTool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Diagnostics: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>System Diagnostics</CardTitle>
            <CardDescription>
              Use this tool to diagnose network connectivity and API issues with Pawdia AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you're experiencing login issues or connection problems, run the diagnostics below to identify the cause.
            </p>
          </CardContent>
        </Card>

        <DiagnosticTool />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Admin Login Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> admin@pawdia.ai</p>
              <p><strong>Password:</strong> admin123456</p>
              <p><strong>Role:</strong> Administrator</p>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> The password was recently reset. If login still fails after diagnostics pass,
                try clearing browser cache and cookies for pawdia-ai.com.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Diagnostics;
