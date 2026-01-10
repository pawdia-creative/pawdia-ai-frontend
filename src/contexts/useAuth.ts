import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from '@/types/auth';

// Separate hook export to keep AuthContext file exporting only components for Fast Refresh
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext) as AuthContextType | undefined;
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


