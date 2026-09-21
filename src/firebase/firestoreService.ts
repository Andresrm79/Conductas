import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth, googleAuthProvider } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  BehaviorType,
  ClassConductConfig,
  ClassStudent,
  Incident,
  LateArrival,
  LateArrivalConfig,
  PositiveBehavior,
  SchoolClass,
  UserProfile,
} from '../types';
import { INITIAL_CLASSES, INITIAL_INCIDENTS, INITIAL_PROFILES } from '../data/mockData';
import { INITIAL_POSITIVES, INITIAL_STUDENTS } from '../data/mockStudents';
import { INITIAL_BEHAVIOR_TYPES } from '../data/mockBehaviorTypes';
import { INITIAL_LATE_ARRIVALS, DEFAULT_LATE_CONFIG } from '../data/mockLateArrivals';

// Collection Paths
export const COLLECTIONS = {
  INCIDENTS: 'incidents',
  CLASSES: 'classes',
  STUDENTS: 'students',
  POSITIVES: 'positives',
  BEHAVIOR_TYPES: 'behaviorTypes',
  PROFILES: 'profiles',
  LATE_ARRIVALS: 'lateArrivals',
  CLASS_CONFIGS: 'classConductConfigs',
  CONFIG: 'config',
};

// Auth API
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const credential = await signInWithPopup(auth, googleAuthProvider);
    return credential.user;
  } catch (err) {
    console.error('Error signing in with Google:', err);
    throw err;
  }
}

export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out:', err);
    throw err;
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Check & Seed Initial Database if empty
export async function seedInitialFirestoreDataIfEmpty(): Promise<boolean> {
  const path = COLLECTIONS.CLASSES;
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      return false; // Already contains data
    }

    console.log('Seeding initial educational center data into Firebase Firestore...');
    const batch = writeBatch(db);

    // Classes
    INITIAL_CLASSES.forEach((c) => {
      batch.set(doc(db, COLLECTIONS.CLASSES, c.id), cleanForFirestore(c));
    });

    // Students
    INITIAL_STUDENTS.forEach((st) => {
      batch.set(doc(db, COLLECTIONS.STUDENTS, st.id), cleanForFirestore(st));
    });

    // Incidents
    INITIAL_INCIDENTS.forEach((inc) => {
      batch.set(doc(db, COLLECTIONS.INCIDENTS, inc.id), cleanForFirestore(inc));
    });

    // Positives
    INITIAL_POSITIVES.forEach((pos) => {
      batch.set(doc(db, COLLECTIONS.POSITIVES, pos.id), cleanForFirestore(pos));
    });

    // Behavior types
    INITIAL_BEHAVIOR_TYPES.forEach((bt) => {
      batch.set(doc(db, COLLECTIONS.BEHAVIOR_TYPES, bt.id), cleanForFirestore(bt));
    });

    // Profiles
    INITIAL_PROFILES.forEach((p) => {
      batch.set(doc(db, COLLECTIONS.PROFILES, p.id), cleanForFirestore(p));
    });

    // Late arrivals
    INITIAL_LATE_ARRIVALS.forEach((la) => {
      batch.set(doc(db, COLLECTIONS.LATE_ARRIVALS, la.id), cleanForFirestore(la));
    });

    // Late Config
    batch.set(doc(db, COLLECTIONS.CONFIG, 'lateArrivals'), {
      id: 'lateArrivals',
      ...cleanForFirestore(DEFAULT_LATE_CONFIG),
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();
    console.log('Firebase successfully seeded with initial school data!');
    return true;
  } catch (err) {
    console.warn('Note: Seeding check encountered an issue (check auth permissions):', err);
    return false;
  }
}

