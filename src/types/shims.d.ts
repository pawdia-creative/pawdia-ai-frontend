// Temporary shims to smooth over missing/variant type exports during build.
// These should be replaced with proper types or library upgrades later.

declare module 'lucide-react' {
  import type React from 'react';
  // Icons exported as React components accepting SVG props
  export const Users: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const BarChart3: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Search: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const CreditCard: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Eye: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Save: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const ShieldCheck: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const KeyRound: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Trash2: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const ArrowLeft: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Download: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const RefreshCw: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const AlertCircle: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Settings: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Coins: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const AlertTriangle: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const MoveHorizontal: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Wand2: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Globe: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Activity: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const TrendingUp: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Mail: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const CheckCircle: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Loader2: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  const _default: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>;
  export default _default;
}

declare module 'recharts' {
  import type React from 'react';
  // Minimal shims for Recharts components used in the project.
  export const XAxis: React.ComponentType<unknown>;
  export const YAxis: React.ComponentType<unknown>;
  export const Line: React.ComponentType<unknown>;
  export const Tooltip: React.ComponentType<unknown>;
  export const Legend: React.ComponentType<unknown>;
  export const ResponsiveContainer: React.ComponentType<unknown>;
  export const LineChart: React.ComponentType<unknown>;
  export const CartesianGrid: React.ComponentType<unknown>;
  export const BarChart: React.ComponentType<unknown>;
  export const Bar: React.ComponentType<unknown>;
  export const AreaChart: React.ComponentType<unknown>;
  export const Area: React.ComponentType<unknown>;
  export const PieChart: React.ComponentType<unknown>;
  export const Pie: React.ComponentType<unknown>;
  export const Cell: React.ComponentType<unknown>;
  export const Sector: React.ComponentType<unknown>;
  export const ComposedChart: React.ComponentType<unknown>;
  export const CartesianAxis: React.ComponentType<unknown>;
  export const ChartTooltip: React.ComponentType<unknown>;
  const _default: Record<string, React.ComponentType<unknown>>;
  export default _default;
}

// Vitest globals shim for tests
declare const vi: unknown;

// Auto-generated shims to satisfy TypeScript in the editor for third-party modules
// and Vite's import.meta.env typings. These are lightweight fallbacks so the
// IDE stops complaining when types are not present. Prefer installing proper
// @types packages for full type safety.

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOME_OTHER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Window globals used by runtime-injection for PayPal
interface Window {
  __PAYPAL_CLIENT_ID__?: string;
}

declare module '@tanstack/react-query' {
  export const QueryClient: unknown;
  export const QueryClientProvider: unknown;
  export const useQuery: unknown;
  export const useMutation: unknown;
  export const useQueryClient: unknown;
  const _default: unknown;
  export default _default;
}

declare module 'react/jsx-runtime' {
  export function jsx(type: unknown, props?: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props?: unknown, key?: unknown): unknown;
  export const Fragment: unknown;
}

 

declare module 'react-router-dom' {
  export const BrowserRouter: unknown;
  export const Routes: unknown;
  export const Route: unknown;
  export const useLocation: unknown;
  export const useNavigate: unknown;
  export const useSearchParams: unknown;
}

 

declare module 'sonner' {
  export const toast: {
    error: (title: string, opts?: { description?: string; action?: { label: string; onClick: () => void } }) => void;
  };
  export const Toaster: unknown;
}


