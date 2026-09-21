export type SeverityLevel = 'Leve' | 'Grave' | 'Muy Grave';

export type IncidentStatus = 'Abierta' | 'En seguimiento' | 'Medida cumplida' | 'Cerrada';

export type UserRole = 'Profesor' | 'Tutor' | 'Directivo' | 'Orientador';

export type BehaviorCategory = 'positiva' | 'disruptiva';

export interface BehaviorType {
  id: string;
  name: string;
  type: BehaviorCategory;
  points: number; // Positive for positive conducts (> 0), negative for disruptive conducts (< 0)
  description?: string;
  isCustom?: boolean;
  active?: boolean; // Estado activo/inactivo (por defecto true)
  className?: string; // Si la conducta está personalizada para un aula específica
}

export interface ConductThresholds {
  favorableThreshold: number; // Puntuación superior a este valor => Favorable (Verde, ej: -10)
  criticoThreshold: number;   // Puntuación entre favorable y muy crítico => Crítico (Amarillo, ej: -20)
  muyCriticoThreshold: number; // Puntuación inferior a este valor => Muy Crítico (Rojo, ej: -20)
}

export interface ClassConductConfig {
  className: string;
  behaviorTypes: BehaviorType[];
  thresholds: ConductThresholds;
  isCustomized: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  subject?: string;
  course?: string;
  avatarColor: string;
  password?: string; // Clave personal de acceso (por defecto '1234')
  allowedClasses?: string[]; // Clases autorizadas por dirección (o ['ALL'] para acceso a todas)
}

export interface Incident {
  id: string;
  studentName: string;
  studentGroup: string; // e.g. "2º ESO B"
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "2ª Hora (9:00 - 10:00)"
  subject: string; // e.g. "Matemáticas"
  teacherName: string; // e.g. "Carlos Ruiz"
  teacherRole: UserRole;
  category: string; // e.g. "Interrupción reiterada", "Falta de respeto", etc.
  severity: SeverityLevel;
  description: string;
  location: string; // "Aula", "Patio", "Pasillo", "Laboratorio", "Biblioteca"
  immediateMeasure: string; // Medida correctora aplicada
  directivoNotes?: string; // Notas de jefatura / orientación
  status: IncidentStatus;
  familyNotified: boolean;
  points?: number; // Puntuación negativa (e.g. -5, -15, -30)
  behaviorTypeId?: string;
  tutorReadConfirmation?: TutorParteConfirmation; // Confirmación de lectura por el tutor/a
  createdAt: string;
  updatedAt: string;
}

export interface TutorParteConfirmation {
  confirmed: boolean;
  tutorName: string;
  confirmedAt: string; // ISO string
  notes?: string;
}

export interface StudentStats {
  studentName: string;
  studentGroup: string;
  totalIncidents: number;
  leves: number;
  graves: number;
  muyGraves: number;
  lastIncidentDate: string;
  needsIntervention: boolean;
  recentCategories: string[];
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "1º ESO A"
  stage: 'ESO' | 'Bachillerato' | 'FP' | 'Primaria';
  cycle?: '1º Ciclo ESO' | '2º Ciclo ESO' | 'Bachillerato' | 'Otros';
  room: string; // e.g. "Aula 101"
  tutorName: string;
  password: string; // Contraseña requerida para acceder
  color: string;
  description?: string;
  isHidden?: boolean; // Indica si el aula está oculta/archivada por no estar utilizándose
}

export interface ClassStudent {
  id: string;
  name: string;
  className: string;
  avatarColor?: string;
  positivePoints: number;
  negativePoints: number;
  conductNotes?: string;
}

export interface PositiveBehavior {
  id: string;
  studentName: string;
  studentGroup: string;
  date: string;
  category: string;
  description: string;
  teacherName: string;
  points: number; // Positive points (e.g. +2, +5)
  behaviorTypeId?: string;
}

export interface StudentWeeklySummary {
  student: ClassStudent;
  weeklyPoints: number;
  coursePoints: number;
  semaforo: 'verde' | 'amarillo' | 'roja';
  partesCount: number;
  partesSemana?: number;
  lastConduct?: {
    name: string;
    points: number;
    date: string;
    type: BehaviorCategory;
  };
}

export interface ExcelColumnMapping {
  studentName: string;
  studentGroup: string;
  date: string;
  timeSlot?: string;
  subject?: string;
  teacherName?: string;
  category: string;
  severity?: string;
  description: string;
  location?: string;
  immediateMeasure?: string;
  status?: string;
  familyNotified?: string;
}

export interface LateArrival {
  id: string;
  studentName: string;
  studentGroup: string; // e.g. "2º ESO B"
  date: string; // YYYY-MM-DD
  arrivalTime: string; // e.g. "08:25"
  expectedTime?: string; // e.g. "08:00"
  minutesLate: number; // e.g. 25
  justified: boolean;
  reason?: string;
  recordedBy: string;
  familyNotified: boolean;
  notes?: string;
  createdAt: string;
}

export interface LateArrivalConfig {
  warningThreshold: number; // Número límite de retrasos para disparar aviso (ej. 3)
  notifyFamilyOnThreshold: boolean;
  defaultExpectedTime: string; // ej. "08:00"
}
