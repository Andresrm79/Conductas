import {
  BehaviorType,
  ClassStudent,
  Incident,
  PositiveBehavior,
  SchoolClass,
  UserProfile,
  LateArrival,
  LateArrivalConfig,
  ConductThresholds,
  ClassConductConfig,
  TutorParteConfirmation,
} from '../types';
import { INITIAL_CLASSES, INITIAL_INCIDENTS, INITIAL_PROFILES } from '../data/mockData';
import { INITIAL_POSITIVES, INITIAL_STUDENTS } from '../data/mockStudents';
import { INITIAL_BEHAVIOR_TYPES } from '../data/mockBehaviorTypes';
import { INITIAL_LATE_ARRIVALS, DEFAULT_LATE_CONFIG } from '../data/mockLateArrivals';
import {
  batchSaveIncidentsToFirebase,
  saveClassToFirebase,
  saveStudentToFirebase,
  savePositiveToFirebase,
  saveBehaviorTypeToFirebase,
  saveProfileToFirebase,
  saveLateArrivalToFirebase,
  saveCenterLateConfigToFirebase,
  saveClassConductConfigToFirebase,
  saveIncidentToFirebase,
} from '../firebase/firestoreService';

const INCIDENTS_KEY = 'aula_conductas_incidencias_v1';
const CURRENT_USER_KEY = 'aula_conductas_current_user_v1';
const CLASSES_KEY = 'aula_conductas_classes_v1';
const ACTIVE_CLASS_KEY = 'aula_conductas_active_class_v1';
const STUDENTS_KEY = 'aula_conductas_students_v1';
const POSITIVES_KEY = 'aula_conductas_positives_v1';
const BEHAVIOR_TYPES_KEY = 'aula_conductas_behavior_types_v1';
const CLASS_CONDUCT_CONFIGS_KEY = 'aula_conductas_class_configs_v1';
const LATE_ARRIVALS_KEY = 'aula_conductas_late_arrivals_v1';
const LATE_CONFIG_KEY = 'aula_conductas_late_config_v1';
const PROFILES_KEY = 'aula_conductas_profiles_v2';
const TUTOR_CONFIRMATIONS_KEY = 'aula_conductas_tutor_confirmations_v1';

export const DEFAULT_CONDUCT_THRESHOLDS: ConductThresholds = {
  favorableThreshold: -10,  // Puntos semanales > -10 => Favorable (Verde)
  criticoThreshold: -20,    // Puntos semanales entre -10 y -20 => Crítico (Amarillo)
  muyCriticoThreshold: -20, // Puntos semanales < -20 => Muy Crítico (Rojo)
};

// Behavior Types Catalog Storage
export function getStoredBehaviorTypes(): BehaviorType[] {
  try {
    const raw = localStorage.getItem(BEHAVIOR_TYPES_KEY);
    if (!raw) {
      const sanitized = INITIAL_BEHAVIOR_TYPES.map((b) => ({ ...b, active: b.active !== false }));
      saveStoredBehaviorTypes(sanitized);
      return sanitized;
    }
    const parsed: BehaviorType[] = JSON.parse(raw);
    return parsed.map((b) => ({ ...b, active: b.active !== false }));
  } catch (e) {
    console.error('Error reading behavior types from localStorage', e);
    return INITIAL_BEHAVIOR_TYPES.map((b) => ({ ...b, active: b.active !== false }));
  }
}

export function saveStoredBehaviorTypes(types: BehaviorType[]): void {
  try {
    localStorage.setItem(BEHAVIOR_TYPES_KEY, JSON.stringify(types));
    types.forEach((t) => {
      saveBehaviorTypeToFirebase(t).catch((err) => console.log('Firebase sync notice:', err));
    });
  } catch (e) {
    console.error('Error saving behavior types to localStorage', e);
  }
}

export function addStoredBehaviorType(newType: Omit<BehaviorType, 'id'>): BehaviorType {
  const current = getStoredBehaviorTypes();
  const created: BehaviorType = {
    ...newType,
    id: `bt-custom-${Date.now()}`,
    isCustom: true,
    active: newType.active !== false,
  };
  const updated = [created, ...current];
  saveStoredBehaviorTypes(updated);
  return created;
}

export function updateStoredBehaviorType(updatedType: BehaviorType): void {
  const current = getStoredBehaviorTypes();
  const updated = current.map((t) => (t.id === updatedType.id ? { ...updatedType, active: updatedType.active !== false } : t));
  saveStoredBehaviorTypes(updated);
}

