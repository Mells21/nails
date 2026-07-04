import { CANCELLATION_POLICY, SALON_INFO } from './constants';
import { toReadableDate, to12h, formatPrice } from './dates';

/**
 * Build the WhatsApp confirmation message for a new appointment
 */
export const buildConfirmationMessage = ({ clientName, date, time, service, address }) => {
  const readableDate = toReadableDate(date);
  const readableTime = to12h(time);
  const salAddress = address || SALON_INFO.address;

  return `¡Hola ${clientName}! 💅✨

Tu cita ha sido *confirmada* en ${SALON_INFO.name}.

📅 *Fecha:* ${readableDate}
⏰ *Hora:* ${readableTime}
💆 *Servicio:* ${service}
📍 *Dirección:* ${salAddress}

${CANCELLATION_POLICY}

¡Te esperamos! Si tenés alguna pregunta, escribinos aquí 🙌`;
};

/**
 * Build the WhatsApp reminder message (24h before)
 */
export const buildReminderMessage = ({ clientName, date, time, service }) => {
  const readableDate = toReadableDate(date);
  const readableTime = to12h(time);

  return `¡Hola ${clientName}! 👋

Te recordamos que mañana tenés tu cita en ${SALON_INFO.name} 💅

📅 *Fecha:* ${readableDate}
⏰ *Hora:* ${readableTime}
💆 *Servicio:* ${service}

Recordá que esperamos máximo *15 minutos* ⏱️
¡Nos vemos! 🌸`;
};

/**
 * Build the WhatsApp notification message sent to the salon owner
 * when a client finishes the booking flow and submits payment proof.
 */
export const buildAdminNotificationMessage = ({ clientName, clientPhone, date, time, service, price }) => {
  const readableDate = toReadableDate(date);
  const readableTime = to12h(time);

  return `🔔 *Nueva reserva*

👤 *Clienta:* ${clientName}
📱 *Teléfono:* ${clientPhone}
💆 *Servicio:* ${service}
📅 *Fecha:* ${readableDate}
⏰ *Hora:* ${readableTime}
💰 *Total:* ${formatPrice(price)}

✅ Comprobante de pago enviado, pendiente de validar.`;
};

/**
 * Generate a wa.me link with pre-filled message
 * @param {string} phone - phone number with country code, no + or spaces
 * @param {string} message - the message text
 */
export const buildWhatsAppLink = (phone, message) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp with pre-filled message in a new tab
 */
export const openWhatsApp = (phone, message) => {
  const link = buildWhatsAppLink(phone, message);
  window.open(link, '_blank');
};
