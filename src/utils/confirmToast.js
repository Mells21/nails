import { toast } from 'gooey-toast';

/**
 * Reemplaza el confirm() nativo del navegador por un toast de confirmación
 * (gooey-toast). La librería no tiene botón de cerrar ni cancelar, así que
 * si se dejara sin duración se quedaría pegado en pantalla para siempre
 * cuando la dueña decide no confirmar. Por eso se autodescarta solo, con
 * una barra de tiempo visible para que se note que va a desaparecer.
 */
export const confirmAction = ({ title, description, confirmLabel = 'Confirmar', onConfirm }) => {
  const id = `confirm-${Date.now()}`;
  toast.action({
    id,
    title,
    description,
    duration: 8000,
    timeoutIndicator: true,
    button: {
      title: confirmLabel,
      onClick: () => {
        toast.dismiss(id);
        onConfirm();
      },
    },
  });
};
