// Auto-generated shims to satisfy TypeScript in the editor for third-party modules
// and Vite's import.meta.env typings. These are lightweight fallbacks so the
// IDE stops complaining when types are not present. Prefer installing proper
// @types packages for full type safety.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOME_OTHER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@tanstack/react-query' {
  export const QueryClient: any;
  export const QueryClientProvider: any;
  export const useQuery: any;
  export const useMutation: any;
  export const useQueryClient: any;
  const _default: any;
  export default _default;
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props?: any, key?: any): any;
  export function jsxs(type: any, props?: any, key?: any): any;
  export const Fragment: any;
}

declare module 'react' {
  const React: any;
  export default React;
  export function useState<T = any>(initial?: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void | undefined), deps?: any[]): void;
  export function useContext<T = any>(context: any): T;
  export function createContext<T = any>(defaultValue?: T): { Provider: any; Consumer: any; _currentValue?: T };
  export function useReducer<R = any, I = any>(reducer: any, initialState: I): [R, (action: any) => void];
  export type FC<P = any> = any;
  export type ReactNode = any;
  export const Fragment: any;
  export const useRef: any;
  export const useMemo: any;
  export const useCallback: any;
}

declare global {
  namespace React {
    type FC<P = any> = any;
    type ReactNode = any;
  }
}

// Provide generic-compatible signatures for common React helpers
declare function createContext<T = any>(defaultValue?: T): any;
declare function useReducer<R = any, I = any>(reducer: any, initialState: I): any;

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const useLocation: any;
  export const useNavigate: any;
  export const useSearchParams: any;
}

declare module 'lucide-react' {
  export const CheckCircle: any;
  export const XCircle: any;
  export const Loader2: any;
export const Mail: any;
export const Instagram: any;
export const MessageCircle: any;
export const Clock: any;
}

declare module 'sonner' {
  export const toast: any;
  export const Toaster: any;
}


