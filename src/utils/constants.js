// ==============================================
// APPOINTMENT STATUSES
// ==============================================
export const APPOINTMENT_STATUSES = {
  pending_payment: {
    label: 'Pendiente de pago',
    color: '#f59e0b',
    bg: '#fef3c7',
  },
  pending_validation: {
    label: 'Validando comprobante',
    color: '#8b5cf6',
    bg: '#ede9fe',
  },
  confirmed: {
    label: 'Confirmada',
    color: '#10b981',
    bg: '#d1fae5',
  },
  completed: {
    label: 'Completada',
    color: '#3b82f6',
    bg: '#dbeafe',
  },
  cancelled: {
    label: 'Cancelada',
    color: '#ef4444',
    bg: '#fee2e2',
  },
  no_show: {
    label: 'No asistió',
    color: '#6b7280',
    bg: '#f3f4f6',
  },
};

// ==============================================
// CANCELLATION POLICY
// ==============================================
export const CANCELLATION_POLICY = `📌 *Políticas del salón:*

• *Cancelaciones:* Avisá con al menos 24 horas de anticipación para reagendar sin costo.
• *Tolerancia de retrasos:* Esperamos hasta 15 minutos. Pasado ese tiempo, la cita se cancela y se registra como inasistencia.
• *Depósito/Seña:* El anticipo pagado NO es reembolsable si no asistís o si cancelás con menos de 24 horas de anticipación.`;

// ==============================================
// SALON INFO
// ==============================================
export const SALON_INFO = {
  name: 'AuraNails',
  address: 'Jr. Raimondi 501, Rioja, San Martin, Peru',
  whatsapp: '+51 928 432 432',
};

// ==============================================
// DAYS OF WEEK
// ==============================================
export const DAYS_OF_WEEK = [
  { key: 0, label: 'Domingo', short: 'Dom' },
  { key: 1, label: 'Lunes', short: 'Lun' },
  { key: 2, label: 'Martes', short: 'Mar' },
  { key: 3, label: 'Miércoles', short: 'Mié' },
  { key: 4, label: 'Jueves', short: 'Jue' },
  { key: 5, label: 'Viernes', short: 'Vie' },
  { key: 6, label: 'Sábado', short: 'Sáb' },
];
