import React from 'react';
import BaseRoute from './BaseRoute';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return (
    <BaseRoute>
      {children}
    </BaseRoute>
  );
};

export default ProtectedRoute;