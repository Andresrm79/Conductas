import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Award,
  Info,
  Calendar,
  User,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
  Search,
  ChevronRight,
  Sparkles,
  Layers,
  Copy,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SchoolClass,
  UserProfile,
  Incident,
  PositiveBehavior,
  ClassStudent,
  BehaviorType,
  ConductThresholds,
  ClassConductConfig,
  BehaviorCategory,
} from '../types';
import {
  getIncidentPoints,
  getPositivePoints,
  DEFAULT_CONDUCT_THRESHOLDS,
  applyClassConfigToAllClasses,
} from '../utils/storage';
import * as XLSX from 'xlsx';

interface ClassIncidentConfigTabProps {
  schoolClass: SchoolClass;
  classes: SchoolClass[];
  currentUser: UserProfile;
  incidents: Incident[];
  positives: PositiveBehavior[];
  students: ClassStudent[];
  classConfig: ClassConductConfig;
  onSaveClassConfig: (updatedConfig: ClassConductConfig) => void;
  onResetClassConfig: () => void;
  onSelectIncident?: (incident: Incident) => void;
  onOpenStudentProfile?: (studentName: string) => void;
}

export const ClassIncidentConfigTab: React.FC<ClassIncidentConfigTabProps> = ({
  schoolClass,
  classes,
  currentUser,
  incidents,
  positives,
  students,
  classConfig,
  onSaveClassConfig,
  onResetClassConfig,
  onSelectIncident = (_incident: Incident) => {},
  onOpenStudentProfile = (_studentName: string) => {},
}) => {
  // Navigation inside the Configuration Tab
  const [activeSection, setActiveSection] = useState<'conductas' | 'umbrales' | 'listados'>('conductas');

  // Notification / Feedback banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 3500);
  };

  // =========================================================================
  // SUBSECTION 1: CONDUCT CATALOG STATE & HANDLERS
  // =========================================================================
  const [conductFilterType, setConductFilterType] = useState<'ALL' | 'disruptiva' | 'positiva'>('ALL');
  const [conductStatusFilter, setConductStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [conductSearch, setConductSearch] = useState('');

  // Modal / inline card state for Create / Edit conduct
  const [isConductModalOpen, setIsConductModalOpen] = useState(false);
  const [isConductCreating, setIsConductCreating] = useState(false);
  const [editingConduct, setEditingConduct] = useState<BehaviorType | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<BehaviorCategory>('disruptiva');
  const [formPoints, setFormPoints] = useState<number>(-10);
  const [formActive, setFormActive] = useState<boolean>(true);

  // Modal for delete prevention / mark inactive advice
  const [deleteNoticeConduct, setDeleteNoticeConduct] = useState<{
    conduct: BehaviorType;
    associatedCount: number;
  } | null>(null);

  // Count how many times a conduct has been recorded in the system
  const getAssociatedRecordsCount = (conduct: BehaviorType) => {
    const norm = conduct.name.trim().toLowerCase();
    const incCount = incidents.filter(
      (inc) =>
        (inc.behaviorTypeId && inc.behaviorTypeId === conduct.id) ||
        (inc.category && inc.category.trim().toLowerCase() === norm)
    ).length;
    const posCount = positives.filter(
      (pos) =>
        (pos.behaviorTypeId && pos.behaviorTypeId === conduct.id) ||
        (pos.category && pos.category.trim().toLowerCase() === norm)
    ).length;
    return incCount + posCount;
  };

  const resetConductForm = () => {
    setEditingConduct(null);
    setIsConductCreating(false);
    setIsConductModalOpen(false);
    setFormName('');
    setFormDescription('');
    setFormType('disruptiva');
    setFormPoints(-10);
    setFormActive(true);
  };

  const handleOpenCreateConduct = () => {
    setEditingConduct(null);
    setFormName('');
    setFormDescription('');
    setFormType('disruptiva');
    setFormPoints(-10);
    setFormActive(true);
    setIsConductCreating(true);
    setIsConductModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById('conduct-catalog-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleOpenEditConduct = (conduct: BehaviorType) => {
    setEditingConduct(conduct);
    setFormName(conduct.name);
    setFormDescription(conduct.description || '');
    setFormType(conduct.type);
    let pts = conduct.points;
    if (conduct.type === 'disruptiva' && pts > 0) pts = -pts;
    if (conduct.type === 'positiva' && pts < 0) pts = Math.abs(pts);
    setFormPoints(pts);
    setFormActive(conduct.active !== false);
    setIsConductCreating(true);
    setIsConductModalOpen(false);
    setTimeout(() => {
      const el = document.getElementById('conduct-catalog-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSaveConductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    let pts = Math.abs(formPoints);
    if (formType === 'disruptiva') {
      pts = -pts;
    }

    if (editingConduct) {
      // Update existing
      const updatedList = classConfig.behaviorTypes.map((b) => {
        if (b.id === editingConduct.id) {
          return {
            ...b,
            name: formName.trim(),
            description: formDescription.trim(),
            type: formType,
            points: pts,
            active: formActive,
          };
        }
        return b;
      });
      onSaveClassConfig({
        ...classConfig,
        behaviorTypes: updatedList,
      });
      showBanner(`Conducta "${formName.trim()}" actualizada con éxito`);
    } else {
      // Create new conduct
      const newConduct: BehaviorType = {
        id: `bt-custom-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        type: formType,
        points: pts,
        active: formActive,
        isCustom: true,
        className: schoolClass.name,
      };
      onSaveClassConfig({
        ...classConfig,
        behaviorTypes: [newConduct, ...classConfig.behaviorTypes],
      });
      showBanner(`Nueva conducta "${formName.trim()}" creada para el aula ${schoolClass.name}`);
    }

    resetConductForm();
  };

  const handleToggleConductActive = (conductId: string) => {
    const target = classConfig.behaviorTypes.find((b) => b.id === conductId);
    if (!target) return;
    const newActive = target.active === false; // toggle
    const updatedList = classConfig.behaviorTypes.map((b) =>
      b.id === conductId ? { ...b, active: newActive } : b
    );
    onSaveClassConfig({
      ...classConfig,
      behaviorTypes: updatedList,
    });
    showBanner(
      `Conducta "${target.name}" marcada como ${newActive ? 'ACTIVA' : 'INACTIVA'}`
    );
  };

  const handleDeleteConductClick = (conduct: BehaviorType) => {
    const associatedCount = getAssociatedRecordsCount(conduct);
    if (associatedCount > 0) {
      // Associated records exist: warn and advise marking inactive instead of destroying history
      setDeleteNoticeConduct({ conduct, associatedCount });
    } else {
      // No records: ask for direct confirmation
      if (
        window.confirm(
          `¿Eliminar definitivamente la conducta "${conduct.name}" del catálogo de ${schoolClass.name}? No tiene registros asociados.`
        )
      ) {
        const updatedList = classConfig.behaviorTypes.filter((b) => b.id !== conduct.id);
        onSaveClassConfig({
          ...classConfig,
          behaviorTypes: updatedList,
        });
        showBanner(`Conducta "${conduct.name}" eliminada`);
      }
    }
  };

  const handleMarkInactiveFromNotice = () => {
    if (!deleteNoticeConduct) return;
    const conduct = deleteNoticeConduct.conduct;
    const updatedList = classConfig.behaviorTypes.map((b) =>
      b.id === conduct.id ? { ...b, active: false } : b
    );
    onSaveClassConfig({
      ...classConfig,
      behaviorTypes: updatedList,
    });
    setDeleteNoticeConduct(null);
    showBanner(`Conducta "${conduct.name}" desactivada para proteger el historial`);
  };

  // Filtered conduct list
  const filteredConducts = useMemo(() => {
    return classConfig.behaviorTypes.filter((b) => {
      if (conductFilterType !== 'ALL' && b.type !== conductFilterType) return false;
      const isActive = b.active !== false;
      if (conductStatusFilter === 'active' && !isActive) return false;
      if (conductStatusFilter === 'inactive' && isActive) return false;
      if (conductSearch.trim()) {
        const q = conductSearch.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesDesc = (b.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [classConfig.behaviorTypes, conductFilterType, conductStatusFilter, conductSearch]);

  // =========================================================================
  // SUBSECTION 2: THRESHOLDS CONFIGURATION STATE & HANDLERS
  // =========================================================================
  const [favorableThreshold, setFavorableThreshold] = useState<number>(
    classConfig.thresholds.favorableThreshold
  );
  const [muyCriticoThreshold, setMuyCriticoThreshold] = useState<number>(
    classConfig.thresholds.muyCriticoThreshold
  );

  // Sync thresholds with classConfig when class changes
  React.useEffect(() => {
    setFavorableThreshold(classConfig.thresholds.favorableThreshold);
    setMuyCriticoThreshold(classConfig.thresholds.muyCriticoThreshold);
  }, [classConfig]);

  const handleSaveThresholds = () => {
    // Validation: favorableThreshold must be > muyCriticoThreshold (e.g. -10 > -20)
    if (favorableThreshold <= muyCriticoThreshold) {
      alert(
        'El umbral favorable (Verde) debe ser una puntuación superior al umbral muy crítico (Rojo).'
      );
      return;
    }

    const updatedThresholds: ConductThresholds = {
      favorableThreshold,
      criticoThreshold: favorableThreshold,
      muyCriticoThreshold,
    };

    onSaveClassConfig({
      ...classConfig,
      thresholds: updatedThresholds,
    });

    showBanner(`Baremos y umbrales actualizados para el aula ${schoolClass.name}`);
  };

  const handleResetThresholdsToDefaults = () => {
    if (window.confirm('¿Restablecer los umbrales de esta clase a los baremos recomendados del centro?')) {
      setFavorableThreshold(DEFAULT_CONDUCT_THRESHOLDS.favorableThreshold);
      setMuyCriticoThreshold(DEFAULT_CONDUCT_THRESHOLDS.muyCriticoThreshold);
      onSaveClassConfig({
        ...classConfig,
        thresholds: { ...DEFAULT_CONDUCT_THRESHOLDS },
      });
      showBanner('Umbrales restablecidos a los baremos estándar');
    }
  };

  const handleApplyConfigToAllClasses = () => {
    if (currentUser.role !== 'Directivo') {
      alert('Esta acción solo puede ser ejecutada por miembros del Equipo Directivo.');
      return;
    }
    if (
      window.confirm(
        `¿Confirmas aplicar este catálogo (${classConfig.behaviorTypes.length} conductas) y estos umbrales a TODAS las aulas del centro?`
      )
    ) {
      applyClassConfigToAllClasses(
        classConfig,
        classes.map((c) => c.name)
      );
      showBanner('Configuración aplicada con éxito a todas las clases del centro');
    }
  };

  // Preview simulation of students in this class based on chosen thresholds
  const classStudentsList = useMemo(() => {
    return students.filter((s) => s.className === schoolClass.name);
  }, [students, schoolClass.name]);

  const thresholdSimulationStats = useMemo(() => {
    let favorableCount = 0;
    let criticoCount = 0;
    let muyCriticoCount = 0;

    classStudentsList.forEach((st) => {
      // Calculate net weekly score for student
      const normName = st.name.trim().toLowerCase();
      const stInc = incidents.filter(
        (i) => i.studentGroup === schoolClass.name && i.studentName.trim().toLowerCase() === normName
      );
      const stPos = positives.filter(
        (p) => p.studentGroup === schoolClass.name && p.studentName.trim().toLowerCase() === normName
      );

      const net =
        stInc.reduce((acc, i) => acc + getIncidentPoints(i), 0) +
        stPos.reduce((acc, p) => acc + getPositivePoints(p), 0);

      if (net > favorableThreshold) {
        favorableCount++;
      } else if (net >= muyCriticoThreshold) {
        criticoCount++;
      } else {
        muyCriticoCount++;
      }
    });

    return { favorableCount, criticoCount, muyCriticoCount, total: classStudentsList.length };
  }, [classStudentsList, incidents, positives, schoolClass.name, favorableThreshold, muyCriticoThreshold]);

  // =========================================================================
  // SUBSECTION 3: AUDITORÍA Y LISTADOS DE CONDUCTAS REGISTRADAS
  // =========================================================================
  const [auditStudentFilter, setAuditStudentFilter] = useState<string>('ALL');
  const [auditClassFilter, setAuditClassFilter] = useState<string>(schoolClass.name);
  const [auditTeacherFilter, setAuditTeacherFilter] = useState<string>('ALL');
  const [auditTimePreset, setAuditTimePreset] = useState<
    'today' | 'week' | 'month' | '30days' | 'course' | 'custom'
  >('month');
  const [auditDateFrom, setAuditDateFrom] = useState<string>('');
  const [auditDateTo, setAuditDateTo] = useState<string>('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'ALL' | 'disruptiva' | 'positiva'>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Extract unique teachers from incidents and positives
  const availableTeachers = useMemo(() => {
    const teachersSet = new Set<string>();
    incidents.forEach((i) => {
      if (i.teacherName) teachersSet.add(i.teacherName.trim());
    });
    positives.forEach((p) => {
      if (p.teacherName) teachersSet.add(p.teacherName.trim());
    });
    return Array.from(teachersSet).sort();
  }, [incidents, positives]);

  // Combined audit events (Incidents + Positives)
  interface CombinedAuditEvent {
    id: string;
    studentName: string;
    studentGroup: string;
    date: string;
    timeSlot?: string;
    subject?: string;
    teacherName: string;
    category: string;
    description: string;
    type: 'disruptiva' | 'positiva';
    points: number;
    severity?: string;
    measure?: string;
    status?: string;
    rawIncident?: Incident;
    rawPositive?: PositiveBehavior;
  }

  const combinedAuditRecords = useMemo(() => {
    const records: CombinedAuditEvent[] = [];

    // Add incidents
    incidents.forEach((inc) => {
      records.push({
        id: inc.id,
        studentName: inc.studentName,
        studentGroup: inc.studentGroup,
        date: inc.date,
        timeSlot: inc.timeSlot,
        subject: inc.subject,
        teacherName: inc.teacherName,
        category: inc.category,
        description: inc.description,
        type: 'disruptiva',
        points: getIncidentPoints(inc),
        severity: inc.severity,
        measure: inc.immediateMeasure,
        status: inc.status,
        rawIncident: inc,
      });
    });

    // Add positives
    positives.forEach((pos) => {
      records.push({
        id: pos.id,
        studentName: pos.studentName,
        studentGroup: pos.studentGroup,
        date: pos.date,
        teacherName: pos.teacherName,
        category: pos.category,
        description: pos.description,
        type: 'positiva',
        points: getPositivePoints(pos),
        status: 'Registrado',
        rawPositive: pos,
      });
    });

    // Sort descending by date
    records.sort((a, b) => b.date.localeCompare(a.date));
    return records;
  }, [incidents, positives]);

  // Filtered audit records according to requested criteria
  const filteredAuditRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute date boundaries
    let minDate: string | null = null;
    let maxDate: string | null = null;

    if (auditTimePreset === 'today') {
      minDate = todayStr;
      maxDate = todayStr;
    } else if (auditTimePreset === 'week') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      minDate = monday.toISOString().split('T')[0];
    } else if (auditTimePreset === 'month') {
      const now = new Date();
      minDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (auditTimePreset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      minDate = past.toISOString().split('T')[0];
    } else if (auditTimePreset === 'custom') {
      if (auditDateFrom) minDate = auditDateFrom;
      if (auditDateTo) maxDate = auditDateTo;
    }

    return combinedAuditRecords.filter((rec) => {
      // 1. Filter by Class
      if (auditClassFilter !== 'ALL' && rec.studentGroup !== auditClassFilter) {
        return false;
      }

      // 2. Filter by Student
      if (auditStudentFilter !== 'ALL') {
        if (rec.studentName.trim().toLowerCase() !== auditStudentFilter.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Filter by Teacher
      if (auditTeacherFilter !== 'ALL') {
        if (rec.teacherName.trim().toLowerCase() !== auditTeacherFilter.trim().toLowerCase()) {
          return false;
        }
      }

      // 4. Filter by Time
      if (minDate && rec.date < minDate) return false;
      if (maxDate && rec.date > maxDate) return false;

      // 5. Filter by Conduct Type (Positiva / Disruptiva)
      if (auditTypeFilter !== 'ALL' && rec.type !== auditTypeFilter) return false;

      // 6. Text Search
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const inStudent = rec.studentName.toLowerCase().includes(q);
        const inCategory = rec.category.toLowerCase().includes(q);
        const inDesc = rec.description.toLowerCase().includes(q);
        const inSubject = (rec.subject || '').toLowerCase().includes(q);
        const inTeacher = rec.teacherName.toLowerCase().includes(q);
        if (!inStudent && !inCategory && !inDesc && !inSubject && !inTeacher) {
          return false;
        }
      }

      return true;
    });
  }, [
    combinedAuditRecords,
    auditClassFilter,
    auditStudentFilter,
    auditTeacherFilter,
    auditTimePreset,
    auditDateFrom,
    auditDateTo,
    auditTypeFilter,
    auditSearch,
  ]);

  // Export filtered audit to Excel
  const handleExportAuditExcel = () => {
    if (filteredAuditRecords.length === 0) {
      alert('No hay registros de conductas para exportar con los filtros seleccionados.');
      return;
    }

    const rows = filteredAuditRecords.map((r, idx) => ({
      N: idx + 1,
      Alumno: r.studentName,
      Grupo: r.studentGroup,
      Fecha: r.date,
      TramoHorario: r.timeSlot || '-',
      Materia: r.subject || '-',
      Docente: r.teacherName,
      TipoConducta: r.type === 'positiva' ? 'POSITIVA' : 'DISRUPTIVA',
      Puntos: r.points > 0 ? `+${r.points}` : `${r.points}`,
      NombreConducta: r.category,
      Gravedad: r.severity || '-',
      Descripcion: r.description,
      MedidaCorrectora: r.measure || '-',
      Estado: r.status || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoría Conductas');
    XLSX.writeFile(
      workbook,
      `Auditoria_Conductas_${auditClassFilter}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    showBanner('Listado de auditoría exportado a Excel correctamente');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 flex-1 bg-slate-100/60 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {bannerMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-950 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              Configuración Incidencias
            </span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              Aula: <strong className="text-slate-950">{schoolClass.name}</strong>
            </span>
            {classConfig.isCustomized ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Catálogo Propio Personalizado
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                Heredando Baremo General del Centro
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            Gestión de Conductas, Baremo de Semáforo y Listados
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Panel exclusivo para Tutoría (<strong className="text-slate-700">{schoolClass.tutorName}</strong>) y
            Equipo Directivo. Permite adaptar las conductas y umbrales específicamente para esta aula.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetClassConfig}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="Restablecer este aula a las conductas generales del centro"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Centro</span>
          </button>

          {currentUser.role === 'Directivo' && (
            <button
              type="button"
              onClick={handleApplyConfigToAllClasses}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200 transition-colors cursor-pointer"
              title="Copiar catálogo y umbrales de este aula a todas las demás clases"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Aplicar a Todas las Clases</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSection('conductas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'conductas'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>1. Catálogo de Conductas ({classConfig.behaviorTypes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('umbrales')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'umbrales'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>2. Umbrales de Estados y Semáforo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('listados')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSection === 'listados'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-sky-400" />
          <span>3. Auditoría y Listados de Registros</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: CONDUCT CATALOG MANAGEMENT */}
      {/* ===================================================================== */}
      {activeSection === 'conductas' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar conducta por nombre o descripción..."
                value={conductSearch}
                onChange={(e) => setConductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setConductFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    conductFilterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setConductFilterType('disruptiva')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    conductFilterType === 'disruptiva' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Disruptivas
                </button>
                <button
                  type="button"
                  onClick={() => setConductFilterType('positiva')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    conductFilterType === 'positiva' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Positivas
                </button>
              </div>

              <select
                value={conductStatusFilter}
                onChange={(e) => setConductStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white cursor-pointer"
              >
                <option value="ALL">Todos los estados</option>
                <option value="active">Solo Activas</option>
                <option value="inactive">Solo Inactivas</option>
              </select>

              <button
                type="button"
                onClick={handleOpenCreateConduct}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Crear Conducta</span>
              </button>
            </div>
          </div>

          {/* Creation / Edit Form Card with the exact format from BehaviorTypesModal */}
          {(isConductCreating || editingConduct) && (
            <form
              id="conduct-catalog-form"
              onSubmit={handleSaveConductForm}
              className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>
                    {editingConduct
                      ? `Editar Tipo de Conducta: ${editingConduct.name}`
                      : 'Nuevo Tipo de Conducta para el Baremo y Catálogo'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={resetConductForm}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Type selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Naturaleza de la Conducta *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType('disruptiva');
                        if (formPoints > 0) setFormPoints(-formPoints);
                        else if (formPoints === 0) setFormPoints(-10);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        formType === 'disruptiva'
                          ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Disruptiva (Negativa)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormType('positiva');
                        if (formPoints < 0) setFormPoints(Math.abs(formPoints));
                        else if (formPoints === 0) setFormPoints(5);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        formType === 'positiva'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Positiva (Reconocimiento)</span>
                    </button>
                  </div>
                </div>

                {/* Points selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {formType === 'disruptiva'
                      ? 'Penalización de Puntos (Negativo) *'
                      : 'Puntuación Otorgada (Positivo) *'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formPoints}
                      onChange={(e) => setFormPoints(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs font-extrabold rounded-xl border ${
                        formType === 'disruptiva'
                          ? 'text-rose-700 bg-rose-50/50 border-rose-300 focus:ring-rose-500'
                          : 'text-emerald-700 bg-emerald-50/50 border-emerald-300 focus:ring-emerald-500'
                      } focus:outline-hidden focus:ring-2`}
                    />
                    {/* Quick chips */}
                    <div className="flex gap-1 shrink-0">
                      {formType === 'disruptiva' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-5)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-10)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-20)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -20
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-50)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -50
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setFormPoints(5)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(10)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(15)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +15
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(20)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +20
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre descriptivo de la conducta *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Falta de respeto al docente, Interrupción continuada, Trabajo cooperativo..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Criterio / Descripción pedagógica
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles sobre cuándo aplica este baremo o medida correctiva aconsejada..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Estado Activo / Inactivo */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Estado de la Conducta en el Aula
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {formActive
                      ? 'Activa: aparecerá en los selectores para registrar incidencias o refuerzos'
                      : 'Inactiva: oculta para nuevos registros, preservada en histórico y partes'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer ${
                    formActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {formActive ? '✓ ACTIVA' : '✕ INACTIVA'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetConductForm}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingConduct ? 'Guardar Cambios' : 'Añadir al Catálogo'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Conducts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredConducts.map((b) => {
              const isActive = b.active !== false;
              const associatedCount = getAssociatedRecordsCount(b);

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                      : 'bg-slate-50/80 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                            b.type === 'positiva'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {b.type === 'positiva' ? <Award className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </span>
                        <div>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              b.type === 'positiva'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {b.type === 'positiva' ? 'Conducta Positiva' : 'Conducta Disruptiva'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Status badge & Quick Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleConductActive(b.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title={isActive ? 'Clic para desactivar conducta' : 'Clic para activar conducta'}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          />
                          <span>{isActive ? 'Activa' : 'Inactiva'}</span>
                        </button>

                        <span
                          className={`text-xs font-black px-2 py-1 rounded-xl ${
                            b.points > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.points > 0 ? `+${b.points} pts` : `${b.points} pts`}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {b.name}
                    </h4>

                    {b.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                        {b.description}
                      </p>
                    )}
                  </div>

                  {/* Footer info and actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="font-semibold">
                      {associatedCount > 0 ? (
                        <span className="text-indigo-600 font-bold">
                          {associatedCount} registros en historial
                        </span>
                      ) : (
                        <span className="text-slate-400">Sin registros previos</span>
                      )}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditConduct(b)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Modificar conducta"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteConductClick(b)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar o desactivar conducta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredConducts.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No se encontraron conductas en el baremo con estos filtros</p>
              <button
                type="button"
                onClick={handleOpenCreateConduct}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Crear la primera conducta</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: UMBRALES DE ESTADOS Y SEMÁFORO */}
      {/* ===================================================================== */}
      {activeSection === 'umbrales' && (
        <div className="space-y-6">
          {/* Explanatory Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Baremos Automáticos del Aula
              </span>
              <h3 className="text-lg font-black text-white">
                Configuración del Semáforo y Clasificación de Conducta
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Los alumnos acumulan puntos negativos por conductas disruptivas y positivos por comportamientos ejemplares.
                El semáforo y las tarjetas del aula cambian automáticamente de color según los baremos definidos aquí para {schoolClass.name}.
              </p>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-2xl p-4 shrink-0 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="font-bold text-emerald-300">Estado Favorable</span>: Puntos &gt; {favorableThreshold}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="font-bold text-amber-300">Estado Crítico</span>: Entre {muyCriticoThreshold} y {favorableThreshold}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="font-bold text-rose-300">Estado Muy Crítico</span>: Puntos &lt; {muyCriticoThreshold}
              </div>
            </div>
          </div>

          {/* Interactive Sliders / Inputs Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Ajuste de Baremo Numérico</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Umbral 1: Favorable (Verde) */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black uppercase text-emerald-900">
                      Umbral de Estado Favorable (Verde)
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-800">
                    &gt; {favorableThreshold} pts
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  El alumno mantiene convivencia positiva mientras su puntuación semanal se encuentre por encima de este valor.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="range"
                    min="-40"
                    max="10"
                    step="5"
                    value={favorableThreshold}
                    onChange={(e) => setFavorableThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFavorableThreshold((prev) => prev - 5)}
                      className="px-2 py-1 bg-white border border-emerald-300 text-xs font-black rounded-lg hover:bg-emerald-100 cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setFavorableThreshold((prev) => prev + 5)}
                      className="px-2 py-1 bg-white border border-emerald-300 text-xs font-black rounded-lg hover:bg-emerald-100 cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              {/* Umbral 2: Muy Crítico (Rojo) */}
              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-black uppercase text-rose-900">
                      Umbral de Estado Muy Crítico (Rojo)
                    </span>
                  </div>
                  <span className="text-base font-black text-rose-800">
                    &lt; {muyCriticoThreshold} pts
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                  Caer por debajo de este baremo sitúa al alumno en semáforo rojo y genera apercibimiento formal / parte semanal.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="range"
                    min="-60"
                    max="-10"
                    step="5"
                    value={muyCriticoThreshold}
                    onChange={(e) => setMuyCriticoThreshold(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMuyCriticoThreshold((prev) => prev - 5)}
                      className="px-2 py-1 bg-white border border-rose-300 text-xs font-black rounded-lg hover:bg-rose-100 cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setMuyCriticoThreshold((prev) => prev + 5)}
                      className="px-2 py-1 bg-white border border-rose-300 text-xs font-black rounded-lg hover:bg-rose-100 cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Spectrum Bar Preview */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                Visualizador de Distribución del Semáforo:
              </span>
              <div className="h-7 w-full rounded-xl overflow-hidden flex text-[10px] font-black text-white shadow-inner">
                <div
                  className="bg-rose-600 flex items-center justify-center px-2"
                  style={{ width: '30%' }}
                >
                  Rojo: &lt; {muyCriticoThreshold} pts
                </div>
                <div
                  className="bg-amber-500 flex items-center justify-center px-2"
                  style={{ width: '35%' }}
                >
                  Amarillo: {muyCriticoThreshold} a {favorableThreshold} pts
                </div>
                <div
                  className="bg-emerald-600 flex items-center justify-center px-2"
                  style={{ width: '35%' }}
                >
                  Verde: &gt; {favorableThreshold} pts
                </div>
              </div>
            </div>

            {/* Real-time simulation for current students */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">
                  Simulación con los {thresholdSimulationStats.total} alumnos actuales de {schoolClass.name}:
                </span>
                <span className="text-slate-500 text-[11px]">
                  Puntuaciones netas calculadas según las conductas registradas esta semana.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-xl font-black">
                  🟢 {thresholdSimulationStats.favorableCount} Favorable
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl font-black">
                  🟡 {thresholdSimulationStats.criticoCount} Crítico
                </span>
                <span className="px-3 py-1 bg-rose-100 text-rose-900 rounded-xl font-black">
                  🔴 {thresholdSimulationStats.muyCriticoCount} Muy Crítico
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetThresholdsToDefaults}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Restaurar baremos estándar
              </button>

              <button
                type="button"
                onClick={handleSaveThresholds}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Umbrales de esta Clase</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: AUDITORÍA Y LISTADOS DE CONDUCTAS REGISTRADAS */}
      {/* ===================================================================== */}
      {activeSection === 'listados' && (
        <div className="space-y-4">
          {/* Filters Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>Filtros de Auditoría de Conductas Registradas</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Consulta de conductas por alumno, por aula, en rangos de tiempo y por profesor registrador.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportAuditExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar a Excel ({filteredAuditRecords.length})</span>
              </button>
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Por Alumno */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Por Alumno
                </label>
                <select
                  value={auditStudentFilter}
                  onChange={(e) => setAuditStudentFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white cursor-pointer"
                >
                  <option value="ALL">Todos los alumnos</option>
                  {students
                    .filter((s) => auditClassFilter === 'ALL' || s.className === auditClassFilter)
                    .map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.className})
                      </option>
                    ))}
                </select>
              </div>

              {/* 2. Por Clase */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Por Clase
                </label>
                <select
                  value={auditClassFilter}
                  onChange={(e) => setAuditClassFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white cursor-pointer"
                >
                  {currentUser.role === 'Directivo' && (
                    <option value="ALL">Todas las clases del centro</option>
                  )}
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Por Tiempo */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Período de Tiempo
                </label>
                <select
                  value={auditTimePreset}
                  onChange={(e) => setAuditTimePreset(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white cursor-pointer"
                >
                  <option value="today">Hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                  <option value="30days">Últimos 30 días</option>
                  <option value="course">Todo el curso</option>
                  <option value="custom">Rango personalizado...</option>
                </select>
              </div>

              {/* 4. Por Profesor */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Por Profesor / Registrador
                </label>
                <select
                  value={auditTeacherFilter}
                  onChange={(e) => setAuditTeacherFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white cursor-pointer"
                >
                  <option value="ALL">Todos los profesores</option>
                  {availableTeachers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Dates Row if 'custom' is selected */}
            {auditTimePreset === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-in fade-in duration-150">
                <span className="text-xs font-bold text-slate-700">Rango de fechas:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Desde:</span>
                  <input
                    type="date"
                    value={auditDateFrom}
                    onChange={(e) => setAuditDateFrom(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Hasta:</span>
                  <input
                    type="date"
                    value={auditDateTo}
                    onChange={(e) => setAuditDateTo(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Secondary filter & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar texto en conducta, descripción o materia..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuditTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    auditTypeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Todas ({filteredAuditRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAuditTypeFilter('disruptiva')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    auditTypeFilter === 'disruptiva' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Solo Disruptivas
                </button>
                <button
                  type="button"
                  onClick={() => setAuditTypeFilter('positiva')}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                    auditTypeFilter === 'positiva' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Solo Positivas
                </button>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-2.5">
            {filteredAuditRecords.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.rawIncident) {
                    onSelectIncident(item.rawIncident);
                  }
                }}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all hover:shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        item.type === 'positiva'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.severity === 'Muy Grave'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : item.severity === 'Grave'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      {item.type === 'positiva' ? 'POSITIVA' : item.severity || 'DISRUPTIVA'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStudentProfile(item.studentName);
                      }}
                      className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 text-left"
                    >
                      {item.studentName}
                    </button>

                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.studentGroup}
                    </span>

                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 font-medium leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.date} {item.timeSlot ? `• ${item.timeSlot}` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Prof: <strong className="text-slate-700">{item.teacherName}</strong>
                      {item.subject ? ` (${item.subject})` : ''}
                    </span>
                    {item.measure && (
                      <span className="text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded">
                        Medida: {item.measure}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                      item.points > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.points > 0 ? `+${item.points} pts` : `${item.points} pts`}
                  </span>

                  {item.rawIncident && (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            ))}

            {filteredAuditRecords.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Sin registros de conducta encontrados para este filtro</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Prueba a ampliar el rango de fechas o seleccionar otra aula / docente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE OR EDIT CONDUCT */}
      {/* ===================================================================== */}
      {isConductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 text-amber-400 border border-white/10 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    {schoolClass.name}
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {editingConduct ? 'Modificar Conducta' : 'Crear Nueva Conducta'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConductModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConductForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Type selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Naturaleza de la Conducta *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType('disruptiva');
                        if (formPoints > 0) setFormPoints(-formPoints);
                        else if (formPoints === 0) setFormPoints(-10);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        formType === 'disruptiva'
                          ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Disruptiva (Negativa)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormType('positiva');
                        if (formPoints < 0) setFormPoints(Math.abs(formPoints));
                        else if (formPoints === 0) setFormPoints(5);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        formType === 'positiva'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Positiva (Reconocimiento)</span>
                    </button>
                  </div>
                </div>

                {/* Points selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {formType === 'disruptiva'
                      ? 'Penalización de Puntos (Negativo) *'
                      : 'Puntuación Otorgada (Positivo) *'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formPoints}
                      onChange={(e) => setFormPoints(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs font-extrabold rounded-xl border ${
                        formType === 'disruptiva'
                          ? 'text-rose-700 bg-rose-50/50 border-rose-300 focus:ring-rose-500'
                          : 'text-emerald-700 bg-emerald-50/50 border-emerald-300 focus:ring-emerald-500'
                      } focus:outline-hidden focus:ring-2`}
                    />
                    {/* Quick chips */}
                    <div className="flex gap-1 shrink-0">
                      {formType === 'disruptiva' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-5)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-10)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-20)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -20
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(-50)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -50
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setFormPoints(5)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(10)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(15)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +15
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPoints(20)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +20
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre de la Conducta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Falta de respeto al docente, Interrupción continuada, Trabajo cooperativo..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Criterio / Descripción Pedagógica
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre cuándo aplica este baremo o medida correctiva aconsejada..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Estado Activo / Inactivo */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Estado de la Conducta en el Aula
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {formActive
                      ? 'Activa: aparecerá en los selectores para registrar'
                      : 'Inactiva: oculta para nuevos registros, preservada en histórico'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors cursor-pointer ${
                    formActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {formActive ? '✓ ACTIVA' : '✕ INACTIVA'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingConduct ? 'Guardar Cambios' : 'Crear Conducta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE PREVENTION NOTICE & MARK INACTIVE ADVICE */}
      {/* ===================================================================== */}
      {deleteNoticeConduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-amber-300 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Conducta con registros asociados
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                La conducta <strong className="text-slate-900">"{deleteNoticeConduct.conduct.name}"</strong> cuenta con{' '}
                <strong className="text-amber-700 font-bold">{deleteNoticeConduct.associatedCount} registro(s)</strong> en el
                historial escolar.
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>Recomendación del sistema:</strong> Para no alterar la validez de los partes e incidencias pasadas,
              no es conveniente borrarla físicamente. Márcala como <strong>INACTIVA</strong> para que ya no aparezca al
              añadir nuevas incidencias mientras se conserva intacto el historial.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleMarkInactiveFromNotice}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Marcar como Inactiva (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setDeleteNoticeConduct(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
