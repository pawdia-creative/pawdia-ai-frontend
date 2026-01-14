declare module '@/lib/toast' {
  // Type-safe shim to avoid type conflicts across environments.
  export const toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
    promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) => Promise<T>;
    dismiss: (toastId?: string | number) => void;
  };
  export default typeof toast;
}


