import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/useAuth';
import * as RR from 'react-router-dom';
import { toast } from '@/lib/toast';
import AuthStatusDebug from '@/components/AuthStatusDebug';

// Type-safe react-router hooks (workaround for type resolution issues)
type NavigateFunction = (to: string | number, options?: { replace?: boolean; state?: unknown }) => void;

const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = RR.useNavigate as unknown as NavigateFunction;
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setName(user?.name || '');
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || name.trim().length < 2 || name.trim().length > 50) {
      toast.error('Name must be between 2 and 50 characters');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ name: name.trim() });
      setIsEditing(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setName(user?.name || '');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <p>Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full"
                        minLength={2}
                        maxLength={50}
                      />
                      <div className="text-xs text-gray-500">
                        {name.length}/50 characters
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold">{user.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-lg font-semibold">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Member Since</label>
                <p className="text-lg font-semibold">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {isEditing && (
                <div className="flex space-x-2 pt-2">
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleEditProfile}
                disabled={isEditing}
              >
                Edit Profile
              </Button>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
                disabled={isEditing}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug component - only show in development */}
      {import.meta.env.DEV && <AuthStatusDebug />}
    </div>
  );
};

export default Profile;