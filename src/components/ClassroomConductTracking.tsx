import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  Award,
  AlertTriangle,
  Clock,
  ChevronRight,
  PlusCircle,
  Eye,
  EyeOff,
  Edit2,
  CheckCircle2,
  Search,
  Filter,
  FileText,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  Incident,
  PositiveBehavior,
  SchoolClass,
  ClassStudent,
  LateArrival,
  UserProfile,
} from '../types';
import {
  getIncidentPoints,
  getPositivePoints,
  getMondayOfActiveWeek,
  isDateInActiveWeek,
  getStudentWeeklyPoints,
  getClassConductConfig,
} from '../utils/storage';

interface ClassroomConductTrackingProps {
  classes?: SchoolClass[];
  incidents?: Incident[];
  positives?: PositiveBehavior[];
  students?: ClassStudent[];
  lateArrivals?: LateArrival[];
  lateWarningThreshold?: number;
  currentUser?: UserProfile;
  selectedClassFilter?: string; // "ALL" or class name
  onSelectClassFilter: (className: string) => void;
  onOpenStudentProfile: (studentName: string) => void;
  onSelectIncident?: (inc: Incident) => void;
  onOpenNewIncidentForClass?: (className?: string) => void;
  onOpenNewLateArrivalForClass?: (className?: string) => void;
  onOpenNewLateForClass?: (className?: string) => void;
  onOpenCreateClass?: () => void;
  onToggleHideClass?: (classId: string) => void;
  onEditClass?: (cls: SchoolClass) => void;
}

interface ClassConductSummary {
  className: string;
  schoolClass?: SchoolClass;
  disruptivasTotal: number;
  leves: number;
  graves: number;
  muyGraves: number;
  positivasTotal: number;
  positivasPoints: number;
  partesCount: number;
  lateCount: number;
  lateCountSemana: number;
  studentsWithLateWarning: string[];
  studentCount: number;
  ratioPositiva: number;

  // Estado y Convivencia General del Aula metrics
  totalIncidenciasSemana: number;
  numIncidenciasPositivasSemana: number;
  numIncidenciasNegativasSemana: number;
  favorableStudentsCount: number;
  criticalStudentsCount: number;
  veryCriticalStudentsCount: number;
  partesSemana: number;
  favorableThreshold: number;
  muyCriticoThreshold: number;
}

