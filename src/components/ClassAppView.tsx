import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Award,
  Search,
  Plus,
  PlusCircle,
  ArrowLeft,
  Smartphone,
  Monitor,
  CheckCircle2,
  FileSpreadsheet,
  Star,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  LayoutDashboard,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Check,
  TrendingDown,
  Activity,
  UserCheck,
  Scale,
  SlidersHorizontal,
  Sliders,
  BarChart2,
  History,
  FileText,
  X,
} from 'lucide-react';
import {
  Incident,
  SchoolClass,
  ClassStudent,
  PositiveBehavior,
  UserProfile,
  IncidentStatus,
  BehaviorType,
  StudentWeeklySummary,
  ClassConductConfig,
  ConductThresholds,
} from '../types';
import { AddPositiveModal } from './AddPositiveModal';
import { AddStudentModal } from './AddStudentModal';
import { EditStudentModal } from './EditStudentModal';
import { StudentBaremoModal } from './StudentBaremoModal';
import { ClassIncidentConfigTab } from './ClassIncidentConfigTab';
import {
  getMondayOfActiveWeek,
  formatWeekRange,
  isDateInActiveWeek,
  getStudentWeeklyPoints,
  getStudentCoursePoints,
  getStudentPartesCount,
  getStudentSemaforo,
  getStudentLastConduct,
  getIncidentPoints,
  getPositivePoints,
  getClassConductConfig,
  saveClassConductConfig,
  resetClassConductConfigToDefault,
} from '../utils/storage';

interface ClassAppViewProps {
  schoolClass: SchoolClass;
  classes?: SchoolClass[];
  incidents: Incident[];
  students: ClassStudent[];
  positives: PositiveBehavior[];
  currentUser: UserProfile;
  behaviorTypes?: BehaviorType[];
  onAddBehaviorType?: (type: Omit<BehaviorType, 'id'>) => void;
  onUpdateBehaviorType?: (type: BehaviorType) => void;
  onDeleteBehaviorType?: (id: string) => void;
  onChangeClass: () => void;
  onSelectIncident: (incident: Incident) => void;
  onOpenStudentProfile: (studentName: string) => void;
  onOpenNewIncident: (studentName?: string) => void;
  onSavePositive: (positive: Omit<PositiveBehavior, 'id'>) => void;
  onAddStudent: (student: Omit<ClassStudent, 'id'>) => void;
  onUpdateStudent?: (student: ClassStudent) => void;
  onDeleteStudent?: (studentId: string) => void;
  onExportClassExcel: () => void;
}

