// Temporary shims for third-party libs to silence TS errors when types cannot be resolved in the sandbox.
// These provide minimal 'any' typings for runtime usage and should be replaced with proper @types packages in CI.
declare module 'react-router-dom' {
  import React = require('react');
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Link: any;
  export function useLocation(): any;
  export function useNavigate(): any;
  export function useParams(): any;
  export function Outlet(): any;
  export default any;
}

declare module 'react-query' {
  export const QueryClient: any;
  export const QueryClientProvider: any;
  export const useQuery: any;
  export const useMutation: any;
  export default any;
}

declare module '@tanstack/react-query' {
  export const QueryClient: any;
  export const QueryClientProvider: any;
  export const useQuery: any;
  export const useMutation: any;
  export default any;
}