export function deleteStoredBehaviorType(typeId: string): void {
  const current = getStoredBehaviorTypes();
  const updated = current.filter((t) => t.id !== typeId);
  saveStoredBehaviorTypes(updated);
}

// PER-CLASS CONDUCT CATALOG AND STATUS THRESHOLDS
export function getClassConductConfig(className: string): ClassConductConfig {
  try {
    const raw = localStorage.getItem(CLASS_CONDUCT_CONFIGS_KEY);
    const configs: Record<string, ClassConductConfig> = raw ? JSON.parse(raw) : {};
    if (configs[className]) {
      const stored = configs[className];
      return {
        ...stored,
        className,
        isCustomized: true,
        behaviorTypes: (stored.behaviorTypes || []).map((b) => ({ ...b, active: b.active !== false })),
        thresholds: {
          favorableThreshold: typeof stored.thresholds?.favorableThreshold === 'number' ? stored.thresholds.favorableThreshold : DEFAULT_CONDUCT_THRESHOLDS.favorableThreshold,
          criticoThreshold: typeof stored.thresholds?.criticoThreshold === 'number' ? stored.thresholds.criticoThreshold : DEFAULT_CONDUCT_THRESHOLDS.criticoThreshold,
          muyCriticoThreshold: typeof stored.thresholds?.muyCriticoThreshold === 'number' ? stored.thresholds.muyCriticoThreshold : DEFAULT_CONDUCT_THRESHOLDS.muyCriticoThreshold,
        },
      };
    }
  } catch (e) {
    console.error('Error reading class conduct config', e);
  }

  // If not customized for this class yet, fallback to center defaults
  const centerTypes = getStoredBehaviorTypes().map((b) => ({
    ...b,
    active: b.active !== false,
    className,
  }));

  return {
    className,
    behaviorTypes: centerTypes,
    thresholds: { ...DEFAULT_CONDUCT_THRESHOLDS },
    isCustomized: false,
  };
}

export function saveClassConductConfig(config: ClassConductConfig): void {
  try {
    const raw = localStorage.getItem(CLASS_CONDUCT_CONFIGS_KEY);
    const configs: Record<string, ClassConductConfig> = raw ? JSON.parse(raw) : {};
    const updated = {
      ...config,
      isCustomized: true,
      updatedAt: new Date().toISOString(),
    };
    configs[config.className] = updated;
    localStorage.setItem(CLASS_CONDUCT_CONFIGS_KEY, JSON.stringify(configs));
    saveClassConductConfigToFirebase(updated).catch((err) => console.log('Firebase sync notice:', err));
  } catch (e) {
    console.error('Error saving class conduct config', e);
  }
}

export function resetClassConductConfigToDefault(className: string): ClassConductConfig {
  try {
    const raw = localStorage.getItem(CLASS_CONDUCT_CONFIGS_KEY);
    if (raw) {
      const configs: Record<string, ClassConductConfig> = JSON.parse(raw);
      delete configs[className];
      localStorage.setItem(CLASS_CONDUCT_CONFIGS_KEY, JSON.stringify(configs));
    }
  } catch (e) {
    console.error('Error resetting class conduct config', e);
  }
  return getClassConductConfig(className);
}

export function applyClassConfigToAllClasses(sourceConfig: ClassConductConfig, allClassNames: string[]): void {
  try {
    const raw = localStorage.getItem(CLASS_CONDUCT_CONFIGS_KEY);
    const configs: Record<string, ClassConductConfig> = raw ? JSON.parse(raw) : {};
    allClassNames.forEach((name) => {
      configs[name] = {
        className: name,
        behaviorTypes: sourceConfig.behaviorTypes.map((b) => ({ ...b, className: name })),
        thresholds: { ...sourceConfig.thresholds },
        isCustomized: true,
        updatedAt: new Date().toISOString(),
      };
    });
    localStorage.setItem(CLASS_CONDUCT_CONFIGS_KEY, JSON.stringify(configs));
  } catch (e) {
    console.error('Error copying class conduct config to all classes', e);
  }
}

// Date and Week calculation helpers
export function getMondayOfActiveWeek(dateInput?: Date | string): Date {
  const d = dateInput ? new Date(dateInput) : new Date();
  const day = d.getDay();
  // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  // Diff to reach Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function isDateInActiveWeek(dateStr: string, activeMonday: Date): boolean {
  if (!dateStr) return false;
  // Parse dateStr (YYYY-MM-DD) in local time
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;
  const target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);

  const start = new Date(activeMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(activeMonday);
  end.setDate(activeMonday.getDate() + 7);
  end.setHours(0, 0, 0, 0);

  return target >= start && target < end;
}

