import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'users';

/**
 * Get client profile
 */
export const getClientProfile = async (uid) => {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
};

/**
 * Update client profile notes/preferences
 */
export const updateClientProfile = async (uid, data) => {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

/**
 * Get all clients (admin only)
 */
export const getAllClients = async () => {
  const q = query(
    collection(db, COLLECTION),
    orderBy('name', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.role === 'client');
};
