import { toast as sonnerToast } from 'sonner';

// Runtime wrapper around sonner.toast with proper error handling
const createToastWrapper = () => {
  const wrapper = (...args: Parameters<typeof sonnerToast>) => {
    try {
      return sonnerToast(...args);
    } catch {
      return '';
    }
  };

  wrapper.success = (message: string) => {
    try {
      return sonnerToast.success(message);
    } catch {
      return '';
    }
  };

  wrapper.error = (message: string) => {
    try {
      return sonnerToast.error(message);
    } catch {
      return '';
    }
  };

  wrapper.info = (message: string) => {
    try {
      return sonnerToast.info ? sonnerToast.info(message) : sonnerToast(message);
    } catch {
      return '';
    }
  };

  wrapper.warning = (message: string) => {
    try {
      return sonnerToast.warning ? sonnerToast.warning(message) : sonnerToast(message);
    } catch {
      return '';
    }
  };

  wrapper.promise = (promise: Promise<unknown>, messages: { loading: string; success: string; error: string }) => {
    try {
      return sonnerToast.promise(promise, messages);
    } catch {
      return { unwrap: async () => { throw new Error('toast.promise not available'); } };
    }
  };

  wrapper.dismiss = (toastId?: string | number) => {
    try {
      return sonnerToast.dismiss(toastId);
    } catch {
      return '';
    }
  };

  return wrapper;
};

export const toast = createToastWrapper();
export default toast;