export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${monday.getDate()} ${months[monday.getMonth()]} - ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

export function getWeekKey(dateStr: string): string {
  if (!dateStr) return 'unknown';
  const parts = dateStr.split('-');
  if (parts.length < 3) return 'unknown';
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
  const monday = getMondayOfActiveWeek(d);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

export function getIncidentPoints(inc: Incident): number {
  if (typeof inc.points === 'number') {
    return inc.points <= 0 ? inc.points : -inc.points;
  }
  // Fallback points by severity
  if (inc.severity === 'Muy Grave') return -50;
  if (inc.severity === 'Grave') return -15;
  return -5;
}

export function getPositivePoints(pos: PositiveBehavior): number {
  return pos.points && pos.points > 0 ? pos.points : 5;
}

// Student Conduct Metrics Helpers
export function getStudentWeeklyPoints(
  studentName: string,
  incidents: Incident[],
  positives: PositiveBehavior[],
  activeMonday: Date
): number {
  const normName = studentName.trim().toLowerCase();

  const weeklyIncidents = incidents.filter(
    (inc) => inc.studentName.trim().toLowerCase() === normName && isDateInActiveWeek(inc.date, activeMonday)
  );
  const weeklyPositives = positives.filter(
    (pos) => pos.studentName.trim().toLowerCase() === normName && isDateInActiveWeek(pos.date, activeMonday)
  );

  const negSum = weeklyIncidents.reduce((acc, inc) => acc + getIncidentPoints(inc), 0);
  const posSum = weeklyPositives.reduce((acc, pos) => acc + getPositivePoints(pos), 0);

  return negSum + posSum;
}

export function getStudentCoursePoints(
  studentName: string,
  incidents: Incident[],
  positives: PositiveBehavior[],
  baseInitialPoints: number = 0
): number {
  const normName = studentName.trim().toLowerCase();

  const allIncidents = incidents.filter((inc) => inc.studentName.trim().toLowerCase() === normName);
  const allPositives = positives.filter((pos) => pos.studentName.trim().toLowerCase() === normName);

  const negSum = allIncidents.reduce((acc, inc) => acc + getIncidentPoints(inc), 0);
  const posSum = allPositives.reduce((acc, pos) => acc + getPositivePoints(pos), 0);

  return baseInitialPoints + negSum + posSum;
}

// Partes formula: "el alumno tendrá un parte por cada semana cuya puntuación esté por debajo del umbral muy crítico (o -20)"
export function getStudentPartesCount(
  studentName: string,
  incidents: Incident[],
  positives: PositiveBehavior[],
  thresholds?: ConductThresholds
): number {
  const normName = studentName.trim().toLowerCase();
  const allIncidents = incidents.filter((inc) => inc.studentName.trim().toLowerCase() === normName);
  const allPositives = positives.filter((pos) => pos.studentName.trim().toLowerCase() === normName);

  // Group by week key
  const weekPointsMap = new Map<string, number>();

  allIncidents.forEach((inc) => {
    const wKey = getWeekKey(inc.date);
    const pts = getIncidentPoints(inc);
    weekPointsMap.set(wKey, (weekPointsMap.get(wKey) || 0) + pts);
  });

  allPositives.forEach((pos) => {
    const wKey = getWeekKey(pos.date);
    const pts = getPositivePoints(pos);
    weekPointsMap.set(wKey, (weekPointsMap.get(wKey) || 0) + pts);
  });

  const cutoff = typeof thresholds?.muyCriticoThreshold === 'number' ? thresholds.muyCriticoThreshold : -20;
  let partes = 0;
  weekPointsMap.forEach((netScore) => {
    if (netScore < cutoff) {
      partes++;
    }
  });

  return partes;
}

// Semáforo dinámico según baremos configurados:
// - Favorable (Verde): puntuación > favorableThreshold (ej. > -10)
// - Crítico (Amarillo): puntuación entre favorableThreshold y muyCriticoThreshold (ej. entre -10 y -20)
// - Muy Crítico (Rojo): puntuación < muyCriticoThreshold (ej. < -20)
export function getStudentSemaforo(
  points: number,
  thresholds?: ConductThresholds
): 'verde' | 'amarillo' | 'roja' {
  const favorable = typeof thresholds?.favorableThreshold === 'number' ? thresholds.favorableThreshold : -10;
  const muyCritico = typeof thresholds?.muyCriticoThreshold === 'number' ? thresholds.muyCriticoThreshold : -20;

  if (points > favorable) return 'verde';
  if (points >= muyCritico) return 'amarillo';
  return 'roja';
}

// Last registered conduct
export function getStudentLastConduct(
  studentName: string,
  incidents: Incident[],
  positives: PositiveBehavior[]
): {
  name: string;
  points: number;
  date: string;
  type: 'positiva' | 'disruptiva';
} | null {
  const normName = studentName.trim().toLowerCase();
  const stIncidents = incidents.filter((inc) => inc.studentName.trim().toLowerCase() === normName);
  const stPositives = positives.filter((pos) => pos.studentName.trim().toLowerCase() === normName);

  interface CombinedEvent {
    name: string;
    points: number;
    date: string;
    type: 'positiva' | 'disruptiva';
    timestamp: number;
  }

  const events: CombinedEvent[] = [];

  stIncidents.forEach((inc) => {
    events.push({
      name: inc.category || inc.description,
      points: getIncidentPoints(inc),
      date: inc.date,
      type: 'disruptiva',
      timestamp: new Date(inc.date + 'T12:00:00').getTime(),
    });
  });

  stPositives.forEach((pos) => {
    events.push({
      name: pos.category || pos.description,
      points: getPositivePoints(pos),
      date: pos.date,
      type: 'positiva',
      timestamp: new Date(pos.date + 'T12:00:00').getTime(),
    });
  });

  if (events.length === 0) return null;

  events.sort((a, b) => b.timestamp - a.timestamp);
  return events[0];
}

export function getStoredStudents(): ClassStudent[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      saveStoredStudents(INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading students from localStorage', e);
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: ClassStudent[]): void {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    students.forEach((st) => {
      saveStudentToFirebase(st).catch((err) => console.log('Firebase sync notice:', err));
    });
  } catch (e) {
    console.error('Error saving students to localStorage', e);
  }
}

export function getStoredPositives(): PositiveBehavior[] {
  try {
    const raw = localStorage.getItem(POSITIVES_KEY);
    if (!raw) {
      saveStoredPositives(INITIAL_POSITIVES);
      return INITIAL_POSITIVES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading positives from localStorage', e);
    return INITIAL_POSITIVES;
  }
}

export function saveStoredPositives(positives: PositiveBehavior[]): void {
  try {
    localStorage.setItem(POSITIVES_KEY, JSON.stringify(positives));
    positives.forEach((p) => {
      savePositiveToFirebase(p).catch((err) => console.log('Firebase sync notice:', err));
    });
  } catch (e) {
    console.error('Error saving positives to localStorage', e);
  }
}


export function getStoredClasses(): SchoolClass[] {
  try {
    const raw = localStorage.getItem(CLASSES_KEY);
    if (!raw) {
      saveStoredClasses(INITIAL_CLASSES);
      return INITIAL_CLASSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading classes from localStorage', e);
    return INITIAL_CLASSES;
  }
}

export function saveStoredClasses(classes: SchoolClass[]): void {
  try {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
    classes.forEach((c) => {
      saveClassToFirebase(c).catch((err) => console.log('Firebase sync notice:', err));
    });
  } catch (e) {
    console.error('Error saving classes to localStorage', e);
  }
}

export function getStoredActiveClass(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CLASS_KEY);
  } catch {
    return null;
  }
}

export function saveStoredActiveClass(className: string | null): void {
  try {
    if (className) {
      localStorage.setItem(ACTIVE_CLASS_KEY, className);
    } else {
      localStorage.removeItem(ACTIVE_CLASS_KEY);
    }
  } catch (e) {
    console.error('Error saving active class', e);
  }
}

export function getStoredTutorConfirmations(): Record<string, TutorParteConfirmation> {
  try {
    const raw = localStorage.getItem(TUTOR_CONFIRMATIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading tutor confirmations from localStorage', e);
    return {};
  }
}

export function saveStoredTutorConfirmation(incidentId: string, confirmation: TutorParteConfirmation): void {
  try {
    const current = getStoredTutorConfirmations();
    current[incidentId] = confirmation;
    localStorage.setItem(TUTOR_CONFIRMATIONS_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Error saving tutor confirmation to localStorage', e);
  }
}

export function getStoredIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(INCIDENTS_KEY);
    const tutorConfirmations = getStoredTutorConfirmations();
    if (!raw) {
      const seeded = INITIAL_INCIDENTS.map((inc) => ({
        ...inc,
        tutorReadConfirmation: tutorConfirmations[inc.id] || inc.tutorReadConfirmation,
      }));
      saveIncidents(seeded);
      return seeded;
    }
    const parsed: Incident[] = JSON.parse(raw);
    return parsed.map((inc) => ({
      ...inc,
      tutorReadConfirmation: tutorConfirmations[inc.id] || inc.tutorReadConfirmation,
    }));
  } catch (e) {
    console.error('Error reading incidents from localStorage', e);
    return INITIAL_INCIDENTS;
  }
}

export function saveIncidents(incidents: Incident[]): void {
  try {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
    batchSaveIncidentsToFirebase(incidents).catch((err) => console.log('Firebase sync notice:', err));
  } catch (e) {
    console.error('Error saving incidents to localStorage', e);
  }
}

export function getStoredProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => ({
          ...p,
          password: p.password || '1234',
          allowedClasses: p.allowedClasses || (p.role === 'Directivo' || p.role === 'Orientador' ? ['ALL'] : ['1º ESO A', '1º ESO B', '2º ESO A', '2º ESO B']),
        }));
      }
    }
  } catch (e) {
    console.error('Error reading profiles from localStorage', e);
  }
  saveStoredProfiles(INITIAL_PROFILES);
  return INITIAL_PROFILES;
}

