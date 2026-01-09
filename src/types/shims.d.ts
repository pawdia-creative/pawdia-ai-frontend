// Temporary shims to smooth over missing/variant type exports during build.
// These should be replaced with proper types or library upgrades later.

declare module 'lucide-react' {
  // Common icons used across the codebase (declare as any to avoid type errors)
  export const Users: any;
  export const BarChart3: any;
  export const Search: any;
  export const CreditCard: any;
  export const Eye: any;
  export const Save: any;
  export const ShieldCheck: any;
  export const KeyRound: any;
  export const Trash2: any;
  export const ArrowLeft: any;
  export const Download: any;
  export const RefreshCw: any;
  export const AlertCircle: any;
  export const Settings: any;
  export const Coins: any;
  export const AlertTriangle: any;
  export const MoveHorizontal: any;
  export const Wand2: any;
  export const Globe: any;
  export const Activity: any;
  export const TrendingUp: any;
  export const Mail: any;
  export const CheckCircle: any;
  export const Loader2: any;
  export default any;
}

declare module 'recharts' {
  // Minimal shims for Recharts components used in the project.
  export const XAxis: any;
  export const YAxis: any;
  export const Line: any;
  export const Tooltip: any;
  export const Legend: any;
  export const ResponsiveContainer: any;
  export const LineChart: any;
  export const CartesianGrid: any;
  export const BarChart: any;
  export const Bar: any;
  export const AreaChart: any;
  export const Area: any;
  export const PieChart: any;
  export const Pie: any;
  export const Cell: any;
  export const Sector: any;
  export const ComposedChart: any;
  export const CartesianAxis: any;
  export const ChartTooltip: any;
  export default any;
}

// Vitest globals shim for tests
declare const vi: any;

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

 

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const useLocation: any;
  export const useNavigate: any;
  export const useSearchParams: any;
}

 

declare module 'sonner' {
  export const toast: any;
  export const Toaster: any;
}


