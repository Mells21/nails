import { toast as gooeyToast } from 'gooey-toast';

/**
 * Wrapper con la misma firma simple que usaba react-hot-toast
 * (toast.success('mensaje') / toast.error('mensaje')) para no tener
 * que reescribir cada llamada al migrar a gooey-toast.
 */
export const toast = {
  success: (title) => gooeyToast.success({ title }),
  error: (title) => gooeyToast.error({ title }),
};