const ClassroomConvivenciaBoxes: React.FC<{
  stat: ClassConductSummary;
  compact?: boolean;
}> = ({ stat, compact = false }) => {
  return (
    <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'} gap-2.5`}>
      {/* 1. Incidencias en la semana */}
      <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider block truncate">
            Incidencias Semana
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{stat.totalIncidenciasSemana}</span>
            <span className="text-[10px] text-slate-500 font-bold">totales</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[9px] sm:text-[10px] font-bold mt-1">
          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80">
            +{stat.numIncidenciasPositivasSemana} pos.
          </span>
          <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/80">
            {stat.numIncidenciasNegativasSemana} neg.
          </span>
        </div>
      </div>

      {/* 2. Estado Favorable */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
              Estado Favorable
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{stat.favorableStudentsCount}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">alumnos</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-emerald-200/60 text-[9px] sm:text-[10px] text-emerald-700 font-medium truncate mt-1">
          &gt; {stat.favorableThreshold} pts
        </div>
      </div>

      {/* 3. Estado Crítico */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
              Estado Crítico
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-amber-700">{stat.criticalStudentsCount}</span>
            <span className="text-[10px] text-amber-600 font-semibold">alumnos</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-amber-200/60 text-[9px] sm:text-[10px] text-amber-700 font-medium truncate mt-1">
          {stat.muyCriticoThreshold} a {stat.favorableThreshold} pts
        </div>
      </div>

      {/* 4. Estado Muy Crítico */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-800 uppercase tracking-wider block truncate">
              Estado Muy Crítico
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200 animate-pulse shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-rose-700">{stat.veryCriticalStudentsCount}</span>
            <span className="text-[10px] text-rose-600 font-semibold">alumnos</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-rose-200/60 text-[9px] sm:text-[10px] text-rose-700 font-medium truncate mt-1">
          &lt; {stat.muyCriticoThreshold} pts
        </div>
      </div>

      {/* 5. Partes en la Semana */}
      <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-purple-800 uppercase tracking-wider block truncate">
              Partes Semana
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-200 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-purple-800">{stat.partesSemana}</span>
            <span className="text-[10px] text-purple-600 font-semibold">partes</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-purple-200/60 text-[9px] sm:text-[10px] text-purple-700 font-medium truncate mt-1">
          Sanciones / muy graves
        </div>
      </div>

      {/* 6. Retrasos */}
      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-900 uppercase tracking-wider block truncate">
              Retrasos
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-amber-900">{stat.lateCount}</span>
            <span className="text-[10px] text-amber-700 font-semibold">totales</span>
          </div>
        </div>
        <div className="pt-1.5 border-t border-amber-200/60 text-[9px] sm:text-[10px] text-amber-800 font-medium truncate mt-1">
          {stat.lateCountSemana} en la semana
        </div>
      </div>
    </div>
  );
};

export const ClassroomConductTracking: React.FC<ClassroomConductTrackingProps> = ({
  classes = [],
  incidents = [],
  positives = [],
  students = [],
  lateArrivals = [],
  lateWarningThreshold = 3,
  currentUser,
  selectedClassFilter = 'ALL',
  onSelectClassFilter,
  onOpenStudentProfile,
  onSelectIncident,
  onOpenNewIncidentForClass,
  onOpenNewLateArrivalForClass,
  onOpenNewLateForClass,
  onOpenCreateClass,
  onToggleHideClass,
  onEditClass,
}) => {
  const handleOpenNewLate = onOpenNewLateArrivalForClass || onOpenNewLateForClass || (() => {});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'disruptivas' | 'positivas' | 'nombre'>('disruptivas');
  const [visibilityFilter, setVisibilityFilter] = useState<'ACTIVE' | 'HIDDEN' | 'ALL'>('ACTIVE');

  const activeMonday = useMemo(() => getMondayOfActiveWeek(new Date()), []);

  const activeClassesCount = useMemo(() => classes.filter((c) => !c.isHidden).length, [classes]);
  const hiddenClassesCount = useMemo(() => classes.filter((c) => c.isHidden).length, [classes]);

  // Compute stats per class
  const classStatsMap = useMemo(() => {
    const map = new Map<string, ClassConductSummary>();

    classes.forEach((c) => {
      const g = c.name.trim();
      const cfg = getClassConductConfig(g);
      map.set(g, {
        className: g,
        schoolClass: c,
        disruptivasTotal: 0,
        leves: 0,
        graves: 0,
        muyGraves: 0,
        positivasTotal: 0,
        positivasPoints: 0,
        partesCount: 0,
        lateCount: 0,
        lateCountSemana: 0,
        studentsWithLateWarning: [],
        studentCount: 0,
        ratioPositiva: 0,
        totalIncidenciasSemana: 0,
        numIncidenciasPositivasSemana: 0,
        numIncidenciasNegativasSemana: 0,
        favorableStudentsCount: 0,
        criticalStudentsCount: 0,
        veryCriticalStudentsCount: 0,
        partesSemana: 0,
        favorableThreshold: cfg.thresholds?.favorableThreshold ?? -10,
        muyCriticoThreshold: cfg.thresholds?.muyCriticoThreshold ?? -20,
      });
    });

    const getOrCreateStat = (className: string): ClassConductSummary => {
      const g = className.trim();
      let stat = map.get(g);
      if (!stat) {
        const cfg = getClassConductConfig(g);
        stat = {
          className: g,
          disruptivasTotal: 0,
          leves: 0,
          graves: 0,
          muyGraves: 0,
          positivasTotal: 0,
          positivasPoints: 0,
          partesCount: 0,
          lateCount: 0,
          lateCountSemana: 0,
          studentsWithLateWarning: [],
          studentCount: 0,
          ratioPositiva: 0,
          totalIncidenciasSemana: 0,
          numIncidenciasPositivasSemana: 0,
          numIncidenciasNegativasSemana: 0,
          favorableStudentsCount: 0,
          criticalStudentsCount: 0,
          veryCriticalStudentsCount: 0,
          partesSemana: 0,
          favorableThreshold: cfg.thresholds?.favorableThreshold ?? -10,
          muyCriticoThreshold: cfg.thresholds?.muyCriticoThreshold ?? -20,
        };
        map.set(g, stat);
      }
      return stat;
    };

    // Populate incidents
    incidents.forEach((inc) => {
      const stat = getOrCreateStat(inc.studentGroup);
      stat.disruptivasTotal += 1;
      if (inc.severity === 'Leve') stat.leves += 1;
      if (inc.severity === 'Grave') stat.graves += 1;
      if (inc.severity === 'Muy Grave') stat.muyGraves += 1;
      if (
        inc.severity === 'Muy Grave' ||
        (inc.points && inc.points <= -20) ||
        inc.immediateMeasure?.toLowerCase().includes('parte')
      ) {
        stat.partesCount += 1;
      }

      if (isDateInActiveWeek(inc.date, activeMonday)) {
        stat.numIncidenciasNegativasSemana += 1;
        if (
          inc.severity === 'Muy Grave' ||
          (inc.points && inc.points <= -20) ||
          inc.immediateMeasure?.toLowerCase().includes('parte')
        ) {
          stat.partesSemana += 1;
        }
      }
    });

    // Populate positives
    positives.forEach((pos) => {
      const stat = getOrCreateStat(pos.studentGroup);
      stat.positivasTotal += 1;
      stat.positivasPoints += getPositivePoints(pos);

      if (isDateInActiveWeek(pos.date, activeMonday)) {
        stat.numIncidenciasPositivasSemana += 1;
      }
    });

    map.forEach((stat) => {
      stat.totalIncidenciasSemana =
        stat.numIncidenciasNegativasSemana + stat.numIncidenciasPositivasSemana;
    });

    // Populate late arrivals and compute warnings per student
    const studentLateMap = new Map<string, { count: number; group: string }>();
    lateArrivals.forEach((la) => {
      const stat = getOrCreateStat(la.studentGroup);
      stat.lateCount += 1;
      if (isDateInActiveWeek(la.date, activeMonday)) {
        stat.lateCountSemana += 1;
      }

      const stKey = la.studentName.trim();
      const cur = studentLateMap.get(stKey) || { count: 0, group: la.studentGroup.trim() };
      cur.count += 1;
      studentLateMap.set(stKey, cur);
    });

    studentLateMap.forEach((val, studentName) => {
      if (val.count >= lateWarningThreshold) {
        const stat = map.get(val.group);
        if (stat && !stat.studentsWithLateWarning.includes(studentName)) {
          stat.studentsWithLateWarning.push(studentName);
        }
      }
    });

    // Compute student census and individual scores for Favorable, Crítico, Muy Crítico
    map.forEach((stat) => {
      const classSts = students.filter(
        (st) => st.className.trim().toLowerCase() === stat.className.toLowerCase()
      );
      stat.studentCount = classSts.length;

      const classIncs = incidents.filter(
        (i) => i.studentGroup.trim().toLowerCase() === stat.className.toLowerCase()
      );
      const classPoss = positives.filter(
        (p) => p.studentGroup.trim().toLowerCase() === stat.className.toLowerCase()
      );

      const evaluatedStudentNames = new Set<string>();
      classSts.forEach((s) => evaluatedStudentNames.add(s.name.trim()));
      classIncs.forEach((i) => evaluatedStudentNames.add(i.studentName.trim()));
      classPoss.forEach((p) => evaluatedStudentNames.add(p.studentName.trim()));

      if (stat.studentCount === 0 && evaluatedStudentNames.size > 0) {
        stat.studentCount = evaluatedStudentNames.size;
      }

      evaluatedStudentNames.forEach((stName) => {
        const weeklyPoints = getStudentWeeklyPoints(stName, classIncs, classPoss, activeMonday);
        if (weeklyPoints > stat.favorableThreshold) {
          stat.favorableStudentsCount += 1;
        } else if (weeklyPoints >= stat.muyCriticoThreshold) {
          stat.criticalStudentsCount += 1;
        } else {
          stat.veryCriticalStudentsCount += 1;
        }
      });

      const totalConducts = stat.disruptivasTotal + stat.positivasTotal;
      stat.ratioPositiva =
        totalConducts > 0 ? Math.round((stat.positivasTotal / totalConducts) * 100) : 50;
    });

    return map;
  }, [classes, incidents, positives, students, lateArrivals, lateWarningThreshold, activeMonday]);

  // List of stats sorted according to selection
  const sortedClassStats = useMemo(() => {
    const list: ClassConductSummary[] = Array.from(classStatsMap.values());
    return list
      .filter((s) => {
        // Visibility filter: active vs hidden vs all
        if (visibilityFilter === 'ACTIVE' && s.schoolClass?.isHidden) return false;
        if (visibilityFilter === 'HIDDEN' && !s.schoolClass?.isHidden) return false;

        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          s.className.toLowerCase().includes(q) ||
          (s.schoolClass?.tutorName.toLowerCase().includes(q) ?? false) ||
          (s.schoolClass?.room.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'disruptivas') return b.disruptivasTotal - a.disruptivasTotal;
        if (sortOrder === 'positivas') return b.positivasTotal - a.positivasTotal;
        return a.className.localeCompare(b.className);
      });
  }, [classStatsMap, searchTerm, sortOrder, visibilityFilter]);

  // If a specific class is selected, get detailed data
  const isSpecificClassSelected = selectedClassFilter !== 'ALL';
  const currentStat = isSpecificClassSelected ? classStatsMap.get(selectedClassFilter) : null;

  // Filtered incidents for selected class
  const classIncidents = useMemo(() => {
    if (!isSpecificClassSelected) return incidents;
    return incidents.filter(
      (inc) => inc.studentGroup.trim().toLowerCase() === selectedClassFilter.trim().toLowerCase()
    );
  }, [incidents, isSpecificClassSelected, selectedClassFilter]);

  // Filtered positives for selected class
  const classPositives = useMemo(() => {
    if (!isSpecificClassSelected) return positives;
    return positives.filter(
      (pos) => pos.studentGroup.trim().toLowerCase() === selectedClassFilter.trim().toLowerCase()
    );
  }, [positives, isSpecificClassSelected, selectedClassFilter]);

  // Filtered students for selected class
  const classStudents = useMemo(() => {
    if (!isSpecificClassSelected) return students;
    return students.filter(
      (st) => st.className.trim().toLowerCase() === selectedClassFilter.trim().toLowerCase()
    );
  }, [students, isSpecificClassSelected, selectedClassFilter]);

  // Filtered late arrivals for selected class
  const classLateArrivals = useMemo(() => {
    if (!isSpecificClassSelected) return lateArrivals;
    return lateArrivals.filter(
      (la) => la.studentGroup.trim().toLowerCase() === selectedClassFilter.trim().toLowerCase()
    );
  }, [lateArrivals, isSpecificClassSelected, selectedClassFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header of Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Seguimiento Integral de Conductas por Aula
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y supervisión de aulas: crea grupos, oculta las aulas sin uso y consulta el expediente de convivencia.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón para crear nueva aula desde Dirección */}
          {onOpenCreateClass && (
            <button
              id="btn-create-class-tracking"
              type="button"
              onClick={onOpenCreateClass}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Crear nueva aula para el seguimiento de conductas"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ Crear Nueva Aula</span>
            </button>
          )}

          {isSpecificClassSelected && (
            <button
              type="button"
              onClick={() => onSelectClassFilter('ALL')}
              className="px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors cursor-pointer"
            >
              ← Volver a Lista de Aulas
            </button>
          )}
        </div>
      </div>

      {/* Classroom Selection Bar (Pills) & Visibility Mode Toggle */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Visibility Filter Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider pl-1">Mostrar:</span>
          <button
            type="button"
            id="filter-tracking-active"
            onClick={() => setVisibilityFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              visibilityFilter === 'ACTIVE'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Aulas Activas ({activeClassesCount})</span>
          </button>

          <button
            type="button"
            id="filter-tracking-hidden"
            onClick={() => setVisibilityFilter('HIDDEN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              visibilityFilter === 'HIDDEN'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Aulas marcadas como ocultas por no estar en uso"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>Ocultas / Sin uso ({hiddenClassesCount})</span>
          </button>

          <button
            type="button"
            id="filter-tracking-all"
            onClick={() => setVisibilityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              visibilityFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>Todas ({classes.length})</span>
          </button>
        </div>

        {/* Quick Classroom Quick-Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => onSelectClassFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              selectedClassFilter === 'ALL'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vista General
          </button>
          {classes
            .filter((c) => {
              if (visibilityFilter === 'ACTIVE') return !c.isHidden;
              if (visibilityFilter === 'HIDDEN') return c.isHidden;
              return true;
            })
            .map((c) => {
              const st = classStatsMap.get(c.name);
              const hasWarning = (st?.studentsWithLateWarning?.length ?? 0) > 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectClassFilter(c.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    selectedClassFilter === c.name
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{c.name}</span>
                  {c.isHidden && <EyeOff className="w-3 h-3 text-slate-400" title="Aula oculta" />}
                  {hasWarning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Avisos de retrasos en esta clase" />
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* VIEW A: Single Classroom Deep Dive (when an aula is selected) */}
      {isSpecificClassSelected && currentStat && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          {/* Classroom Hero Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-md">
                  Expediente de Aula
                </span>
                <span className="text-xs text-slate-400">
                  {currentStat.schoolClass?.room || 'Aula de referencia'}
                </span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">{currentStat.className}</h3>
              <p className="text-xs text-slate-300 mt-1">
                Tutor/a: <strong>{currentStat.schoolClass?.tutorName || 'No asignado'}</strong> • {currentStat.studentCount} alumnos censados
              </p>
            </div>

            {/* Quick KPIs for this Classroom */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/10 text-center min-w-[90px]">
                <span className="text-[11px] text-amber-300 font-bold block">Retrasos</span>
                <span className="text-xl font-black text-white">{currentStat.lateCount}</span>
                <span className="text-[10px] text-amber-400 block">
                  {(currentStat.studentsWithLateWarning || []).length} con aviso
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/10 text-center min-w-[90px]">
                <span className="text-[11px] text-purple-300 font-bold block">Índice Cívico</span>
                <span className="text-xl font-black text-white">{currentStat.ratioPositiva}%</span>
                <span className="text-[10px] text-slate-300 block">refuerzo pos.</span>
              </div>
            </div>
          </div>

          {/* Warning Banner if any student in this classroom exceeded late threshold */}
          {(currentStat.studentsWithLateWarning || []).length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-xs block">
                  ⚠️ Aviso de puntualidad en {currentStat.className}:
                </span>
                <p className="text-xs text-amber-800">
                  {(currentStat.studentsWithLateWarning || []).join(', ')} ha(n) alcanzado o superado el límite de {lateWarningThreshold} retrasos. Conforme al RRI, se debe emitir notificación formal a las familias y citación con la tutoría.
                </p>
              </div>
            </div>
          )}

          {/* Recuadros Estado y Convivencia General del Aula */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Estado y Convivencia General del Aula: {currentStat.className}
                </h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Semana Activa
              </span>
            </div>
            <ClassroomConvivenciaBoxes stat={currentStat} compact={false} />
          </div>

          {/* Grid: 1. Incidencias Recientes de este Aula | 2. Alumnos de este Aula */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left: Conduct stream of this classroom */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-bold uppercase text-slate-900">
                    Historial de Conductas en {currentStat.className}
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {classIncidents.length} registradas
                </span>
              </div>

              {classIncidents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800">Sin incidencias disruptivas registradas</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">El grupo mantiene una convivencia óptima.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto space-y-2">
                  {classIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="pt-2 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer"
                      onClick={() => onSelectIncident(inc)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 hover:text-purple-700">
                          {inc.studentName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              inc.severity === 'Muy Grave'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : inc.severity === 'Grave'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{inc.date}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{inc.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Prof: {inc.teacherName}</span>
                        <span className="font-medium text-slate-700">Medida: {inc.immediateMeasure}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Students & Late status of this classroom */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold uppercase text-slate-900">
                    Alumnado de {currentStat.className}
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {classStudents.length} alumnos
                </span>
              </div>

              {classStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No hay alumnos cargados individualmente para este aula.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                  {classStudents.map((st) => {
                    const stLateCount = classLateArrivals.filter(
                      (la) => la.studentName.trim().toLowerCase() === st.name.trim().toLowerCase()
                    ).length;
                    const stIncidentsCount = classIncidents.filter(
                      (inc) => inc.studentName.trim().toLowerCase() === st.name.trim().toLowerCase()
                    ).length;
                    const hasLateWarning = stLateCount >= lateWarningThreshold;

                    return (
                      <div
                        key={st.id}
                        className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => onOpenStudentProfile(st.name)}
                            className="font-bold text-xs text-slate-900 hover:text-purple-700 text-left hover:underline cursor-pointer block"
                          >
                            {st.name}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>{stIncidentsCount} incidencias</span>
                            <span>•</span>
                            <span className={hasLateWarning ? 'text-amber-700 font-bold' : ''}>
                              {stLateCount} retraso{stLateCount !== 1 ? 's' : ''}
                            </span>
                            {hasLateWarning && (
                              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                                LÍMITE SUPERADO
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenStudentProfile(st.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Expediente
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VIEW B: Multi-Class Comparative Cards (when "Todas las Aulas" is selected or browsing) */}
      {selectedClassFilter === 'ALL' && (
        <div className="space-y-4">
          
          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar aula por nombre o tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
              <span className="text-slate-500 text-[11px]">Ordenar:</span>
              <button
                type="button"
                onClick={() => setSortOrder('disruptivas')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  sortOrder === 'disruptivas'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + Disruptivas
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('positivas')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  sortOrder === 'positivas'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + Positivas
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('nombre')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  sortOrder === 'nombre'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Nombre
              </button>
            </div>
          </div>

          {/* Class List - Shown one below the other (una debajo de otra) */}
          <div className="flex flex-col gap-3.5">
            {sortedClassStats.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {visibilityFilter === 'HIDDEN'
                    ? 'No hay aulas ocultas en el centro'
                    : 'No se encontraron aulas'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {visibilityFilter === 'HIDDEN'
                    ? 'Todas las aulas están activas y visibles en el seguimiento. Puedes ocultar cualquier aula que no se esté usando pulsando "Ocultar Aula".'
                    : 'Prueba ajustando el término de búsqueda o añade una nueva aula para comenzar el seguimiento.'}
                </p>
                {onOpenCreateClass && (
                  <button
                    type="button"
                    onClick={onOpenCreateClass}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-300" />
                    <span>+ Crear Nueva Aula</span>
                  </button>
                )}
              </div>
            ) : (
              sortedClassStats.map((stat) => {
                const isHidden = Boolean(stat.schoolClass?.isHidden);
                const hasLateWarning = (stat.studentsWithLateWarning || []).length > 0;

                return (
                  <div
                    key={stat.className}
                    id={`row-tracking-class-${stat.className.replace(/\s+/g, '-').toLowerCase()}`}
                    className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-2xs hover:shadow-md flex flex-col gap-4 group ${
                      isHidden
                        ? 'border-slate-300 bg-slate-50/70 opacity-90'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Upper row: Class identity, Status Badges, and Action buttons */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      {/* Left: Class name, Stage, Room, Tutor */}
                      <div className="flex items-start sm:items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => onSelectClassFilter(stat.className)}
                            className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-purple-700 transition-colors cursor-pointer hover:underline"
                            title="Haz clic para abrir el expediente completo de este aula"
                          >
                            {stat.className}
                          </h3>

                          {stat.schoolClass?.stage && (
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {stat.schoolClass.stage}
                            </span>
                          )}

                          {/* Status Badge: Active vs Hidden */}
                          {isHidden ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300"
                              title="Aula no utilizada actualmente, oculta para el profesorado general"
                            >
                              <EyeOff className="w-3 h-3 text-slate-500" />
                              <span>Oculta (Sin uso)</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"
                              title="Aula activa en seguimiento"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Activa en Seguimiento</span>
                            </span>
                          )}

                          {hasLateWarning && (
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse"
                              title={`${(stat.studentsWithLateWarning || []).length} alumno(s) superan el límite de retrasos`}
                            >
                              <AlertCircle className="w-3 h-3 text-amber-700" />
                              <span>AVISO RETRASOS ({stat.studentsWithLateWarning.length})</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{stat.schoolClass?.tutorName ? `Tutor/a: ${stat.schoolClass.tutorName}` : 'Sin tutor/a'}</strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{stat.schoolClass?.room || 'Aula física no asignada'}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{stat.studentCount} alumnos censados</span>
                        </div>
                      </div>

                      {/* Right: Actions (Ocultar/Mostrar, Editar, Abrir Expediente) */}
                      <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
                        {/* Botón Ocultar / Mostrar Aula */}
                        {onToggleHideClass && stat.schoolClass && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleHideClass(stat.schoolClass!.id);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isHidden
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-300'
                            }`}
                            title={
                              isHidden
                                ? 'Reactivar aula para que esté visible en la lista principal y para docentes'
                                : 'Ocultar aula si no se está utilizando en este período'
                            }
                          >
                            {isHidden ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Reactivar Aula</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                <span>Ocultar Aula (Sin uso)</span>
                              </>
                            )}
                          </button>
                        )}

                        {onEditClass && stat.schoolClass && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditClass(stat.schoolClass!);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                            title="Editar datos del aula"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectClassFilter(stat.className)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-purple-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Ver Expediente y Alumnado</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Section: Recuadro de Retrasos (si hay aviso) + 6 Cajas de Métricas */}
                    <div className="space-y-3">
                      {hasLateWarning && (
                        <div
                          id={`aviso-retrasos-aula-${stat.className.replace(/\s+/g, '-').toLowerCase()}`}
                          className="bg-amber-500/15 border-2 border-amber-500 rounded-2xl p-3 shadow-2xs text-slate-900"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="p-1.5 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5 shadow-2xs">
                              <AlertCircle className="w-4 h-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                                  Aviso: Límite de Retrasos Superado
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full shrink-0">
                                  {stat.studentsWithLateWarning.length} {stat.studentsWithLateWarning.length === 1 ? 'alumno' : 'alumnos'}
                                </span>
                              </div>
                              <p className="text-xs text-amber-950 font-semibold mt-1 leading-snug">
                                Alumnado con &ge; {lateWarningThreshold} retrasos:{' '}
                                <strong className="font-black text-rose-950 underline decoration-amber-500">
                                  {stat.studentsWithLateWarning.join(', ')}
                                </strong>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 6 Recuadros de Métricas de Convivencia en toda la anchura */}
                      <ClassroomConvivenciaBoxes stat={stat} compact={false} />

                      {/* Summary Tags & Counters */}
                      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-extrabold px-2.5 py-1 rounded-xl text-xs ${
                              stat.disruptivasTotal > 5
                                ? 'bg-rose-100 text-rose-800'
                                : stat.disruptivasTotal > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {stat.disruptivasTotal} disruptivas acumuladas
                          </span>

                          {stat.leves > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                              {stat.leves} leves
                            </span>
                          )}
                          {stat.graves > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 text-[11px] font-bold">
                              {stat.graves} graves
                            </span>
                          )}
                          {stat.muyGraves > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                              {stat.muyGraves} muy graves
                            </span>
                          )}
                          {stat.partesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-900 border border-red-300 text-[11px] font-black">
                              {stat.partesCount} partes de expulsión
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500 font-medium">
                          Ratio de conducta positiva: <strong>{stat.ratioPositiva}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
