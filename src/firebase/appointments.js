import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'appointments';

/**
 * Create a new appointment (status: pending_payment)
 */
export const createAppointment = async (data) => {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    status: 'pending_payment',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

/**
 * Get a single appointment by ID
 */
export const getAppointment = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
};

/**
 * Get all appointments for a specific client
 */
export const getClientAppointments = async (clientUid) => {
  const q = query(
    collection(db, COLLECTION),
    where('clientUid', '==', clientUid),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get all appointments (admin view)
 */
export const getAllAppointments = async (statusFilter = null) => {
  let q;
  if (statusFilter) {
    q = query(
      collection(db, COLLECTION),
      where('status', '==', statusFilter),
      orderBy('date', 'asc')
    );
  } else {
    q = query(collection(db, COLLECTION), orderBy('date', 'asc'));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get appointments for a specific date range
 */
export const getAppointmentsByDateRange = async (startDate, endDate) => {
  const q = query(
    collection(db, COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (id, status, extra = {}) => {
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    ...extra,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Update appointment with payment proof (manual payment)
 */
export const submitPaymentProof = async (id, proofUrl) => {
  await updateDoc(doc(db, COLLECTION, id), {
    paymentProofUrl: proofUrl,
    status: 'pending_validation',
    updatedAt: Timestamp.now(),
  });
};

/**
 * Admin confirms manual payment
 */
export const confirmManualPayment = async (id) => {
  await updateAppointmentStatus(id, 'confirmed');
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (id, reason = '') => {
  await updateAppointmentStatus(id, 'cancelled', { cancelReason: reason });
};
