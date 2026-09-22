import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { IncidentList } from './components/IncidentList';
import { DirectivoDashboard } from './components/DirectivoDashboard';
import { StudentListTab } from './components/StudentListTab';
import { ClassSelectionScreen } from './components/ClassSelectionScreen';
import { ClassAppView } from './components/ClassAppView';
import { NewIncidentModal } from './components/NewIncidentModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { DirectivoHeader, DirectivoNavigationTab } from './components/DirectivoHeader';
import { ClassroomConductTracking } from './components/ClassroomConductTracking';
import { ConductStatisticsDashboard } from './components/ConductStatisticsDashboard';
import { LateArrivalsRegistry } from './components/LateArrivalsRegistry';
import { LateArrivalModal } from './components/LateArrivalModal';
import { LateConfigModal } from './components/LateConfigModal';
import { DirectivoAuthModal } from './components/DirectivoAuthModal';
import {
  ClassStudent,
  Incident,
  IncidentStatus,
  PositiveBehavior,
  SchoolClass,
  UserProfile,
  BehaviorType,
  LateArrival,
  LateArrivalConfig,
  TutorParteConfirmation,
} from './types';
import {
  getStoredIncidents,
  saveIncidents,
  getStoredUser,
  saveStoredUser,
  resetToSampleData,
  getStoredClasses,
  saveStoredClasses,
  getStoredActiveClass,
  saveStoredActiveClass,
  getStoredStudents,
  saveStoredStudents,
  getStoredPositives,
  saveStoredPositives,
  getStoredBehaviorTypes,
  saveStoredBehaviorTypes,
  getStoredLateArrivals,
  saveStoredLateArrivals,
  getStoredLateArrivalConfig,
  saveStoredLateArrivalConfig,
  getStoredProfiles,
  saveStoredProfiles,
  saveStoredTutorConfirmation,
  isUserAuthorizedForClass,
} from './utils/storage';
import { exportIncidentsToExcel } from './utils/excelHelper';
import { INITIAL_PROFILES, DIRECTIVO_GLOBAL_PASSWORD } from './data/mockData';
import { DirectivoUsersConfigTab } from './components/DirectivoUsersConfigTab';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UserLoginModal } from './components/UserLoginModal';
import { TutorParteAlertModal } from './components/TutorParteAlertModal';
import { CreateClassModal } from './components/CreateClassModal';
import { EditClassModal } from './components/EditClassModal';
import { AppLoginScreen } from './components/AppLoginScreen';
import { CheckCircle2, AlertTriangle, Plus, FileSpreadsheet, LayoutGrid, Clock, FileCheck, ShieldAlert } from 'lucide-react';
import {
  subscribeToIncidents,
  subscribeToClasses,
  subscribeToStudents,
  subscribeToPositives,
  subscribeToBehaviorTypes,
  subscribeToProfiles,
  subscribeToLateArrivals,
  subscribeToCenterConfig,
  seedInitialFirestoreDataIfEmpty,
  saveIncidentToFirebase,
  deleteIncidentFromFirebase,
  saveClassToFirebase,
  deleteClassFromFirebase,
  saveStudentToFirebase,
  deleteStudentFromFirebase,
  savePositiveToFirebase,
  deletePositiveFromFirebase,
  batchDeleteIncidentsFromFirebase,
  batchDeletePositivesFromFirebase,
  saveBehaviorTypeToFirebase,
  deleteBehaviorTypeFromFirebase,
  saveProfileToFirebase,
  deleteProfileFromFirebase,
  saveLateArrivalToFirebase,
  deleteLateArrivalFromFirebase,
  saveCenterLateConfigToFirebase,
  batchSaveIncidentsToFirebase,
  resetFirebaseToInitialData,
} from './firebase/firestoreService';
import { testConnection } from './firebase/config';
import { FirebaseSyncBanner } from './components/FirebaseSyncBanner';

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>(() => getStoredIncidents());
  const [classes, setClasses] = useState<SchoolClass[]>(() => getStoredClasses());
  const [students, setStudents] = useState<ClassStudent[]>(() => getStoredStudents());
  const [positives, setPositives] = useState<PositiveBehavior[]>(() => getStoredPositives());
  const [behaviorTypes, setBehaviorTypes] = useState<BehaviorType[]>(() => getStoredBehaviorTypes());
  const [profiles, setProfiles] = useState<UserProfile[]>(() => getStoredProfiles());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getStoredUser());
  const [activeTab, setActiveTab] = useState<'incidencias' | 'directivo' | 'alumnos'>('incidencias');

  // Firebase Cloud Synchronization State (conductas-2c546)
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Authentication Gate State - strictly requires user password before revealing any profiles or classes
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('aula_conductas_auth_session') === 'true';
    } catch {
      return false;
    }
  });
  
  // Dirección Mode & Navigation
  const [isDirectivoMode, setIsDirectivoMode] = useState<boolean>(() => getStoredUser().role === 'Directivo');
  const [directivoNavTab, setDirectivoNavTab] = useState<DirectivoNavigationTab>('seguimiento_aula');
  const [directivoClassFilter, setDirectivoClassFilter] = useState<string>('ALL');
  const [isDirectivoAuthModalOpen, setIsDirectivoAuthModalOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [isUserLoginModalOpen, setIsUserLoginModalOpen] = useState<boolean>(false);
  const [targetUserForLogin, setTargetUserForLogin] = useState<UserProfile | null>(null);

  // Late Arrivals (Retrasos) State
  const [lateArrivals, setLateArrivals] = useState<LateArrival[]>(() => getStoredLateArrivals());
  const [lateConfig, setLateConfig] = useState<LateArrivalConfig>(() => getStoredLateArrivalConfig());
  const [isLateArrivalModalOpen, setIsLateArrivalModalOpen] = useState<boolean>(false);
  const [isLateConfigModalOpen, setIsLateConfigModalOpen] = useState<boolean>(false);
  const [latePrefillClass, setLatePrefillClass] = useState<string | undefined>(undefined);
  const [latePrefillStudent, setLatePrefillStudent] = useState<string | undefined>(undefined);

  // Active unlocked class (null means we show the initial classroom selection screen)
  const [activeClass, setActiveClass] = useState<string | null>(() => getStoredActiveClass());

  // Modals
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [prefilledStudentName, setPrefilledStudentName] = useState<string | undefined>(undefined);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [isTutorAlertModalOpen, setIsTutorAlertModalOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Firebase Real-time Synchronization Lifecycles
  useEffect(() => {
    setIsSyncing(true);

    // Verify Firestore connection and seed data in project conductas-2c546 if first time
    testConnection().then((connected) => {
      console.log('Firebase connection verified:', connected);
    });

    seedInitialFirestoreDataIfEmpty()
      .catch((err) => console.log('Firebase seed check:', err))
      .finally(() => setIsSyncing(false));

    const unsubs: (() => void)[] = [];

    // Real-time Firestore Subscriptions for all datasets from conductas-2c546
    unsubs.push(
      subscribeToIncidents((data) => {
        if (data && data.length > 0) {
          let deletedSet = new Set<string>();
          try {
            const rawDeleted = localStorage.getItem('aula_conductas_deleted_students_v1');
            if (rawDeleted) {
              deletedSet = new Set<string>(JSON.parse(rawDeleted));
            }
          } catch {}

          const filtered = data.filter(
            (inc) =>
              !deletedSet.has(
                `${inc.studentGroup.toLowerCase()}__${inc.studentName.trim().toLowerCase()}`
              )
          );
          setIncidents(filtered);
          try {
            localStorage.setItem('aula_conductas_incidencias_v1', JSON.stringify(filtered));
          } catch {}
        }
      })
    );

    unsubs.push(
      subscribeToClasses((data) => {
        if (data && data.length > 0) {
          setClasses(data);
          try {
            localStorage.setItem('aula_conductas_classes_v1', JSON.stringify(data));
          } catch {}
        }
      })
    );

    unsubs.push(
      subscribeToStudents((data) => {
        if (data && data.length > 0) {
          let deletedSet = new Set<string>();
          try {
            const rawDeleted = localStorage.getItem('aula_conductas_deleted_students_v1');
            if (rawDeleted) {
              deletedSet = new Set<string>(JSON.parse(rawDeleted));
            }
          } catch {}

          const cleaned = data.filter(
            (s) =>
              !deletedSet.has(s.id) &&
              !deletedSet.has(`${s.className.toLowerCase()}__${s.name.trim().toLowerCase()}`)
          );
          setStudents(cleaned);
          try {
            localStorage.setItem('aula_conductas_students_v1', JSON.stringify(cleaned));
          } catch {}
        }
      })
    );

    unsubs.push(
      subscribeToPositives((data) => {
        if (data && data.length > 0) {
          let deletedSet = new Set<string>();
          try {
            const rawDeleted = localStorage.getItem('aula_conductas_deleted_students_v1');
            if (rawDeleted) {
              deletedSet = new Set<string>(JSON.parse(rawDeleted));
            }
          } catch {}

          const filtered = data.filter(
            (pos) =>
              !deletedSet.has(
                `${pos.studentGroup.toLowerCase()}__${pos.studentName.trim().toLowerCase()}`
              )
          );
          setPositives(filtered);
          try {
            localStorage.setItem('aula_conductas_positives_v1', JSON.stringify(filtered));
          } catch {}
        }
      })
    );

    unsubs.push(
      subscribeToBehaviorTypes((data) => {
        if (data && data.length > 0) {
          setBehaviorTypes(data);
          try {
            localStorage.setItem('aula_conductas_behavior_types_v1', JSON.stringify(data));
          } catch {}
        }
      })
    );

    unsubs.push(
      subscribeToProfiles((firebaseData) => {
        if (firebaseData && firebaseData.length > 0) {
          // Check if local cache has any profiles created previously that aren't yet in Firestore
          const localProfiles = getStoredProfiles();
          const missingInCloud = localProfiles.filter(
            (lp) => !firebaseData.some((fp) => fp.id === lp.id)
          );

          if (missingInCloud.length > 0) {
            // Upload missing profiles to Firestore so they are never lost
            missingInCloud.forEach((p) => {
              saveProfileToFirebase(p).catch((err) =>
                console.warn('Syncing missing local profile to Firebase:', err)
              );
            });
            const merged = [...firebaseData, ...missingInCloud];
            setProfiles(merged);
            try {
              localStorage.setItem('aula_conductas_profiles_v2', JSON.stringify(merged));
            } catch {}
          } else {
            setProfiles(firebaseData);
            try {
              localStorage.setItem('aula_conductas_profiles_v2', JSON.stringify(firebaseData));
            } catch {}
          }
        }
      })
    );

    unsubs.push(
      subscribeToLateArrivals((data) => {
        if (data && data.length > 0) {
          setLateArrivals(data);
          try {
            localStorage.setItem('aula_conductas_late_arrivals_v1', JSON.stringify(data));
          } catch {}
        }
      })
    );

    unsubs.push(
      subscribeToCenterConfig((data) => {
        if (data) {
          setLateConfig(data);
          try {
            localStorage.setItem('aula_conductas_late_config_v1', JSON.stringify(data));
          } catch {}
        }
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      await testConnection();
      showToast('Sincronización con Firebase (conductas-2c546) actualizada.');
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // User Profile Handlers for Dirección (Pestaña Perfiles de Acceso)
  const handleUpdateUser = async (updatedUser: UserProfile) => {
    const nextProfiles = profiles.map((p) => (p.id === updatedUser.id ? updatedUser : p));
    setProfiles(nextProfiles);
    saveStoredProfiles(nextProfiles);
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      saveStoredUser(updatedUser);
    }
    try {
      await saveProfileToFirebase(updatedUser);
      showToast(`Perfil de "${updatedUser.name}" guardado en Firebase.`);
    } catch (e) {
      console.error('Error saving updated profile to Firebase:', e);
      showToast(`Perfil de "${updatedUser.name}" actualizado.`);
    }
  };

  const handleAddUser = async (newUser: UserProfile) => {
    const nextProfiles = [...profiles, newUser];
    setProfiles(nextProfiles);
    saveStoredProfiles(nextProfiles);
    try {
      await saveProfileToFirebase(newUser);
      showToast(`✓ Docente "${newUser.name}" registrado y guardado en Firebase.`);
    } catch (e) {
      console.error('Error saving new profile to Firebase:', e);
      showToast(`Docente "${newUser.name}" añadido.`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = profiles.find((p) => p.id === userId);
    if (!userToDelete) return;
    if (userToDelete.id === currentUser.id) {
      showToast('No puedes eliminar tu propio usuario en sesión activa.');
      return;
    }
    const nextProfiles = profiles.filter((p) => p.id !== userId);
    setProfiles(nextProfiles);
    saveStoredProfiles(nextProfiles);
    try {
      await deleteProfileFromFirebase(userId);
      showToast(`Usuario "${userToDelete.name}" eliminado de Firebase.`);
    } catch (e) {
      console.error('Error deleting profile from Firebase:', e);
      showToast(`Usuario "${userToDelete.name}" eliminado del centro.`);
    }
  };

  const handleResetUserPassword = async (userId: string) => {
    const target = profiles.find((p) => p.id === userId);
    if (!target) return;
    const updated: UserProfile = {
      ...target,
      password: '1234',
    };
    const nextProfiles = profiles.map((p) => (p.id === userId ? updated : p));
    setProfiles(nextProfiles);
    saveStoredProfiles(nextProfiles);
    if (currentUser.id === userId) {
      setCurrentUser(updated);
      saveStoredUser(updated);
    }
    try {
      await saveProfileToFirebase(updated);
    } catch (e) {
      console.error('Error updating reset password in Firebase:', e);
    }
    showToast(`🔑 Contraseña de "${target.name}" reseteada a la clave genérica: 1234.`);
  };

  // Sync incidents to local storage
  const handleUpdateIncidents = (newIncidents: Incident[]) => {
    setIncidents(newIncidents);
    saveIncidents(newIncidents);
  };

  // Handle class unlocked from initial screen
  const handleClassUnlocked = (target: SchoolClass | 'ALL') => {
    const className = target === 'ALL' ? 'Vista Global' : target.name;
    setActiveClass(className);
    saveStoredActiveClass(className);
    showToast(`Acceso concedido a la app de: ${className}`);
  };

  // Handle returning to class selection screen
  const handleChangeClass = () => {
    setActiveClass(null);
    saveStoredActiveClass(null);
    showToast('Has regresado al portal inicial de aulas.');
  };

  // Add new class
  const handleAddClass = (newClass: SchoolClass) => {
    const next = [...classes, newClass];
    setClasses(next);
    saveStoredClasses(next);
    showToast(`Nueva clase "${newClass.name}" añadida correctamente.`);
  };

  // Update existing class data
  const handleUpdateClass = (updatedClass: SchoolClass) => {
    const previousClass = classes.find((c) => c.id === updatedClass.id);
    const nextClasses = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setClasses(nextClasses);
    saveStoredClasses(nextClasses);

    // If class name changed, propagate to students, incidents and positives
    if (previousClass && previousClass.name.toLowerCase() !== updatedClass.name.toLowerCase()) {
      const oldName = previousClass.name.toLowerCase();
      const newName = updatedClass.name;

      const nextStudents = students.map((st) =>
        st.className.toLowerCase() === oldName ? { ...st, className: newName } : st
      );
      setStudents(nextStudents);
      saveStoredStudents(nextStudents);

      const nextIncidents = incidents.map((inc) =>
        inc.studentGroup.toLowerCase() === oldName ? { ...inc, studentGroup: newName } : inc
      );
      setIncidents(nextIncidents);
      saveIncidents(nextIncidents);

      const nextPositives = positives.map((pos) =>
        pos.studentGroup.toLowerCase() === oldName ? { ...pos, studentGroup: newName } : pos
      );
      setPositives(nextPositives);
      saveStoredPositives(nextPositives);

      if (activeClass && activeClass.toLowerCase() === oldName) {
        setActiveClass(newName);
        saveStoredActiveClass(newName);
      }
    }

    showToast(`Datos de la clase "${updatedClass.name}" actualizados.`);
  };

  // Toggle class visibility (hide or unhide unused classrooms)
  const handleToggleHideClass = (classId: string) => {
    const target = classes.find((c) => c.id === classId);
    if (!target) return;
    const nextHidden = !target.isHidden;
    const nextClasses = classes.map((c) =>
      c.id === classId ? { ...c, isHidden: nextHidden } : c
    );
    setClasses(nextClasses);
    saveStoredClasses(nextClasses);
    showToast(
      nextHidden
        ? `Aula "${target.name}" ocultada (no se muestra en uso activo).`
        : `Aula "${target.name}" reactivada con éxito.`
    );
  };

  // Delete a class and optionally its members
  const handleDeleteClass = (classId: string) => {
    const classToDelete = classes.find((c) => c.id === classId);
    if (!classToDelete) return;

    const className = classToDelete.name;
    const nextClasses = classes.filter((c) => c.id !== classId);
    setClasses(nextClasses);
    saveStoredClasses(nextClasses);

    // Remove associated students
    const nextStudents = students.filter((s) => s.className.toLowerCase() !== className.toLowerCase());
    setStudents(nextStudents);
    saveStoredStudents(nextStudents);

    // Clean up active class if current
    if (activeClass && activeClass.toLowerCase() === className.toLowerCase()) {
      setActiveClass(null);
      saveStoredActiveClass(null);
    }

    deleteClassFromFirebase(classId).catch((err) => console.log('Firebase delete class notice:', err));
    showToast(`Clase "${className}" eliminada correctamente.`);
  };

  // Update a class password
  const handleUpdateClassPassword = (classId: string, newPass: string) => {
    const next = classes.map((c) => (c.id === classId ? { ...c, password: newPass } : c));
    setClasses(next);
    saveStoredClasses(next);
  };

  // Save positive behavior points
  const handleSavePositive = (posData: Omit<PositiveBehavior, 'id'>) => {
    const newPos: PositiveBehavior = {
      ...posData,
      id: `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const nextPos = [newPos, ...positives];
    setPositives(nextPos);
    saveStoredPositives(nextPos);

    // Update positive count on student
    const nextStudents = students.map((s) => {
      if (s.name.toLowerCase() === posData.studentName.toLowerCase()) {
        return { ...s, positivePoints: (s.positivePoints || 0) + posData.points };
      }
      return s;
    });
    setStudents(nextStudents);
    saveStoredStudents(nextStudents);

    showToast(`⭐ Felicitación registrada para ${posData.studentName} (+${posData.points} pts)`);
  };

  // Add student to class
  const handleAddStudent = (studentData: Omit<ClassStudent, 'id'>) => {
    const newSt: ClassStudent = {
      ...studentData,
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    // Remove from deleted set if re-adding
    try {
      const rawDeleted = localStorage.getItem('aula_conductas_deleted_students_v1');
      if (rawDeleted) {
        const deletedList: string[] = JSON.parse(rawDeleted);
        const nameClassKey = `${studentData.className.toLowerCase()}__${studentData.name.trim().toLowerCase()}`;
        const filtered = deletedList.filter((k) => k !== newSt.id && k !== nameClassKey);
        localStorage.setItem('aula_conductas_deleted_students_v1', JSON.stringify(filtered));
      }
    } catch {}

    const nextSt = [...students, newSt];
    setStudents(nextSt);
    saveStoredStudents(nextSt);
    saveStudentToFirebase(newSt).catch((err) => console.log('Firebase save student notice:', err));
    showToast(`Alumno "${studentData.name}" incorporado a ${studentData.className}.`);
  };

  // Update existing student
  const handleUpdateStudent = (updatedStudent: ClassStudent) => {
    const oldStudent = students.find((s) => s.id === updatedStudent.id);
    const nextStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(nextStudents);
    saveStoredStudents(nextStudents);
    saveStudentToFirebase(updatedStudent).catch((err) => console.log('Firebase update student notice:', err));

    // If student's name changed, synchronize with incidents and positives
    if (oldStudent && oldStudent.name.toLowerCase() !== updatedStudent.name.toLowerCase()) {
      const oldName = oldStudent.name.toLowerCase();
      const newName = updatedStudent.name;

      const nextInc = incidents.map((inc) =>
        inc.studentName.toLowerCase() === oldName ? { ...inc, studentName: newName } : inc
      );
      setIncidents(nextInc);
      saveIncidents(nextInc);

      const nextPos = positives.map((p) =>
        p.studentName.toLowerCase() === oldName ? { ...p, studentName: newName } : p
      );
      setPositives(nextPos);
      saveStoredPositives(nextPos);
    }

    showToast(`Datos del alumno "${updatedStudent.name}" actualizados.`);
  };

  // Delete student and all associated incident records
  const handleDeleteStudent = (studentId: string) => {
    const stToDelete = students.find((s) => s.id === studentId);
    const targetName = (stToDelete?.name || '').trim().toLowerCase();
    const targetClass = (stToDelete?.className || '').trim().toLowerCase();

    // 1. Remove student from list
    const nextStudents = students.filter((s) => s.id !== studentId);
    setStudents(nextStudents);
    saveStoredStudents(nextStudents);

    // Track deleted student so real-time sync or fallback does not restore it
    try {
      const rawDeleted = localStorage.getItem('aula_conductas_deleted_students_v1');
      const deletedList: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];
      if (!deletedList.includes(studentId)) {
        deletedList.push(studentId);
      }
      if (targetName && targetClass) {
        const key = `${targetClass}__${targetName}`;
        if (!deletedList.includes(key)) {
          deletedList.push(key);
        }
      }
      localStorage.setItem('aula_conductas_deleted_students_v1', JSON.stringify(deletedList));
    } catch {}

    deleteStudentFromFirebase(studentId).catch((err) => console.log('Firebase delete student notice:', err));

    // 2. Identify and delete all incidents associated with this student
    if (targetName) {
      const incidentsToDelete = incidents.filter((inc) => {
        const matchName = inc.studentName.trim().toLowerCase() === targetName;
        const matchClass = !targetClass || inc.studentGroup.trim().toLowerCase() === targetClass;
        return matchName && matchClass;
      });

      if (incidentsToDelete.length > 0) {
        const nextIncidents = incidents.filter((inc) => {
          const matchName = inc.studentName.trim().toLowerCase() === targetName;
          const matchClass = !targetClass || inc.studentGroup.trim().toLowerCase() === targetClass;
          return !(matchName && matchClass);
        });

        setIncidents(nextIncidents);
        saveIncidents(nextIncidents);

        const incidentIds = incidentsToDelete.map((i) => i.id);
        batchDeleteIncidentsFromFirebase(incidentIds).catch((err) =>
          console.warn('Firebase batch delete incidents notice:', err)
        );
      }

      // 3. Also clear any positive behaviors associated with this student in the group
      const positivesToDelete = positives.filter((p) => {
        const matchName = p.studentName.trim().toLowerCase() === targetName;
        const matchClass = !targetClass || p.studentGroup.trim().toLowerCase() === targetClass;
        return matchName && matchClass;
      });

      if (positivesToDelete.length > 0) {
        const nextPositives = positives.filter((p) => {
          const matchName = p.studentName.trim().toLowerCase() === targetName;
          const matchClass = !targetClass || p.studentGroup.trim().toLowerCase() === targetClass;
          return !(matchName && matchClass);
        });

        setPositives(nextPositives);
        saveStoredPositives(nextPositives);

        const positiveIds = positivesToDelete.map((p) => p.id);
        batchDeletePositivesFromFirebase(positiveIds).catch((err) =>
          console.warn('Firebase batch delete positives notice:', err)
        );
      }

      // 4. Also clear any late arrivals associated with this student in the group
      const lateToDelete = lateArrivals.filter((la) => {
        const matchName = la.studentName.trim().toLowerCase() === targetName;
        const matchClass = !targetClass || la.studentGroup.trim().toLowerCase() === targetClass;
        return matchName && matchClass;
      });

      if (lateToDelete.length > 0) {
        const nextLate = lateArrivals.filter((la) => {
          const matchName = la.studentName.trim().toLowerCase() === targetName;
          const matchClass = !targetClass || la.studentGroup.trim().toLowerCase() === targetClass;
          return !(matchName && matchClass);
        });

        setLateArrivals(nextLate);
        saveStoredLateArrivals(nextLate);

        lateToDelete.forEach((la) => {
          deleteLateArrivalFromFirebase(la.id).catch((err) =>
            console.warn('Firebase delete late arrival notice:', err)
          );
        });
      }
    }

    if (stToDelete) {
      showToast(`Alumno "${stToDelete.name}" y sus registros de incidencias han sido eliminados.`);
    }
  };

  // Behavior Type CRUD handlers
  const handleAddBehaviorType = (typeData: Omit<BehaviorType, 'id'>) => {
    const newType: BehaviorType = {
      ...typeData,
      id: `bt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const next = [...behaviorTypes, newType];
    setBehaviorTypes(next);
    saveStoredBehaviorTypes(next);
    showToast(`Conducta "${typeData.name}" añadida al baremo (${typeData.points > 0 ? `+${typeData.points}` : typeData.points} pts).`);
  };

  const handleUpdateBehaviorType = (updatedType: BehaviorType) => {
    const next = behaviorTypes.map((b) => (b.id === updatedType.id ? updatedType : b));
    setBehaviorTypes(next);
    saveStoredBehaviorTypes(next);
    showToast(`Conducta "${updatedType.name}" actualizada en el baremo.`);
  };

  const handleDeleteBehaviorType = (typeId: string) => {
    const toDelete = behaviorTypes.find((b) => b.id === typeId);
    const next = behaviorTypes.filter((b) => b.id !== typeId);
    setBehaviorTypes(next);
    saveStoredBehaviorTypes(next);
    deleteBehaviorTypeFromFirebase(typeId).catch((err) => console.log('Firebase delete behavior notice:', err));
    if (toDelete) {
      showToast(`Conducta "${toDelete.name}" eliminada del catálogo.`);
    }
  };

  // Switch User Profile - Requires password authentication
  const handleSelectUser = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      return;
    }
    setTargetUserForLogin(user);
    setIsUserLoginModalOpen(true);
  };

  // Called when user successfully enters password in UserLoginModal
  const handleUserAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    saveStoredUser(user);
    setIsUserLoginModalOpen(false);
    setTargetUserForLogin(null);

    if (user.role === 'Directivo') {
      setIsDirectivoMode(true);
      showToast(`Bienvenida/o, ${user.name}. Panel de Dirección activado.`);
    } else {
      setIsDirectivoMode(false);
      // Enforce class authorization: if active class is not authorized for this user, return to selection screen
      if (activeClass && !isUserAuthorizedForClass(user, activeClass)) {
        setActiveClass(null);
        saveStoredActiveClass(null);
        showToast(
          `Sesión iniciada como "${user.name}". El aula "${activeClass}" no está asignada a tu perfil por Dirección. Mostrando tus aulas autorizadas.`
        );
      } else {
        showToast(`Sesión iniciada como "${user.name}" (${user.role}).`);
      }
    }
  };

  // Handler when user successfully logs in via initial AppLoginScreen
  const handleLoginSuccess = (user: UserProfile) => {
    try {
      sessionStorage.setItem('aula_conductas_auth_session', 'true');
    } catch {}
    setIsAuthenticated(true);
    setCurrentUser(user);
    saveStoredUser(user);

    if (user.role === 'Directivo') {
      setIsDirectivoMode(true);
      setActiveClass(null);
      saveStoredActiveClass(null);
      showToast(`Bienvenida/o, ${user.name}. Panel de Dirección activado.`);
    } else {
      setIsDirectivoMode(false);
      setActiveClass(null);
      saveStoredActiveClass(null);
      showToast(`Sesión iniciada como "${user.name}" (${user.role}).`);
    }
  };

  // Handler when user logs out
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('aula_conductas_auth_session');
    } catch {}
    setIsAuthenticated(false);
    setActiveClass(null);
    saveStoredActiveClass(null);
    showToast('Sesión cerrada. Identifícate para volver a acceder.');
  };

  // Save new user password to substitute generic '1234'
  const handleSaveNewPassword = async (userId: string, newPassword: string) => {
    const nextProfiles = profiles.map((p) => (p.id === userId ? { ...p, password: newPassword } : p));
    setProfiles(nextProfiles);
    saveStoredProfiles(nextProfiles);
    const target = nextProfiles.find((p) => p.id === userId);
    if (target) {
      try {
        await saveProfileToFirebase(target);
      } catch (err) {
        console.error('Error updating password in Firebase:', err);
      }
    }
    if (currentUser.id === userId) {
      const updated = { ...currentUser, password: newPassword };
      setCurrentUser(updated);
      saveStoredUser(updated);
    }
    showToast('✓ Contraseña guardada correctamente en Firebase.');
  };

  // Dirección Access & Authentication
  const handleOpenDirectivoAccess = () => {
    if (currentUser.role === 'Directivo') {
      setIsDirectivoMode(true);
      showToast(`Acceso directo como ${currentUser.name} (Dirección)`);
    } else {
      const directivoUser = profiles.find((p) => p.role === 'Directivo') || {
        id: 'u4',
        name: 'Dra. Carmen Santos (Jefatura)',
        role: 'Directivo' as const,
        avatarColor: 'bg-purple-600',
        password: DIRECTIVO_GLOBAL_PASSWORD,
        allowedClasses: ['ALL'],
      };
      setTargetUserForLogin(directivoUser);
      setIsUserLoginModalOpen(true);
    }
  };

  const handleDirectivoAuthenticated = (directivoProfile: UserProfile) => {
    setCurrentUser(directivoProfile);
    saveStoredUser(directivoProfile);
    setIsDirectivoMode(true);
    setIsDirectivoAuthModalOpen(false);
    showToast(`Bienvenida, ${directivoProfile.name}. Panel de Dirección activado.`);
  };

  // Late Arrival Handlers
  const handleSaveLateArrival = (newArrivalData: Omit<LateArrival, 'id' | 'createdAt'>) => {
    const newArrival: LateArrival = {
      ...newArrivalData,
      id: `la-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    const next = [newArrival, ...lateArrivals];
    setLateArrivals(next);
    saveStoredLateArrivals(next);

    const studentTotal = next.filter(
      (la) => la.studentName.trim().toLowerCase() === newArrival.studentName.trim().toLowerCase()
    ).length;

    if (studentTotal >= lateConfig.warningThreshold) {
      showToast(
        `🚨 AVISO DE PUNTUALIDAD: ${newArrival.studentName} acumula ${studentTotal} retrasos (límite configurado: ${lateConfig.warningThreshold}).`
      );
    } else {
      showToast(`Retraso registrado a las ${newArrival.arrivalTime} para ${newArrival.studentName}.`);
    }
    setIsLateArrivalModalOpen(false);
  };

  const handleUpdateLateArrival = (updated: LateArrival) => {
    const next = lateArrivals.map((la) => (la.id === updated.id ? updated : la));
    setLateArrivals(next);
    saveStoredLateArrivals(next);
    showToast(`Registro de retraso de ${updated.studentName} actualizado.`);
  };

  const handleDeleteLateArrival = (id: string) => {
    const next = lateArrivals.filter((la) => la.id !== id);
    setLateArrivals(next);
    saveStoredLateArrivals(next);
    deleteLateArrivalFromFirebase(id).catch((err) => console.log('Firebase delete late arrival notice:', err));
    showToast('Registro de retraso eliminado.');
  };

  const handleSaveLateConfig = (newConfig: LateArrivalConfig) => {
    setLateConfig(newConfig);
    saveStoredLateArrivalConfig(newConfig);
    setIsLateConfigModalOpen(false);
    showToast(`Configuración guardada: Límite de aviso establecido en ${newConfig.warningThreshold} retrasos.`);
  };

  // Create new incident
  const handleCreateIncident = (
    data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const timestamp = new Date().toISOString();
    const newIncident: Incident = {
      ...data,
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const updated = [newIncident, ...incidents];
    handleUpdateIncidents(updated);
    showToast(`Incidencia registrada para ${newIncident.studentName} (${newIncident.severity})`);
  };

  // Update existing incident
  const handleUpdateIncident = (updated: Incident) => {
    const nextList = incidents.map((i) => (i.id === updated.id ? updated : i));
    handleUpdateIncidents(nextList);
    showToast(`Parte de ${updated.studentName} actualizado`);
  };

  // Quick status change from table
  const handleQuickStatusChange = (incidentId: string, newStatus: IncidentStatus) => {
    const nextList = incidents.map((i) =>
      i.id === incidentId
        ? { ...i, status: newStatus, updatedAt: new Date().toISOString() }
        : i
    );
    handleUpdateIncidents(nextList);
    showToast(`Estado cambiado a "${newStatus}"`);
  };

  // Excel Import completed
  const handleImportComplete = (importedRows: Incident[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      handleUpdateIncidents(importedRows);
      showToast(`¡Excelente! Base de datos inicializada con ${importedRows.length} registros del Excel.`);
    } else {
      const combined = [...importedRows, ...incidents];
      handleUpdateIncidents(combined);
      showToast(`Se han añadido ${importedRows.length} nuevas incidencias desde el Excel.`);
    }
    setActiveTab('incidencias');
  };

  // Export to Excel for whole center
  const handleExportExcel = () => {
    exportIncidentsToExcel(
      incidents,
      `registro_conductas_centro_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    showToast('Archivo Excel descargado con éxito.');
  };

  // Export to Excel for active class
  const handleExportClassExcel = () => {
    if (!activeClass) return;
    const filtered = incidents.filter((i) => i.studentGroup.toLowerCase() === activeClass.toLowerCase());
    exportIncidentsToExcel(
      filtered.length > 0 ? filtered : incidents,
      `registro_conductas_${activeClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    showToast(`Archivo Excel de ${activeClass} generado con éxito.`);
  };

  // Reset demo
  const handleResetData = () => {
    if (
      window.confirm(
        '¿Deseas restablecer los datos de ejemplo del centro educativo? Esto restaurará clases e incidencias.'
      )
    ) {
      const demo = resetToSampleData();
      setIncidents(demo);
      resetFirebaseToInitialData().catch((err) => console.log('Firebase reset notice:', err));
      showToast('Datos de demostración restablecidos.');
    }
  };

  // Open incident modal for specific student
  const handleOpenNewIncidentForStudent = (studentName?: string) => {
    setPrefilledStudentName(studentName);
    setIsNewIncidentOpen(true);
  };

  // Distinct list of student names for autocomplete
  const existingStudents = useMemo(() => {
    const fromInc = incidents.map((i) => i.studentName.trim());
    const fromRoster = students.map((s) => s.name.trim());
    return Array.from(new Set([...fromInc, ...fromRoster])).sort();
  }, [incidents, students]);

  const openIncidentsCount = useMemo(() => {
    return incidents.filter((i) => i.status === 'Abierta' || i.status === 'En seguimiento').length;
  }, [incidents]);

  // Late warning count (students who reached or exceeded the warning threshold)
  const lateWarningCount = useMemo(() => {
    const counts = new Map<string, number>();
    lateArrivals.forEach((la) => {
      const key = la.studentName.trim().toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    let c = 0;
    counts.forEach((count) => {
      if (count >= lateConfig.warningThreshold) c += 1;
    });
    return c;
  }, [lateArrivals, lateConfig.warningThreshold]);

  // Active SchoolClass object if specific class is selected
  const activeClassObj = useMemo(() => {
    if (!activeClass || activeClass === 'Vista Global') return null;
    return (
      classes.find((c) => c.name.toLowerCase() === activeClass.toLowerCase()) || {
        id: 'class-custom',
        name: activeClass,
        stage: 'ESO' as const,
        room: 'Aula asignada',
        tutorName: 'Profesor Tutor',
        password: '1234',
        color: 'from-indigo-600 to-blue-700',
      }
    );
  }, [activeClass, classes]);

  // Tutoría: Aulas asignadas al tutor en sesión
  const tutorClassNames = useMemo(() => {
    if (currentUser.role !== 'Tutor') return [];
    const names = new Set<string>();
    if (currentUser.course) names.add(currentUser.course);
    classes.forEach((c) => {
      if (c.tutorName && c.tutorName.toLowerCase() === currentUser.name.toLowerCase()) {
        names.add(c.name);
      }
    });
    if (names.size === 0 && currentUser.allowedClasses && !currentUser.allowedClasses.includes('ALL')) {
      currentUser.allowedClasses.forEach((cls) => names.add(cls));
    }
    return Array.from(names);
  }, [currentUser, classes]);

  // Identificador de "Parte Disciplinario"
  const isIncidentParte = (inc: Incident): boolean => {
    return (
      inc.severity === 'Muy Grave' ||
      inc.severity === 'Grave' ||
      (typeof inc.points === 'number' && inc.points <= -20) ||
      (Boolean(inc.immediateMeasure) && inc.immediateMeasure.toLowerCase().includes('parte')) ||
      (Boolean(inc.category) && inc.category.toLowerCase().includes('parte'))
    );
  };

  // Lista de partes disciplinarios correspondientes a la tutoría
  const tutorPartes = useMemo(() => {
    if (currentUser.role !== 'Tutor' || tutorClassNames.length === 0) return [];
    return incidents.filter(
      (inc) => tutorClassNames.includes(inc.studentGroup) && isIncidentParte(inc)
    );
  }, [currentUser.role, tutorClassNames, incidents]);

  // Partes que requieren confirmación de lectura por el tutor
  const unconfirmedTutorPartes = useMemo(() => {
    return tutorPartes.filter((p) => !p.tutorReadConfirmation?.confirmed);
  }, [tutorPartes]);

  // Confirmar lectura individual de un parte
  const handleConfirmParteRead = (incidentId: string, notes?: string) => {
    const confirmation: TutorParteConfirmation = {
      confirmed: true,
      tutorName: currentUser.name,
      confirmedAt: new Date().toISOString(),
      notes: notes || undefined,
    };
    saveStoredTutorConfirmation(incidentId, confirmation);
    const updated = incidents.map((inc) =>
      inc.id === incidentId ? { ...inc, tutorReadConfirmation: confirmation } : inc
    );
    setIncidents(updated);
    saveIncidents(updated);
    showToast(`✓ Lectura del parte confirmada correctamente por Tutoría.`);
  };

  // Confirmar lectura de todos los partes pendientes
  const handleConfirmAllPartesRead = () => {
    const now = new Date().toISOString();
    let updated = [...incidents];
    unconfirmedTutorPartes.forEach((parte) => {
      const confirmation: TutorParteConfirmation = {
        confirmed: true,
        tutorName: currentUser.name,
        confirmedAt: now,
      };
      saveStoredTutorConfirmation(parte.id, confirmation);
      updated = updated.map((inc) =>
        inc.id === parte.id ? { ...inc, tutorReadConfirmation: confirmation } : inc
      );
    });
    setIncidents(updated);
    saveIncidents(updated);
    showToast(`✓ Confirmada la lectura de todos los partes pendientes (${unconfirmedTutorPartes.length}).`);
    setIsTutorAlertModalOpen(false);
  };

  // 0. AUTHENTICATION GATE: Do NOT show any profiles or classes before asking for the user's password
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AppLoginScreen
          profiles={profiles}
          onLoginSuccess={handleLoginSuccess}
          onResetUserPassword={handleResetUserPassword}
          onUpdateUserPassword={handleSaveNewPassword}
        />
      </div>
    );
  }

  // 1. DEDICATED DIRECCIÓN VIEW (ACCESIBLE SOLO A DIRECCIÓN)
  if (isDirectivoMode) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
        {/* Toast banner */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dedicated Executive Management Header */}
        <FirebaseSyncBanner
          isSyncing={isSyncing}
          onTriggerSync={handleForceSync}
        />

        <DirectivoHeader
          currentUser={currentUser}
          profiles={profiles}
          onSelectUser={handleSelectUser}
          onLogout={handleLogout}
          activeNavTab={directivoNavTab}
          onSelectNavTab={setDirectivoNavTab}
          selectedClassFilter={directivoClassFilter}
          onSelectClassFilter={setDirectivoClassFilter}
          classesList={classes.map((c) => c.name)}
          onOpenNewIncident={() => handleOpenNewIncidentForStudent()}
          onOpenNewLateArrival={() => {
            setLatePrefillClass(directivoClassFilter !== 'ALL' ? directivoClassFilter : undefined);
            setIsLateArrivalModalOpen(true);
          }}
          onOpenLateConfig={() => setIsLateConfigModalOpen(true)}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          onExportExcel={handleExportExcel}
          onExitDirectivo={() => {
            setIsDirectivoMode(false);
            if (currentUser.role === 'Directivo') {
              const nonDirectivo = INITIAL_PROFILES.find((p) => p.role !== 'Directivo') || INITIAL_PROFILES[0];
              setCurrentUser(nonDirectivo);
              saveStoredUser(nonDirectivo);
              showToast(`Modo Docente activado (${nonDirectivo.name})`);
            }
          }}
          lateWarningCount={lateWarningCount}
          totalDisruptivas={incidents.length}
          totalPositivas={positives.length}
        />

        {/* Executive Management Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {directivoNavTab === 'seguimiento_aula' && (
            <ClassroomConductTracking
              classes={classes}
              incidents={incidents}
              positives={positives}
              students={students}
              lateArrivals={lateArrivals}
              lateWarningThreshold={lateConfig.warningThreshold}
              currentUser={currentUser}
              onSelectClassFilter={(cls) => setDirectivoClassFilter(cls)}
              selectedClassFilter={directivoClassFilter}
              onOpenStudentProfile={(name) => setSelectedStudentName(name)}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              onOpenCreateClass={() => setIsCreateClassOpen(true)}
              onToggleHideClass={handleToggleHideClass}
              onEditClass={(cls) => setEditingClass(cls)}
              onOpenNewIncidentForClass={(className) => {
                setPrefilledStudentName(undefined);
                setIsNewIncidentOpen(true);
              }}
              onOpenNewLateArrivalForClass={(className) => {
                setLatePrefillClass(className);
                setIsLateArrivalModalOpen(true);
              }}
            />
          )}

          {directivoNavTab === 'estadisticas' && (
            <ConductStatisticsDashboard
              incidents={incidents}
              positives={positives}
              students={students}
              classes={classes}
              lateArrivals={lateArrivals}
              currentUser={currentUser}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              onOpenStudentProfile={(name) => setSelectedStudentName(name)}
            />
          )}

          {directivoNavTab === 'retrasos' && (
            <LateArrivalsRegistry
              lateArrivals={lateArrivals}
              classes={classes}
              students={students}
              config={lateConfig}
              currentUser={currentUser}
              selectedClassFilter={directivoClassFilter}
              onSelectClassFilter={setDirectivoClassFilter}
              onOpenNewLateArrival={() => {
                setLatePrefillClass(directivoClassFilter !== 'ALL' ? directivoClassFilter : undefined);
                setIsLateArrivalModalOpen(true);
              }}
              onUpdateLateArrival={handleUpdateLateArrival}
              onDeleteLateArrival={handleDeleteLateArrival}
              onOpenConfigModal={() => setIsLateConfigModalOpen(true)}
              onOpenStudentProfile={(name) => setSelectedStudentName(name)}
            />
          )}

          {directivoNavTab === 'usuarios_accesos' && (
            <DirectivoUsersConfigTab
              profiles={profiles}
              classes={classes}
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onResetUserPassword={handleResetUserPassword}
            />
          )}
        </main>

        {/* Modal: Retraso Individual */}
        <LateArrivalModal
          isOpen={isLateArrivalModalOpen}
          onClose={() => {
            setIsLateArrivalModalOpen(false);
            setLatePrefillStudent(undefined);
            setLatePrefillClass(undefined);
          }}
          onSubmit={handleSaveLateArrival}
          classes={classes}
          students={students}
          currentUser={currentUser}
          initialClass={latePrefillClass}
          initialStudentName={latePrefillStudent}
        />

        {/* Modal: Configuración de Límite de Retrasos */}
        <LateConfigModal
          isOpen={isLateConfigModalOpen}
          onClose={() => setIsLateConfigModalOpen(false)}
          config={lateConfig}
          onSaveConfig={handleSaveLateConfig}
        />

        {/* Modal: Nueva Conducta */}
        <NewIncidentModal
          isOpen={isNewIncidentOpen}
          onClose={() => {
            setIsNewIncidentOpen(false);
            setPrefilledStudentName(undefined);
          }}
          onSubmit={handleCreateIncident}
          onSavePositive={handleSavePositive}
          currentUser={currentUser}
          existingStudents={existingStudents}
          defaultGroup={directivoClassFilter !== 'ALL' ? directivoClassFilter : undefined}
          initialStudentName={prefilledStudentName}
          behaviorTypes={behaviorTypes}
          classes={classes}
        />

        {/* Modal: Excel Import */}
        <ExcelImportModal
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
          onImportComplete={handleImportComplete}
          currentUser={currentUser}
        />

        {/* Modal: Detalle de Incidencia */}
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdateIncident={handleUpdateIncident}
          currentUser={currentUser}
          onOpenStudentProfile={(name) => {
            setSelectedIncident(null);
            setSelectedStudentName(name);
          }}
        />

        {/* Modal: Ficha del Alumno con Historial y Retrasos */}
        <StudentProfileModal
          studentName={selectedStudentName}
          incidents={incidents}
          lateArrivals={lateArrivals}
          lateWarningThreshold={lateConfig.warningThreshold}
          onClose={() => setSelectedStudentName(null)}
          onSelectIncident={(inc) => {
            setSelectedStudentName(null);
            setSelectedIncident(inc);
          }}
        />

        {/* User Login Authentication Modal */}
        <UserLoginModal
          isOpen={isUserLoginModalOpen}
          onClose={() => {
            setIsUserLoginModalOpen(false);
            setTargetUserForLogin(null);
          }}
          targetUser={targetUserForLogin}
          currentUser={currentUser}
          onAuthenticated={handleUserAuthenticated}
          onResetPassword={handleResetUserPassword}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          currentUser={currentUser}
          onSaveNewPassword={handleSaveNewPassword}
          onResetPassword={handleResetUserPassword}
        />

        {/* Modal: Crear Nueva Clase */}
        <CreateClassModal
          isOpen={isCreateClassOpen}
          onClose={() => setIsCreateClassOpen(false)}
          onAddClass={handleAddClass}
          existingClasses={classes}
        />

        {/* Modal: Editar Clase Existente */}
        <EditClassModal
          isOpen={Boolean(editingClass)}
          onClose={() => setEditingClass(null)}
          classData={editingClass}
          onUpdateClass={handleUpdateClass}
          onDeleteClass={handleDeleteClass}
        />
      </div>
    );
  }

  // 2. If no active class has been selected and unlocked, render the INITIAL CLASSROOM SELECTION SCREEN
  if (!activeClass) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <FirebaseSyncBanner
          isSyncing={isSyncing}
          onTriggerSync={handleForceSync}
        />

        <ClassSelectionScreen
          classes={classes}
          incidents={incidents}
          currentUser={currentUser}
          profiles={profiles}
          onSelectUser={handleSelectUser}
          onLogout={handleLogout}
          onClassUnlocked={handleClassUnlocked}
          onAddClass={handleAddClass}
          onUpdateClass={handleUpdateClass}
          onDeleteClass={handleDeleteClass}
          onUpdateClassPassword={handleUpdateClassPassword}
          onOpenExcelImport={() => setIsExcelImportOpen(true)}
          onOpenDirectivoAccess={handleOpenDirectivoAccess}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          onToggleHideClass={handleToggleHideClass}
        />

        {/* Directivo Authentication Modal */}
        <DirectivoAuthModal
          isOpen={isDirectivoAuthModalOpen}
          onClose={() => setIsDirectivoAuthModalOpen(false)}
          onSuccess={handleDirectivoAuthenticated}
          profiles={INITIAL_PROFILES}
        />

        {/* Excel Import Modal can also be accessed from the initial screen */}
        <ExcelImportModal
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
          onImportComplete={handleImportComplete}
          currentUser={currentUser}
        />

        {/* User Login Authentication Modal */}
        <UserLoginModal
          isOpen={isUserLoginModalOpen}
          onClose={() => {
            setIsUserLoginModalOpen(false);
            setTargetUserForLogin(null);
          }}
          targetUser={targetUserForLogin}
          currentUser={currentUser}
          onAuthenticated={handleUserAuthenticated}
          onResetPassword={handleResetUserPassword}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          currentUser={currentUser}
          onSaveNewPassword={handleSaveNewPassword}
          onResetPassword={handleResetUserPassword}
        />
      </div>
    );
  }

  // 3. Once a class is unlocked (standard classroom / teacher view):
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Toast banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <FirebaseSyncBanner
        isSyncing={isSyncing}
        onTriggerSync={handleForceSync}
      />

      <Header
        currentUser={currentUser}
        profiles={profiles}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIncident={() => handleOpenNewIncidentForStudent()}
        onOpenExcelImport={() => setIsExcelImportOpen(true)}
        onExportExcel={handleExportExcel}
        onResetData={handleResetData}
        totalIncidentsCount={incidents.length}
        openIncidentsCount={openIncidentsCount}
        activeClassName={activeClass}
        onChangeClass={handleChangeClass}
        onOpenDirectivoAccess={handleOpenDirectivoAccess}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        unreadPartesCount={unconfirmedTutorPartes.length}
        onOpenTutorPartes={() => setIsTutorAlertModalOpen(true)}
      />

      {/* Alerta de Partes para el Tutor */}
      {currentUser.role === 'Tutor' && unconfirmedTutorPartes.length > 0 && (
        <div id="banner-alerta-partes-tutor" className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-red-300">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-white/20 rounded-2xl shrink-0 mt-0.5 shadow-inner">
                <ShieldAlert className="w-6 h-6 text-amber-200 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-white text-red-800 px-2.5 py-0.5 rounded-full shadow-2xs">
                    Aviso de Tutoría: Parte Disciplinario
                  </span>
                  {tutorClassNames.length > 0 && (
                    <span className="text-xs font-bold text-red-100 bg-red-800/60 px-2 py-0.5 rounded-lg">
                      {tutorClassNames.join(', ')}
                    </span>
                  )}
                  <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                    {unconfirmedTutorPartes.length} pendiente{unconfirmedTutorPartes.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm font-black text-white">
                  Se ha registrado un parte para alumno(s) de tu tutoría. Se requiere tu confirmación de lectura.
                </p>
                <p className="text-xs text-red-100">
                  Alumnado afectado: <strong className="text-white underline">{unconfirmedTutorPartes.map((p) => p.studentName).join(', ')}</strong>
                </p>
              </div>
            </div>

            <button
              id="btn-revisar-partes-tutor"
              type="button"
              onClick={() => setIsTutorAlertModalOpen(true)}
              className="px-5 py-2.5 bg-white hover:bg-amber-50 text-red-800 hover:text-red-900 text-xs font-black rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap self-start sm:self-center flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-red-700" />
              <span>Ver y Confirmar Lectura</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* If a specific class is selected (e.g. "2º ESO B"), render the dedicated Glide-style Class App */}
        {activeClassObj ? (
          <ClassAppView
            schoolClass={activeClassObj}
            classes={classes}
            incidents={incidents}
            students={students}
            positives={positives}
            currentUser={currentUser}
            behaviorTypes={behaviorTypes}
            onAddBehaviorType={handleAddBehaviorType}
            onUpdateBehaviorType={handleUpdateBehaviorType}
            onDeleteBehaviorType={handleDeleteBehaviorType}
            onChangeClass={handleChangeClass}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onOpenStudentProfile={(name) => setSelectedStudentName(name)}
            onOpenNewIncident={(name) => handleOpenNewIncidentForStudent(name)}
            onSavePositive={handleSavePositive}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onExportClassExcel={handleExportClassExcel}
          />
        ) : (
          /* Global Center View (when "Vista Global" is chosen) */
          <>
            {activeTab === 'incidencias' && (
              <IncidentList
                incidents={incidents}
                currentUser={currentUser}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onOpenStudentProfile={(name) => setSelectedStudentName(name)}
                onQuickStatusChange={handleQuickStatusChange}
                onOpenNewIncident={() => handleOpenNewIncidentForStudent()}
                onOpenExcelImport={() => setIsExcelImportOpen(true)}
                activeClassName={activeClass}
              />
            )}

            {activeTab === 'directivo' && (
              <DirectivoDashboard
                incidents={incidents}
                currentUser={currentUser}
                onOpenStudentProfile={(name) => setSelectedStudentName(name)}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            )}

            {activeTab === 'alumnos' && (
              <StudentListTab
                incidents={incidents}
                onOpenStudentProfile={(name) => setSelectedStudentName(name)}
                onOpenNewIncidentForStudent={(name) => handleOpenNewIncidentForStudent(name)}
                activeClassName={activeClass}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for Mobile or Fast Classroom Entry */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          onClick={() => handleOpenNewIncidentForStudent()}
          className="w-14 h-14 rounded-full bg-slate-900 text-amber-400 shadow-xl flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-transform active:scale-95"
          title="Registrar Incidencia"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Directivo Authentication Modal */}
      <DirectivoAuthModal
        isOpen={isDirectivoAuthModalOpen}
        onClose={() => setIsDirectivoAuthModalOpen(false)}
        onSuccess={handleDirectivoAuthenticated}
        profiles={INITIAL_PROFILES}
      />

      {/* Modal 1: New Conduct Registration */}
      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => {
          setIsNewIncidentOpen(false);
          setPrefilledStudentName(undefined);
        }}
        onSubmit={handleCreateIncident}
        onSavePositive={handleSavePositive}
        currentUser={currentUser}
        existingStudents={existingStudents}
        defaultGroup={activeClass !== 'Vista Global' ? activeClass : undefined}
        initialStudentName={prefilledStudentName}
        behaviorTypes={behaviorTypes}
        classes={classes}
      />

      {/* Modal 2: Transform Excel to App (Excel Import) */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImportComplete={handleImportComplete}
        currentUser={currentUser}
      />

      {/* Modal 3: Incident Details & Printable Official Report */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateIncident={handleUpdateIncident}
        currentUser={currentUser}
        onOpenStudentProfile={(name) => {
          setSelectedIncident(null);
          setSelectedStudentName(name);
        }}
      />

      {/* Modal 4: Individual Student Dossier */}
      <StudentProfileModal
        studentName={selectedStudentName}
        incidents={incidents}
        lateArrivals={lateArrivals}
        lateWarningThreshold={lateConfig.warningThreshold}
        onClose={() => setSelectedStudentName(null)}
        onSelectIncident={(inc) => {
          setSelectedStudentName(null);
          setSelectedIncident(inc);
        }}
      />

      {/* Late Arrival Modals also available if needed */}
      <LateArrivalModal
        isOpen={isLateArrivalModalOpen}
        onClose={() => {
          setIsLateArrivalModalOpen(false);
          setLatePrefillStudent(undefined);
          setLatePrefillClass(undefined);
        }}
        onSubmit={handleSaveLateArrival}
        classes={classes}
        students={students}
        currentUser={currentUser}
        initialClass={latePrefillClass}
        initialStudentName={latePrefillStudent}
      />

      <LateConfigModal
        isOpen={isLateConfigModalOpen}
        onClose={() => setIsLateConfigModalOpen(false)}
        config={lateConfig}
        onSaveConfig={handleSaveLateConfig}
      />

      {/* Tutor Parte Alert Modal with Confirmation */}
      <TutorParteAlertModal
        isOpen={isTutorAlertModalOpen}
        onClose={() => setIsTutorAlertModalOpen(false)}
        currentUser={currentUser}
        partes={tutorPartes}
        onConfirmRead={handleConfirmParteRead}
        onConfirmAllRead={handleConfirmAllPartesRead}
      />

      {/* User Login Authentication Modal */}
      <UserLoginModal
        isOpen={isUserLoginModalOpen}
        onClose={() => {
          setIsUserLoginModalOpen(false);
          setTargetUserForLogin(null);
        }}
        targetUser={targetUserForLogin}
        currentUser={currentUser}
        onAuthenticated={handleUserAuthenticated}
        onResetPassword={handleResetUserPassword}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={currentUser}
        onSaveNewPassword={handleSaveNewPassword}
        onResetPassword={handleResetUserPassword}
      />
    </div>
  );
}