export function saveStoredProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    profiles.forEach((p) => {
      saveProfileToFirebase(p).catch((err) => console.log('Firebase sync notice:', err));
    });
  } catch (e) {
    console.error('Error saving profiles to localStorage', e);
  }
}

export function isUserAuthorizedForClass(user: UserProfile, className: string): boolean {
  if (user.role === 'Directivo' || user.role === 'Orientador') return true;
  if (!user.allowedClasses || user.allowedClasses.length === 0) return false;
  if (user.allowedClasses.includes('ALL')) return true;
  return user.allowedClasses.includes(className);
}

export function getStoredUser(): UserProfile {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      // Synchronize with stored profiles if available
      const profiles = getStoredProfiles();
      const current = profiles.find((p) => p.id === parsed.id);
      if (current) return current;
      return parsed;
    }
  } catch (e) {
    console.error('Error reading user from localStorage', e);
  }
  const profiles = getStoredProfiles();
  return profiles[0] || INITIAL_PROFILES[0];
}

export function saveStoredUser(user: UserProfile): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Error saving user to localStorage', e);
  }
}

export function getStoredLateArrivals(): LateArrival[] {
  try {
    const raw = localStorage.getItem(LATE_ARRIVALS_KEY);
    if (!raw) {
      saveStoredLateArrivals(INITIAL_LATE_ARRIVALS);
      return INITIAL_LATE_ARRIVALS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading late arrivals from localStorage', e);
    return INITIAL_LATE_ARRIVALS;
  }
}

export function saveStoredLateArrivals(arrivals: LateArrival[]): void {
  try {
    localStorage.setItem(LATE_ARRIVALS_KEY, JSON.stringify(arrivals));
    arrivals.forEach((a) => {
      saveLateArrivalToFirebase(a).catch((err) => console.log('Firebase sync notice:', err));
    });
  } catch (e) {
    console.error('Error saving late arrivals to localStorage', e);
  }
}

export function getStoredLateArrivalConfig(): LateArrivalConfig {
  try {
    const raw = localStorage.getItem(LATE_CONFIG_KEY);
    if (!raw) {
      saveStoredLateArrivalConfig(DEFAULT_LATE_CONFIG);
      return DEFAULT_LATE_CONFIG;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading late arrival config from localStorage', e);
    return DEFAULT_LATE_CONFIG;
  }
}

export function saveStoredLateArrivalConfig(config: LateArrivalConfig): void {
  try {
    localStorage.setItem(LATE_CONFIG_KEY, JSON.stringify(config));
    saveCenterLateConfigToFirebase(config).catch((err) => console.log('Firebase sync notice:', err));
  } catch (e) {
    console.error('Error saving late arrival config to localStorage', e);
  }
}

export function resetToSampleData(): Incident[] {
  saveIncidents(INITIAL_INCIDENTS);
  saveStoredLateArrivals(INITIAL_LATE_ARRIVALS);
  saveStoredLateArrivalConfig(DEFAULT_LATE_CONFIG);
  return INITIAL_INCIDENTS;
}
