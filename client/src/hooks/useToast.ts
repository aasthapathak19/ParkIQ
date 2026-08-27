import toast from 'react-hot-toast';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'success' | 'error' | 'default';
}

export const useToast = () => {
  const showToast = ({ title, description, variant = 'default' }: ToastOptions) => {
    const message = description ? `${title}: ${description}` : (title ?? '');
    if (variant === 'error') {
      toast.error(message);
    } else if (variant === 'success') {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  return { toast: showToast };
};