// Real-time Subscriptions with Mandatory Error Handling
export function subscribeToIncidents(
  onData: (items: Incident[]) => void
): Unsubscribe {
  const path = COLLECTIONS.INCIDENTS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: Incident[] = [];
      snapshot.forEach((d) => items.push(d.data() as Incident));
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToClasses(
  onData: (items: SchoolClass[]) => void
): Unsubscribe {
  const path = COLLECTIONS.CLASSES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: SchoolClass[] = [];
      snapshot.forEach((d) => items.push(d.data() as SchoolClass));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToStudents(
  onData: (items: ClassStudent[]) => void
): Unsubscribe {
  const path = COLLECTIONS.STUDENTS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: ClassStudent[] = [];
      snapshot.forEach((d) => items.push(d.data() as ClassStudent));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToPositives(
  onData: (items: PositiveBehavior[]) => void
): Unsubscribe {
  const path = COLLECTIONS.POSITIVES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: PositiveBehavior[] = [];
      snapshot.forEach((d) => items.push(d.data() as PositiveBehavior));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToBehaviorTypes(
  onData: (items: BehaviorType[]) => void
): Unsubscribe {
  const path = COLLECTIONS.BEHAVIOR_TYPES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: BehaviorType[] = [];
      snapshot.forEach((d) => items.push(d.data() as BehaviorType));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToProfiles(
  onData: (items: UserProfile[]) => void
): Unsubscribe {
  const path = COLLECTIONS.PROFILES;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: UserProfile[] = [];
      snapshot.forEach((d) => items.push(d.data() as UserProfile));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToLateArrivals(
  onData: (items: LateArrival[]) => void
): Unsubscribe {
  const path = COLLECTIONS.LATE_ARRIVALS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: LateArrival[] = [];
      snapshot.forEach((d) => items.push(d.data() as LateArrival));
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToClassConductConfigs(
  onData: (items: Record<string, ClassConductConfig>) => void
): Unsubscribe {
  const path = COLLECTIONS.CLASS_CONFIGS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const map: Record<string, ClassConductConfig> = {};
      snapshot.forEach((d) => {
        const item = d.data() as ClassConductConfig;
        if (item.className) {
          map[item.className] = item;
        }
      });
      onData(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToCenterConfig(
  onData: (config: LateArrivalConfig) => void
): Unsubscribe {
  const path = COLLECTIONS.CONFIG;
  return onSnapshot(
    doc(db, path, 'lateArrivals'),
    (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.data();
        onData({
          warningThreshold: d.warningThreshold ?? DEFAULT_LATE_CONFIG.warningThreshold,
          notifyFamilyOnThreshold: d.notifyFamilyOnThreshold ?? DEFAULT_LATE_CONFIG.notifyFamilyOnThreshold,
          defaultExpectedTime: d.defaultExpectedTime ?? DEFAULT_LATE_CONFIG.defaultExpectedTime,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Strips undefined properties recursively so Firestore setDoc does not throw
 * "Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

// Firestore Mutation Operations
export async function saveIncidentToFirebase(incident: Incident): Promise<void> {
  const path = `${COLLECTIONS.INCIDENTS}/${incident.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.INCIDENTS, incident.id), cleanForFirestore(incident));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteIncidentFromFirebase(incidentId: string): Promise<void> {
  const path = `${COLLECTIONS.INCIDENTS}/${incidentId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.INCIDENTS, incidentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveClassToFirebase(schoolClass: SchoolClass): Promise<void> {
  const path = `${COLLECTIONS.CLASSES}/${schoolClass.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CLASSES, schoolClass.id), cleanForFirestore(schoolClass));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteClassFromFirebase(classId: string): Promise<void> {
  const path = `${COLLECTIONS.CLASSES}/${classId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CLASSES, classId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveStudentToFirebase(student: ClassStudent): Promise<void> {
  const path = `${COLLECTIONS.STUDENTS}/${student.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), cleanForFirestore(student));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromFirebase(studentId: string): Promise<void> {
  const path = `${COLLECTIONS.STUDENTS}/${studentId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function savePositiveToFirebase(positive: PositiveBehavior): Promise<void> {
  const path = `${COLLECTIONS.POSITIVES}/${positive.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.POSITIVES, positive.id), cleanForFirestore(positive));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deletePositiveFromFirebase(positiveId: string): Promise<void> {
  const path = `${COLLECTIONS.POSITIVES}/${positiveId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.POSITIVES, positiveId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveBehaviorTypeToFirebase(bType: BehaviorType): Promise<void> {
  const path = `${COLLECTIONS.BEHAVIOR_TYPES}/${bType.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.BEHAVIOR_TYPES, bType.id), cleanForFirestore(bType));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteBehaviorTypeFromFirebase(typeId: string): Promise<void> {
  const path = `${COLLECTIONS.BEHAVIOR_TYPES}/${typeId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.BEHAVIOR_TYPES, typeId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveProfileToFirebase(profile: UserProfile): Promise<void> {
  const path = `${COLLECTIONS.PROFILES}/${profile.id}`;
  try {
    const raw: Record<string, any> = {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      avatarColor: profile.avatarColor,
      password: profile.password || '1234',
      allowedClasses: profile.allowedClasses || ['ALL'],
    };
    if (profile.subject && profile.subject.trim()) {
      raw.subject = profile.subject.trim();
    }
    if (profile.course && profile.course.trim()) {
      raw.course = profile.course.trim();
    }
    const clean = cleanForFirestore(raw);
    await setDoc(doc(db, COLLECTIONS.PROFILES, profile.id), clean);
    console.log(`[Firestore] Profile "${profile.name}" (${profile.id}) successfully persisted.`);
  } catch (err) {
    console.error(`[Firestore] Error saving profile "${profile.name}":`, err);
    handleFirestoreError(err, OperationType.WRITE, path);
    throw err;
  }
}

export async function deleteProfileFromFirebase(profileId: string): Promise<void> {
  const path = `${COLLECTIONS.PROFILES}/${profileId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PROFILES, profileId));
    console.log(`[Firestore] Profile "${profileId}" deleted from Firebase.`);
  } catch (err) {
    console.error(`[Firestore] Error deleting profile "${profileId}":`, err);
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export async function saveLateArrivalToFirebase(arrival: LateArrival): Promise<void> {
  const path = `${COLLECTIONS.LATE_ARRIVALS}/${arrival.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.LATE_ARRIVALS, arrival.id), cleanForFirestore(arrival));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteLateArrivalFromFirebase(arrivalId: string): Promise<void> {
  const path = `${COLLECTIONS.LATE_ARRIVALS}/${arrivalId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.LATE_ARRIVALS, arrivalId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveClassConductConfigToFirebase(config: ClassConductConfig): Promise<void> {
  // Sanitize className for document ID with safe alphanumeric string
  const docId = 'cfg_' + config.className.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const path = `${COLLECTIONS.CLASS_CONFIGS}/${docId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CLASS_CONFIGS, docId), {
      ...cleanForFirestore(config),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function batchSaveIncidentsToFirebase(incidents: Incident[]): Promise<void> {
  const path = COLLECTIONS.INCIDENTS;
  try {
    const batch = writeBatch(db);
    incidents.forEach((inc) => {
      batch.set(doc(db, COLLECTIONS.INCIDENTS, inc.id), cleanForFirestore(inc));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function resetFirebaseToInitialData(): Promise<void> {
  const path = COLLECTIONS.INCIDENTS;
  try {
    const batch = writeBatch(db);
    INITIAL_INCIDENTS.forEach((inc) => {
      batch.set(doc(db, COLLECTIONS.INCIDENTS, inc.id), inc);
    });
    INITIAL_LATE_ARRIVALS.forEach((la) => {
      batch.set(doc(db, COLLECTIONS.LATE_ARRIVALS, la.id), la);
    });
    batch.set(doc(db, COLLECTIONS.CONFIG, 'lateArrivals'), {
      id: 'lateArrivals',
      ...DEFAULT_LATE_CONFIG,
      updatedAt: new Date().toISOString(),
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveCenterLateConfigToFirebase(config: LateArrivalConfig): Promise<void> {
  const path = `${COLLECTIONS.CONFIG}/lateArrivals`;
  try {
    await setDoc(doc(db, COLLECTIONS.CONFIG, 'lateArrivals'), {
      id: 'lateArrivals',
      ...config,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
