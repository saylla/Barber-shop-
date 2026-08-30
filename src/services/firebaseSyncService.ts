import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, googleProvider, OperationType, handleFirestoreError } from '../lib/firebase';
import { signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  Appointment,
  BarberProduct,
  BlockedTime,
  BusinessHours,
  Customer,
  MonthlyPackage,
  Professional,
  Review,
  Service,
  ShopSettings,
  UserAccount,
} from '../types';
import {
  INITIAL_BLOCKED_TIMES,
  INITIAL_BUSINESS_HOURS,
  INITIAL_CUSTOMERS,
  INITIAL_PACKAGES,
  INITIAL_PRODUCTS,
  INITIAL_PROFESSIONALS,
  INITIAL_REVIEWS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_SYSTEM_USERS,
  getInitialAppointments,
} from '../data/initialData';

// Firestore collection names
export const COLLECTIONS = {
  APPOINTMENTS: 'appointments',
  SERVICES: 'services',
  PROFESSIONALS: 'professionals',
  CUSTOMERS: 'customers',
  PACKAGES: 'packages',
  PRODUCTS: 'products',
  SETTINGS: 'settings',
  BUSINESS_HOURS: 'business_hours',
  BLOCKED_TIMES: 'blocked_times',
  REVIEWS: 'reviews',
  USERS: 'users',
};

// Seed initial documents to Firestore if empty
export async function seedFirestoreIfEmpty() {
  try {
    // Check if services exist
    const srvSnap = await getDocs(collection(db, COLLECTIONS.SERVICES));
    if (srvSnap.empty) {
      console.log('Seeding initial data into Firebase Firestore...');
      const batch = writeBatch(db);

      // Seed Services
      INITIAL_SERVICES.forEach((s) => {
        const ref = doc(db, COLLECTIONS.SERVICES, s.id);
        batch.set(ref, s);
      });

      // Seed Professionals
      INITIAL_PROFESSIONALS.forEach((p) => {
        const ref = doc(db, COLLECTIONS.PROFESSIONALS, p.id);
        batch.set(ref, p);
      });

      // Seed Packages
      INITIAL_PACKAGES.forEach((pkg) => {
        const ref = doc(db, COLLECTIONS.PACKAGES, pkg.id);
        batch.set(ref, pkg);
      });

      // Seed Products
      INITIAL_PRODUCTS.forEach((prod) => {
        const ref = doc(db, COLLECTIONS.PRODUCTS, prod.id);
        batch.set(ref, prod);
      });

      // Seed Settings
      batch.set(doc(db, COLLECTIONS.SETTINGS, 'main_settings'), INITIAL_SETTINGS);

      // Seed Business Hours
      batch.set(doc(db, COLLECTIONS.BUSINESS_HOURS, 'weekly_schedule'), INITIAL_BUSINESS_HOURS);

      // Seed Customers
      INITIAL_CUSTOMERS.forEach((c) => {
        batch.set(doc(db, COLLECTIONS.CUSTOMERS, c.id), c);
      });

      // Seed Appointments
      getInitialAppointments().forEach((a) => {
        batch.set(doc(db, COLLECTIONS.APPOINTMENTS, a.id), a);
      });

      // Seed Reviews
      INITIAL_REVIEWS.forEach((r) => {
        batch.set(doc(db, COLLECTIONS.REVIEWS, r.id), r);
      });

      // Seed Blocked Times
      INITIAL_BLOCKED_TIMES.forEach((b) => {
        batch.set(doc(db, COLLECTIONS.BLOCKED_TIMES, b.id), b);
      });

      await batch.commit();
      console.log('Firebase Firestore successfully populated with initial barbershop records!');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_data');
  }
}

// Save or Update Appointment in Firestore
export async function saveAppointmentToFirestore(appointment: Appointment): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.APPOINTMENTS, appointment.id);
    await setDoc(ref, appointment, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `appointments/${appointment.id}`);
    return false;
  }
}

// Update Appointment Status in Firestore
export async function updateAppointmentInFirestore(
  appointmentId: string,
  data: Partial<Appointment>
): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
    await updateDoc(ref, data);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
    return false;
  }
}

// Delete Appointment in Firestore
export async function deleteAppointmentFromFirestore(appointmentId: string): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.APPOINTMENTS, appointmentId);
    await deleteDoc(ref);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `appointments/${appointmentId}`);
    return false;
  }
}

// Save Customer to Firestore
export async function saveCustomerToFirestore(customer: Customer): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.CUSTOMERS, customer.id);
    await setDoc(ref, customer, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `customers/${customer.id}`);
    return false;
  }
}

// Save Service
export async function saveServiceToFirestore(service: Service): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.SERVICES, service.id);
    await setDoc(ref, service, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `services/${service.id}`);
    return false;
  }
}

// Delete Service
export async function deleteServiceFromFirestore(serviceId: string): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.SERVICES, serviceId);
    await deleteDoc(ref);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `services/${serviceId}`);
    return false;
  }
}

// Save Professional
export async function saveProfessionalToFirestore(professional: Professional): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.PROFESSIONALS, professional.id);
    await setDoc(ref, professional, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `professionals/${professional.id}`);
    return false;
  }
}

// Save Settings
export async function saveSettingsToFirestore(settings: ShopSettings): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.SETTINGS, 'main_settings');
    await setDoc(ref, settings, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/main_settings');
    return false;
  }
}

// Save Business Hours
export async function saveBusinessHoursToFirestore(hours: BusinessHours): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.BUSINESS_HOURS, 'weekly_schedule');
    await setDoc(ref, hours, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'business_hours/weekly_schedule');
    return false;
  }
}

// Save Blocked Time
export async function saveBlockedTimeToFirestore(blockedTime: BlockedTime): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.BLOCKED_TIMES, blockedTime.id);
    await setDoc(ref, blockedTime, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `blocked_times/${blockedTime.id}`);
    return false;
  }
}

// Delete Blocked Time
export async function deleteBlockedTimeFromFirestore(blockedId: string): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.BLOCKED_TIMES, blockedId);
    await deleteDoc(ref);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `blocked_times/${blockedId}`);
    return false;
  }
}

// Save Package
export async function savePackageToFirestore(pkg: MonthlyPackage): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.PACKAGES, pkg.id);
    await setDoc(ref, pkg, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `packages/${pkg.id}`);
    return false;
  }
}

// Save Product
export async function saveProductToFirestore(product: BarberProduct): Promise<boolean> {
  try {
    const ref = doc(db, COLLECTIONS.PRODUCTS, product.id);
    await setDoc(ref, product, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
    return false;
  }
}

// Firebase Auth - Sign in with Google popup
export async function firebaseGoogleSignIn(): Promise<{ user?: any; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (err: any) {
    console.warn('Firebase popup signin result:', err?.message);
    return { error: err?.message };
  }
}

// Firebase Auth - Sign out
export async function firebaseSignOut(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.warn('Firebase signout error:', err);
  }
}
