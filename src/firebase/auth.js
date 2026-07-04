import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Register a new client user
 */
export const registerClient = async ({ email, password, name, phone }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    name,
    email,
    phone,
    role: 'client',
    createdAt: new Date().toISOString(),
    notes: '',
    favoriteColors: '',
    allergies: '',
  });

  return user;
};

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Logout current user
 */
export const logout = async () => {
  await signOut(auth);
};

/**
 * Get user profile from Firestore (includes role)
 */
export const getUserProfile = async (uid) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};
