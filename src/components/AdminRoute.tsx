import React from 'react';
import BaseRoute from './BaseRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return (
    <BaseRoute adminOnly={true}>
      {children}
    </BaseRoute>
  );
};

export default AdminRoute;