export const ClassAppView: React.FC<ClassAppViewProps> = ({
  schoolClass,
  classes = [],
  incidents,
  students,
  positives,
  currentUser,
  behaviorTypes = [],
  onAddBehaviorType,
  onUpdateBehaviorType,
  onDeleteBehaviorType,
  onChangeClass,
  onSelectIncident,
  onOpenStudentProfile,
  onOpenNewIncident,
  onSavePositive,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onExportClassExcel,
}) => {
  // Class-specific conduct & threshold configuration
  const [classConductConfig, setClassConductConfig] = useState<ClassConductConfig>(() =>
    getClassConductConfig(schoolClass.name)
  );

  // Sync config whenever active class changes
  useEffect(() => {
    setClassConductConfig(getClassConductConfig(schoolClass.name));
  }, [schoolClass.name]);

  // Permission check: Configuración Incidencias is visible ONLY for Tutor and Dirección
  const canAccessIncidentConfig = currentUser.role === 'Tutor' || currentUser.role === 'Directivo';

  // Tabs: Resumen, Configuración Incidencias (Tutor/Dirección), Tendencias
  const [activeTab, setActiveTab] = useState<'resumen' | 'configuracion' | 'tendencias'>('resumen');

  // Fallback to resumen if ordinary teacher somehow selects configuration
  useEffect(() => {
    if (activeTab === 'configuracion' && !canAccessIncidentConfig) {
      setActiveTab('resumen');
    }
  }, [activeTab, canAccessIncidentConfig]);

  // Mobile / Desktop frame toggle
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  // Active week starting Monday for the Resumen tab metrics
  const [activeMonday, setActiveMonday] = useState<Date>(() => getMondayOfActiveWeek(new Date()));

  // Modals for Student Baremo
  const [baremoStudent, setBaremoStudent] = useState<ClassStudent | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'both' | 'semana' | 'curso'>('both');
  const [studentResumenSearch, setStudentResumenSearch] = useState('');

  // Search & Filter in Registro de Incidencias tab
  const [incidentSearch, setIncidentSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'Leve' | 'Grave' | 'Muy Grave'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | IncidentStatus>('ALL');

  // Modals inside class app
  const [positiveModalStudent, setPositiveModalStudent] = useState<ClassStudent | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<ClassStudent | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<ClassStudent | null>(null);

  // Filter students for this class
  const classStudents = useMemo(() => {
    let deletedSet = new Set<string>();
    try {
      const rawDeleted = localStorage.getItem('aula_conductas_deleted_students_v1');
      if (rawDeleted) {
        deletedSet = new Set<string>(JSON.parse(rawDeleted));
      }
    } catch {}

    return students.filter(
      (s) =>
        s.className.toLowerCase() === schoolClass.name.toLowerCase() &&
        !deletedSet.has(s.id) &&
        !deletedSet.has(`${s.className.toLowerCase()}__${s.name.trim().toLowerCase()}`)
    );
  }, [students, schoolClass.name]);

  // Filter incidents for this class (strictly for active enrolled students in this class)
  const classIncidents = useMemo(() => {
    const validStudentNames = new Set(classStudents.map((s) => s.name.trim().toLowerCase()));
    return incidents.filter(
      (i) =>
        i.studentGroup.toLowerCase() === schoolClass.name.toLowerCase() &&
        validStudentNames.has(i.studentName.trim().toLowerCase())
    );
  }, [incidents, schoolClass.name, classStudents]);

  // Filter positives for this class (strictly for active enrolled students in this class)
  const classPositives = useMemo(() => {
    const validStudentNames = new Set(classStudents.map((s) => s.name.trim().toLowerCase()));
    return positives.filter(
      (p) =>
        p.studentGroup.toLowerCase() === schoolClass.name.toLowerCase() &&
        validStudentNames.has(p.studentName.trim().toLowerCase())
    );
  }, [positives, schoolClass.name, classStudents]);

  // Quick incident count per student map
  const incidentsPerStudent = useMemo(() => {
    const map = new Map<string, number>();
    classIncidents.forEach((inc) => {
      const name = inc.studentName.trim().toLowerCase();
      map.set(name, (map.get(name) || 0) + 1);
    });
    return map;
  }, [classIncidents]);

  // Positives count per student map
  const positivesPerStudent = useMemo(() => {
    const map = new Map<string, number>();
    classPositives.forEach((pos) => {
      const name = pos.studentName.trim().toLowerCase();
      map.set(name, (map.get(name) || 0) + pos.points);
    });
    return map;
  }, [classPositives]);

  // Severity counts
  const severityCounts = useMemo(() => {
    let leves = 0;
    let graves = 0;
    let muyGraves = 0;
    classIncidents.forEach((inc) => {
      if (inc.severity === 'Leve') leves++;
      else if (inc.severity === 'Grave') graves++;
      else if (inc.severity === 'Muy Grave') muyGraves++;
    });
    return { leves, graves, muyGraves };
  }, [classIncidents]);

  // Status counts
  const statusCounts = useMemo(() => {
    let abiertas = 0;
    let seguimiento = 0;
    let resueltas = 0;
    classIncidents.forEach((inc) => {
      if (inc.status === 'Abierta') abiertas++;
      else if (inc.status === 'En seguimiento') seguimiento++;
      else resueltas++;
    });
    return { abiertas, seguimiento, resueltas };
  }, [classIncidents]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return classIncidents.filter((inc) => {
      if (incidentSearch.trim()) {
        const q = incidentSearch.toLowerCase();
        const matches =
          inc.studentName.toLowerCase().includes(q) ||
          inc.description.toLowerCase().includes(q) ||
          inc.teacherName.toLowerCase().includes(q) ||
          inc.subject.toLowerCase().includes(q) ||
          inc.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [classIncidents, incidentSearch, severityFilter, statusFilter]);

  // Top conduct categories in this class
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    classIncidents.forEach((inc) => {
      counts.set(inc.category, (counts.get(inc.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [classIncidents]);

  const totalPositivePoints = useMemo(() => {
    return classPositives.reduce((acc, p) => acc + p.points, 0);
  }, [classPositives]);

  // Week navigation helpers
  const handlePrevWeek = () => {
    setActiveMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setActiveMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setActiveMonday(getMondayOfActiveWeek(new Date()));
  };

  // Weekly incidents and positives for the active week starting Monday
  const weeklyIncidents = useMemo(() => {
    return classIncidents.filter((inc) => isDateInActiveWeek(inc.date, activeMonday));
  }, [classIncidents, activeMonday]);

  const weeklyPositives = useMemo(() => {
    return classPositives.filter((pos) => isDateInActiveWeek(pos.date, activeMonday));
  }, [classPositives, activeMonday]);

  const numIncidenciasNegativasSemana = weeklyIncidents.length;
  const numIncidenciasPositivasSemana = weeklyPositives.length;
  const totalIncidenciasSemana = numIncidenciasNegativasSemana + numIncidenciasPositivasSemana;

  // Student weekly summaries and baremo calculations
  const studentWeeklySummaries: StudentWeeklySummary[] = useMemo(() => {
    return classStudents.map((st) => {
      const weeklyPoints = getStudentWeeklyPoints(st.name, classIncidents, classPositives, activeMonday);
      const coursePoints = getStudentCoursePoints(
        st.name,
        classIncidents,
        classPositives,
        st.positivePoints - st.negativePoints
      );
      const semaforo = getStudentSemaforo(weeklyPoints, classConductConfig.thresholds);
      const partesCount = getStudentPartesCount(st.name, classIncidents, classPositives, classConductConfig.thresholds);
      const muyCriticoThreshold = classConductConfig.thresholds?.muyCriticoThreshold ?? -20;
      const partesSemana = weeklyPoints < muyCriticoThreshold ? 1 : 0;
      const lastConduct = getStudentLastConduct(st.name, classIncidents, classPositives);

      return {
        student: st,
        weeklyPoints,
        coursePoints,
        semaforo,
        partesCount,
        partesSemana,
        lastConduct: lastConduct || undefined,
      };
    });
  }, [classStudents, classIncidents, classPositives, activeMonday, classConductConfig.thresholds]);

  // Dynamic counts of students by weekly score status according to configured thresholds
  const favorableStudentsCount = useMemo(() => {
    return studentWeeklySummaries.filter((s) => s.weeklyPoints > classConductConfig.thresholds.favorableThreshold).length;
  }, [studentWeeklySummaries, classConductConfig.thresholds.favorableThreshold]);

  const criticalStudentsCount = useMemo(() => {
    return studentWeeklySummaries.filter(
      (s) =>
        s.weeklyPoints <= classConductConfig.thresholds.favorableThreshold &&
        s.weeklyPoints >= classConductConfig.thresholds.muyCriticoThreshold
    ).length;
  }, [studentWeeklySummaries, classConductConfig.thresholds.favorableThreshold, classConductConfig.thresholds.muyCriticoThreshold]);

  const veryCriticalStudentsCount = useMemo(() => {
    return studentWeeklySummaries.filter((s) => s.weeklyPoints < classConductConfig.thresholds.muyCriticoThreshold).length;
  }, [studentWeeklySummaries, classConductConfig.thresholds.muyCriticoThreshold]);

  // Frequency of conducts in the active week (for horizontal bar chart)
  const weeklyConductFrequencies = useMemo(() => {
    interface FreqItem {
      name: string;
      type: 'positiva' | 'disruptiva';
      count: number;
      points: number;
    }
    const map = new Map<string, FreqItem>();

    weeklyIncidents.forEach((inc) => {
      const key = inc.category || inc.description;
      const pts = getIncidentPoints(inc);
      const cur = map.get(key) || { name: key, type: 'disruptiva', count: 0, points: pts };
      cur.count += 1;
      map.set(key, cur);
    });

    weeklyPositives.forEach((pos) => {
      const key = pos.category || pos.description;
      const pts = getPositivePoints(pos);
      const cur = map.get(key) || { name: key, type: 'positiva', count: 0, points: pts };
      cur.count += 1;
      map.set(key, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [weeklyIncidents, weeklyPositives]);

  // Frequency of conducts from the start of the course (for horizontal bar chart)
  const courseConductFrequencies = useMemo(() => {
    interface FreqItem {
      name: string;
      type: 'positiva' | 'disruptiva';
      count: number;
      points: number;
    }
    const map = new Map<string, FreqItem>();

    classIncidents.forEach((inc) => {
      const key = inc.category || inc.description;
      const pts = getIncidentPoints(inc);
      const cur = map.get(key) || { name: key, type: 'disruptiva', count: 0, points: pts };
      cur.count += 1;
      map.set(key, cur);
    });

    classPositives.forEach((pos) => {
      const key = pos.category || pos.description;
      const pts = getPositivePoints(pos);
      const cur = map.get(key) || { name: key, type: 'positiva', count: 0, points: pts };
      cur.count += 1;
      map.set(key, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [classIncidents, classPositives]);

  // Filtered student summaries for the Resumen tab table
  const filteredStudentSummaries = useMemo(() => {
    return studentWeeklySummaries.filter((sum) => {
      if (!studentResumenSearch.trim()) return true;
      const q = studentResumenSearch.toLowerCase();
      return sum.student.name.toLowerCase().includes(q);
    });
  }, [studentWeeklySummaries, studentResumenSearch]);

  // Day of week distribution for Tendencias
  const dayDistribution = useMemo(() => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const counts: Record<string, number> = {
      Lunes: 0,
      Martes: 0,
      Miércoles: 0,
      Jueves: 0,
      Viernes: 0,
    };

    classIncidents.forEach((inc) => {
      if (!inc.date) return;
      const d = new Date(inc.date);
      const dayNum = d.getDay(); // 0 is Sunday, 1 is Monday...
      if (dayNum >= 1 && dayNum <= 5) {
        counts[days[dayNum - 1]]++;
      }
    });

    const maxVal = Math.max(...Object.values(counts), 1);
    return days.map((day) => ({
      day,
      count: counts[day],
      percentage: Math.round((counts[day] / maxVal) * 100),
    }));
  }, [classIncidents]);

  // Top subjects with incidents
  const subjectDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    classIncidents.forEach((inc) => {
      const subj = inc.subject || 'Sin materia';
      counts.set(subj, (counts.get(subj) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [classIncidents]);

  // Time slot distribution
  const timeSlotDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    classIncidents.forEach((inc) => {
      const slot = inc.timeSlot || 'Otras horas';
      counts.set(slot, (counts.get(slot) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [classIncidents]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Controls: Return to classes + View mode switcher + Excel export */}
      <div className="w-full max-w-5xl mb-4 flex items-center justify-between px-2">
        <button
          onClick={onChangeClass}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Portal de Clases</span>
        </button>

        <div className="flex items-center gap-2">
          {/* View frame switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs text-xs font-semibold text-slate-600">
            <button
              onClick={() => setIsPhoneFrame(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                !isPhoneFrame ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista estándar"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Escritorio</span>
            </button>
            <button
              onClick={() => setIsPhoneFrame(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                isPhoneFrame ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista estilo App Móvil"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Modo App Móvil</span>
            </button>
          </div>

          <button
            onClick={onExportClassExcel}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Descargar registro de conductas en Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel {schoolClass.name}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-md bg-slate-900 p-3.5 rounded-[44px] shadow-2xl border-4 border-slate-800'
            : 'max-w-5xl'
        }`}
      >
        <div
          className={`bg-white overflow-hidden ${
            isPhoneFrame ? 'rounded-[32px] min-h-[720px] flex flex-col' : 'rounded-2xl border border-slate-200 shadow-sm'
          }`}
        >
          {/* Class Hero Header: Clean, focused identity without conduct strip */}
          <div
            className={`relative p-5 sm:p-6 text-white bg-gradient-to-r ${
              schoolClass.color || 'from-indigo-600 to-blue-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-white mb-2">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {schoolClass.stage}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {schoolClass.name}
                </h1>
                <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>📍 {schoolClass.room}</span>
                  <span>👤 Tutor/a: {schoolClass.tutorName}</span>
                </p>
              </div>

              {/* Botón de acceso bien visible a + Registrar Conducta */}
              <button
                id="btn-class-header-new-incident"
                onClick={() => onOpenNewIncident()}
                className="self-start sm:self-center px-4 py-2.5 bg-white text-slate-900 hover:bg-amber-50 text-xs sm:text-sm font-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 border-2 border-white/80 active:scale-95 cursor-pointer ring-4 ring-white/20 shrink-0"
                title="Registrar nueva conducta (disruptiva o positiva) para esta clase"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
                <span className="tracking-tight text-slate-950 font-extrabold">+ Registrar Conducta</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar with User-Requested Tabs: Estado y Convivencia General del Aula; Configuración Incidencias; Tendencias */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
            <button
              id="tab-btn-resumen"
              onClick={() => setActiveTab('resumen')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'resumen'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Estado y Convivencia General del Aula</span>
            </button>

            {/* TAB: Configuración Incidencias - Visible únicamente para Tutor y Dirección */}
            {canAccessIncidentConfig && (
              <button
                id="tab-btn-config-incidencias"
                onClick={() => setActiveTab('configuracion')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'configuracion'
                    ? 'bg-slate-900 text-white shadow-xs ring-2 ring-indigo-400/40'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Configuración Incidencias</span>
                {classConductConfig.isCustomized && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Personalizada para esta clase" />
                )}
              </button>
            )}

            <button
              id="tab-btn-tendencias"
              onClick={() => setActiveTab('tendencias')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'tendencias'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Tendencias</span>
            </button>
          </div>

          {/* TAB 1: RESUMEN */}
          {activeTab === 'resumen' && (
            <div className="p-4 sm:p-5 space-y-5 flex-1">
              {/* Apartado 1: Estado y Convivencia General del Aula (Antes del listado de alumnos) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                {/* Header with week selector and config buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-black text-slate-900">
                        Estado y Convivencia General del Aula
                      </h3>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Métricas semanales activas y baremo de convivencia para {schoolClass.name}
                    </p>
                  </div>

                  {/* Week Navigator + Catalog button */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
                      <button
                        onClick={handlePrevWeek}
                        className="p-1 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                        title="Semana anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-2.5 whitespace-nowrap text-slate-800">
                        {formatWeekRange(activeMonday)}
                      </span>
                      <button
                        onClick={handleNextWeek}
                        className="p-1 rounded-lg hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                        title="Semana siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleCurrentWeek}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      Esta Semana
                    </button>
                  </div>
                </div>

                {/* The 4 User-Requested Metrics in the exact same line */}
                <div className="overflow-x-auto pb-1 scrollbar-none">
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-3 min-w-[620px] sm:min-w-0">
                    {/* Card 1: Número de incidencias registradas en la semana (desglosado) */}
                    <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs space-y-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block truncate">
                          Incidencias en la Semana
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            {totalIncidenciasSemana}
                          </span>
                          <span className="text-[11px] text-slate-700 font-bold">registradas</span>
                        </div>
                      </div>
                      {/* Desglose por positivas y negativas */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-lg whitespace-nowrap">
                          <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{numIncidenciasPositivasSemana} pos.</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 sm:px-2 py-0.5 rounded-lg whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{numIncidenciasNegativasSemana} neg.</span>
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Alumnos en Estado Favorable (> -10 pts) */}
                    <div className="bg-emerald-50/50 rounded-2xl p-3 sm:p-3.5 border border-emerald-200 shadow-2xs space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
                            Estado Favorable
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs ring-4 ring-emerald-100 shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                            {favorableStudentsCount}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            {favorableStudentsCount === 1 ? 'alumno' : 'alumnos'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-200/60">
                        <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium truncate">
                          Puntuación <strong>&gt; {classConductConfig.thresholds.favorableThreshold} pts</strong>
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Alumnos en Estado Crítico */}
                    <div className="bg-amber-50/50 rounded-2xl p-3 sm:p-3.5 border border-amber-200 shadow-2xs space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
                            Estado Crítico
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs ring-4 ring-amber-100 shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-amber-700">
                            {criticalStudentsCount}
                          </span>
                          <span className="text-[11px] text-amber-600 font-semibold">
                            {criticalStudentsCount === 1 ? 'alumno' : 'alumnos'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-amber-200/60">
                        <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium truncate">
                          Entre <strong>{classConductConfig.thresholds.muyCriticoThreshold} y {classConductConfig.thresholds.favorableThreshold} pts</strong>
                        </p>
                      </div>
                    </div>

                    {/* Card 4: Alumnos en Estado Muy Crítico */}
                    <div className="bg-rose-50/60 rounded-2xl p-3 sm:p-3.5 border border-rose-200 shadow-2xs space-y-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block truncate">
                            Estado Muy Crítico
                          </span>
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs ring-4 ring-rose-100 animate-pulse shrink-0" />
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-rose-700">
                            {veryCriticalStudentsCount}
                          </span>
                          <span className="text-[11px] text-rose-600 font-semibold">
                            {veryCriticalStudentsCount === 1 ? 'alumno' : 'alumnos'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-rose-200/60">
                        <p className="text-[10px] sm:text-[11px] text-rose-700 font-medium truncate">
                          Inferior a <strong>&lt; {classConductConfig.thresholds.muyCriticoThreshold} pts</strong> (Parte)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apartado 2: Listado de los alumnos con baremo, semáforo, puntos del curso, partes y última conducta */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Listado de Alumnos y Baremos de Convivencia</span>
                    </h3>
                    <p className="text-xs text-slate-700 font-medium">
                      Puntuación activa desde el lunes, semáforo disciplinario y partes de la semana (haz clic en cualquier fila para abrir la ficha de conductas)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar alumno..."
                        value={studentResumenSearch}
                        onChange={(e) => setStudentResumenSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 w-40 sm:w-56"
                      />
                    </div>

                    <button
                      onClick={() => setIsAddStudentOpen(true)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap"
                      title="Añadir nuevo alumno al grupo"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Añadir Alumno</span>
                    </button>
                  </div>
                </div>

                {/* Table of Students with requested columns */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        <th className="py-3 px-3.5">Alumno</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">
                          Puntos Semana (desde Lunes)
                        </th>
                        <th className="py-3 px-3 text-center">Semáforo</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">
                          Puntos Curso
                        </th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">
                          Partes semana
                        </th>
                        <th className="py-3 px-3 text-right pr-4 whitespace-nowrap">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudentSummaries.map((summary) => {
                        const { student, weeklyPoints, coursePoints, semaforo, partesSemana, partesCount } = summary;

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                            onClick={() => setBaremoStudent(student)}
                            title="Haz clic para ver la ficha completa de conductas del alumno"
                          >
                            {/* Alumno */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-xl ${
                                    student.avatarColor || 'bg-blue-600'
                                  } text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                                >
                                  {student.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate">
                                    {student.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {student.className}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Puntos acumulados semana activa */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block font-black text-xs px-2.5 py-1 rounded-lg ${
                                  weeklyPoints > 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : weeklyPoints < 0
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {weeklyPoints > 0 ? `+${weeklyPoints}` : weeklyPoints} pts
                              </span>
                            </td>

                            {/* Semáforo: Verde (< -20 penalización / > -20 pts), Amarillo (-20 a -50), Roja (< -50) */}
                            <td className="py-3 px-3 text-center">
                              {semaforo === 'verde' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                                  <span>Verde</span>
                                </span>
                              )}
                              {semaforo === 'amarillo' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                                  <span>Amarillo</span>
                                </span>
                              )}
                              {semaforo === 'roja' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold animate-pulse">
                                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-200" />
                                  <span>Rojo</span>
                                </span>
                              )}
                            </td>

                            {/* Total puntos acumulados desde inicio del curso */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`font-bold text-xs ${
                                  coursePoints > 0
                                    ? 'text-indigo-600'
                                    : coursePoints < 0
                                    ? 'text-rose-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                {coursePoints > 0 ? `+${coursePoints}` : coursePoints} pts
                              </span>
                            </td>

                            {/* Partes semana */}
                            <td className="py-3 px-3 text-center">
                              {(partesSemana ?? 0) > 0 ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-black text-xs border border-rose-200"
                                  title={`1 parte generado esta semana por puntuación inferior a ${classConductConfig.thresholds?.muyCriticoThreshold ?? -20} pts (Total curso: ${partesCount})`}
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                  <span>{partesSemana} {partesSemana === 1 ? 'parte' : 'partes'}</span>
                                </span>
                              ) : (
                                <span
                                  className="text-slate-400 font-medium text-xs"
                                  title={partesCount > 0 ? `0 partes esta semana (${partesCount} acumulados en el curso)` : 'Sin partes'}
                                >
                                  0 partes
                                </span>
                              )}
                            </td>

                            {/* Acciones: Editar / Eliminar */}
                            <td
                              className="py-3 px-3 text-right pr-4 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingStudent(student)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title={`Editar datos de ${student.name}`}
                                  aria-label={`Editar ${student.name}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStudentToDelete(student)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={`Eliminar a ${student.name} del aula`}
                                  aria-label={`Eliminar a ${student.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredStudentSummaries.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Users className="w-7 h-7 text-slate-300 stroke-[1.5]" />
                              <p className="font-semibold text-slate-600">
                                {studentResumenSearch
                                  ? 'No se encontraron alumnos con el filtro actual.'
                                  : 'No hay alumnos registrados en esta clase.'}
                              </p>
                              {!studentResumenSearch && (
                                <p className="text-xs text-slate-400 max-w-sm">
                                  Pulsa en "+ Añadir Alumno" para dar de alta alumnos en este grupo.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Legend for traffic light */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700">Criterio Semáforo:</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Verde (&gt; {classConductConfig.thresholds.favorableThreshold} pts)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Amarillo ({classConductConfig.thresholds.muyCriticoThreshold} a {classConductConfig.thresholds.favorableThreshold} pts)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Rojo (&lt; {classConductConfig.thresholds.muyCriticoThreshold} pts)</span>
                    </span>
                  </div>
                  <span className="italic text-slate-400">
                    * El alumno recibe 1 parte por cada semana con puntuación inferior a {classConductConfig.thresholds.muyCriticoThreshold} pts.
                  </span>
                </div>
              </div>

              {/* Apartado 3: Dos Gráficos de Barras Horizontales con frecuencia de conductas */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                      <span>Frecuencia de Conductas Registradas</span>
                    </h3>
                    <p className="text-xs text-slate-700 font-medium">
                      Comparativa gráfica de conductas registradas en la semana activa vs. todo el curso escolar
                    </p>
                  </div>

                  {/* Filter pills for charts */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                    <button
                      onClick={() => setActiveChartTab('both')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeChartTab === 'both' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                      }`}
                    >
                      Ambos Gráficos
                    </button>
                    <button
                      onClick={() => setActiveChartTab('semana')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeChartTab === 'semana' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                      }`}
                    >
                      Semana Activa
                    </button>
                    <button
                      onClick={() => setActiveChartTab('curso')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeChartTab === 'curso' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                      }`}
                    >
                      Todo el Curso
                    </button>
                  </div>
                </div>

                {/* Grid for the two horizontal bar charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Gráfico 1: Frecuencia de conductas en la semana */}
                  {(activeChartTab === 'both' || activeChartTab === 'semana') && (
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Conductas en la Semana Activa</span>
                          </h4>
                          <span className="text-[11px] text-slate-700">
                            {formatWeekRange(activeMonday)} • {totalIncidenciasSemana} registros
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          Semanal
                        </span>
                      </div>

                      {/* Horizontal Bars */}
                      <div className="space-y-3 pt-1">
                        {weeklyConductFrequencies.map((item, idx) => {
                          const maxWeekly = Math.max(...weeklyConductFrequencies.map((i) => i.count), 1);
                          const pct = Math.round((item.count / maxWeekly) * 100);

                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                  <span className="text-slate-400 font-mono text-[10px] shrink-0">
                                    #{idx + 1}
                                  </span>
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      item.type === 'positiva' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                  />
                                  <span className="font-bold text-slate-800 truncate" title={item.name}>
                                    {item.name}
                                  </span>
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                                      item.type === 'positiva'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {item.points > 0 ? `+${item.points}` : `${item.points}`} pts
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-black text-slate-900 text-xs">
                                    {item.count} {item.count === 1 ? 'vez' : 'veces'}
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    item.type === 'positiva'
                                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                                  }`}
                                  style={{ width: `${Math.max(pct, 6)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {weeklyConductFrequencies.length === 0 && (
                          <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="font-semibold text-slate-700">
                              Sin conductas registradas en esta semana.
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Usa el botón "+ Registrar Conducta" para anotar incidencias o reconocimientos.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gráfico 2: Frecuencia de conductas desde el inicio de curso */}
                  {(activeChartTab === 'both' || activeChartTab === 'curso') && (
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Conductas desde el Inicio de Curso</span>
                          </h4>
                          <span className="text-[11px] text-slate-700">
                            Histórico acumulado • {classIncidents.length + classPositives.length} registros totales
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          Anual
                        </span>
                      </div>

                      {/* Horizontal Bars */}
                      <div className="space-y-3 pt-1">
                        {courseConductFrequencies.map((item, idx) => {
                          const maxCourse = Math.max(...courseConductFrequencies.map((i) => i.count), 1);
                          const pct = Math.round((item.count / maxCourse) * 100);

                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                  <span className="text-slate-400 font-mono text-[10px] shrink-0">
                                    #{idx + 1}
                                  </span>
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      item.type === 'positiva' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                  />
                                  <span className="font-bold text-slate-800 truncate" title={item.name}>
                                    {item.name}
                                  </span>
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                                      item.type === 'positiva'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {item.points > 0 ? `+${item.points}` : `${item.points}`} pts
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-black text-slate-900 text-xs">
                                    {item.count} {item.count === 1 ? 'vez' : 'veces'}
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    item.type === 'positiva'
                                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                                  }`}
                                  style={{ width: `${Math.max(pct, 6)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {courseConductFrequencies.length === 0 && (
                          <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="font-semibold text-slate-700">
                              Sin conductas registradas en el curso escolar.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIGURACIÓN INCIDENCIAS (Visible únicamente para Tutor y Dirección) */}
          {activeTab === 'configuracion' && canAccessIncidentConfig && (
            <ClassIncidentConfigTab
              schoolClass={schoolClass}
              classes={classes.length > 0 ? classes : [schoolClass]}
              currentUser={currentUser}
              incidents={incidents}
              positives={positives}
              students={students}
              classConfig={classConductConfig}
              onSaveClassConfig={(updated) => {
                saveClassConductConfig(updated);
                setClassConductConfig(updated);
              }}
              onResetClassConfig={() => {
                const def = resetClassConductConfigToDefault(schoolClass.name);
                setClassConductConfig(def);
              }}
              onSelectIncident={onSelectIncident}
              onOpenStudentProfile={onOpenStudentProfile}
            />
          )}

          {/* TAB: TENDENCIAS */}
          {activeTab === 'tendencias' && (
            <div className="p-4 sm:p-5 space-y-4 flex-1">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Patrones y Tendencias de Conducta • {schoolClass.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Análisis cronológico y temporal para prevención temprana e intervenciones pedagógicas.
                  </p>
                </div>
              </div>

              {/* Grid 1: Days of week + Subjects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Incidents by Day of Week */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Distribución por Día de la Semana</span>
                  </h4>

                  <div className="space-y-2.5 pt-1">
                    {dayDistribution.map((item) => (
                      <div key={item.day} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{item.day}</span>
                          <span className="font-bold text-slate-900">
                            {item.count} {item.count === 1 ? 'parte' : 'partes'}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Incidents by Subject */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Materias con Mayor Incidencia</span>
                  </h4>

                  <div className="space-y-2 pt-1">
                    {subjectDistribution.map(([subj, count]) => (
                      <div key={subj} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                        <span className="font-semibold text-slate-800 truncate pr-2">{subj}</span>
                        <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                          {count} {count === 1 ? 'parte' : 'partes'}
                        </span>
                      </div>
                    ))}

                    {subjectDistribution.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        Sin incidencias por materia registradas
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 2: Hourly distribution & Conduct categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time slot breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-500" />
                    <span>Franjas Horarias Críticas</span>
                  </h4>

                  <div className="space-y-2 pt-1">
                    {timeSlotDistribution.map(([slot, count]) => (
                      <div key={slot} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                        <span className="font-semibold text-slate-800 truncate pr-2">{slot}</span>
                        <span className="font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                          {count} {count === 1 ? 'caso' : 'casos'}
                        </span>
                      </div>
                    ))}

                    {timeSlotDistribution.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        Sin registros de franjas horarias
                      </p>
                    )}
                  </div>
                </div>

                {/* Positive vs Negative Balance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <span>Balance de Convivencia</span>
                  </h4>

                  <div className="p-3 rounded-xl bg-slate-50 space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-emerald-700">Refuerzos Positivos (+{totalPositivePoints})</span>
                      <span className="text-rose-700">Partes Disruptivos ({classIncidents.length})</span>
                    </div>

                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${
                            totalPositivePoints + classIncidents.length === 0
                              ? 50
                              : Math.round(
                                  (totalPositivePoints /
                                    (totalPositivePoints + classIncidents.length)) *
                                    100
                                )
                          }%`,
                        }}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{
                          width: `${
                            totalPositivePoints + classIncidents.length === 0
                              ? 50
                              : Math.round(
                                  (classIncidents.length /
                                    (totalPositivePoints + classIncidents.length)) *
                                    100
                                )
                          }%`,
                        }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                      {totalPositivePoints >= classIncidents.length
                        ? 'El grupo mantiene un balance positivo favorable, predominando el refuerzo pedagógico frente a medidas correctoras.'
                        : 'El aula presenta mayor concentración de medidas correctoras. Se recomienda incentivar reconocimientos de conducta.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal: Add Positive Recognition */}
      <AddPositiveModal
        isOpen={!!positiveModalStudent}
        onClose={() => setPositiveModalStudent(null)}
        student={positiveModalStudent}
        currentUser={currentUser}
        onSavePositive={onSavePositive}
      />

      {/* Modal: Add Student */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        className={schoolClass.name}
        onAddStudent={onAddStudent}
      />

      {/* Modal: Edit Student */}
      <EditStudentModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        student={editingStudent}
        onUpdateStudent={(updated) => {
          if (onUpdateStudent) {
            onUpdateStudent(updated);
          }
          setEditingStudent(null);
        }}
        onDeleteStudent={(id) => {
          if (onDeleteStudent) {
            onDeleteStudent(id);
          }
          if (baremoStudent?.id === id) {
            setBaremoStudent(null);
          }
          setEditingStudent(null);
        }}
      />

      {/* Modal: Ficha Resumen de Conductas del Alumno */}
      {baremoStudent && (
        <StudentBaremoModal
          isOpen={!!baremoStudent}
          onClose={() => setBaremoStudent(null)}
          student={baremoStudent}
          incidents={classIncidents}
          positives={classPositives}
          activeMonday={activeMonday}
          thresholds={classConductConfig.thresholds}
          onEditStudent={(st) => setEditingStudent(st)}
          onDeleteStudent={(id) => {
            if (onDeleteStudent) {
              onDeleteStudent(id);
            }
            setBaremoStudent(null);
          }}
        />
      )}

      {/* Modal: Confirm Delete Student */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-rose-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                    Baja de Alumnado
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Eliminar Alumno
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setStudentToDelete(null)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cancelar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                ¿Estás seguro de que deseas eliminar a <strong>{studentToDelete.name}</strong> del aula <strong>{schoolClass.name}</strong>?
              </p>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  El alumno se dará de baja de la clase y se eliminarán todos sus registros de incidencias y conductas asociados en este grupo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteStudent && studentToDelete) {
                      onDeleteStudent(studentToDelete.id);
                      if (baremoStudent?.id === studentToDelete.id) {
                        setBaremoStudent(null);
                      }
                      if (editingStudent?.id === studentToDelete.id) {
                        setEditingStudent(null);
                      }
                      setStudentToDelete(null);
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Alumno</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
