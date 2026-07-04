// ==============================================
// SERVICES CATALOG
// ==============================================
export const SERVICES = [
  {
    id: 'gel_polish',
    name: 'Esmaltado Permanente (Gel)',
    description: 'Esmalte de larga duración, brillo intenso hasta 3 semanas.',
    duration: 60,
    price: 25000,
    emoji: '💅',
    color: '#f472b6',
  },
  {
    id: 'rubber_base',
    name: 'Rubber Base con Diseño',
    description: 'Base de goma flexible con diseño personalizado.',
    duration: 90,
    price: 35000,
    emoji: '🌸',
    color: '#c084fc',
  },
  {
    id: 'acrylic_natural',
    name: 'Acrílico Natural',
    description: 'Uñas de acrílico sin diseño, acabado natural o nude.',
    duration: 120,
    price: 50000,
    emoji: '✨',
    color: '#a78bfa',
  },
  {
    id: 'acrylic_design',
    name: 'Acrílico con Diseño',
    description: 'Uñas de acrílico con diseño personalizado (nail art).',
    duration: 150,
    price: 65000,
    emoji: '🎨',
    color: '#818cf8',
  },
  {
    id: 'french',
    name: 'Francés (French Manicure)',
    description: 'Clásico diseño francés en punta blanca con base nude.',
    duration: 60,
    price: 30000,
    emoji: '🤍',
    color: '#e2e8f0',
  },
  {
    id: 'nail_art',
    name: 'Diseño Adicional (Nail Art)',
    description: 'Arte extra sobre cualquier servicio base.',
    duration: 30,
    price: 15000,
    emoji: '🖌️',
    color: '#fb7185',
  },
  {
    id: 'acrylic_removal',
    name: 'Retiro de Acrílico',
    description: 'Remoción segura de uñas acrílicas.',
    duration: 45,
    price: 20000,
    emoji: '🗑️',
    color: '#6b7280',
  },
  {
    id: 'repair',
    name: 'Reparación de Uña',
    description: 'Reparación de una uña quebrada o dañada.',
    duration: 20,
    price: 8000,
    emoji: '🔧',
    color: '#f59e0b',
  },
];

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
  name: import.meta.env.VITE_SALON_NAME || 'Nail Studio',
  address: import.meta.env.VITE_SALON_ADDRESS || 'Dirección del salón',
  whatsapp: import.meta.env.VITE_SALON_WHATSAPP || '+57300000000',
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
