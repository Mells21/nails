import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a reference photo for an appointment
 * @param {File} file
 * @param {string} appointmentId
 * @param {number} index - photo index (0,1,2)
 * @returns {string} download URL
 */
export const uploadReferencePhoto = async (file, appointmentId, index) => {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `references/${appointmentId}/photo_${index}.${ext}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

/**
 * Upload a payment proof screenshot
 * @param {File} file
 * @param {string} appointmentId
 * @returns {string} download URL
 */
export const uploadPaymentProof = async (file, appointmentId) => {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `payment_proofs/${appointmentId}/proof.${ext}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

/**
 * Upload a gallery image (admin uploads finished work)
 * @param {File} file
 * @param {string} filename
 * @returns {string} download URL
 */
export const uploadGalleryImage = async (file, filename) => {
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `gallery/${filename}.${ext}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};
