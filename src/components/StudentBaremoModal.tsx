import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Star,
  ShieldAlert,
  Calendar,
  Clock,
  BookOpen,
  User,
  Search,
  BarChart3,
  ListFilter,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { ClassStudent, Incident, PositiveBehavior, ConductThresholds } from '../types';
import {
  getStudentWeeklyPoints,
  getStudentCoursePoints,
  getStudentPartesCount,
  getStudentSemaforo,
  getIncidentPoints,
  getPositivePoints,
  formatWeekRange,
  getWeekKey,
} from '../utils/storage';

interface StudentBaremoModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ClassStudent | null;
  incidents: Incident[];
  positives: PositiveBehavior[];
  activeMonday: Date;
  thresholds?: ConductThresholds;
}

interface HistoryItem {
  id: string;
  name: string;
  points: number;
  date: string;
  type: 'positiva' | 'disruptiva';
  teacherName: string;
  description: string;
  subject?: string;
  timeSlot?: string;
  measure?: string;
  rawDate: Date;
}

interface ConductBarItem {
  name: string;
  type: 'positiva' | 'disruptiva';
  count: number;
  totalPoints: number;
}

export const StudentBaremoModal: React.FC<StudentBaremoModalProps> = ({
  isOpen,
  onClose,
  student,
  incidents,
  positives,
  activeMonday,
  thresholds,
}) => {
  // Sub-view toggle: 'graficos' | 'listado'
  const [activeSection, setActiveSection] = useState<'graficos' | 'listado'>('graficos');
  const [listSearch, setListSearch] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState<'ALL' | 'positiva' | 'disruptiva'>('ALL');

  const normName = student ? student.name.trim().toLowerCase() : '';

  const weeklyPoints = student
    ? getStudentWeeklyPoints(student.name, incidents, positives, activeMonday)
    : 0;
  const coursePoints = student
    ? getStudentCoursePoints(
        student.name,
        incidents,
        positives,
        student.positivePoints - student.negativePoints
      )
    : 0;
  const partesCount = student
    ? getStudentPartesCount(student.name, incidents, positives, thresholds)
    : 0;
  const semaforo = getStudentSemaforo(weeklyPoints, thresholds);

  // Partes en la semana activa:
  // Si la puntuación de la semana cae por debajo del umbral muy crítico (< -20 pts), se genera 1 parte en la semana.
  const muyCriticoThreshold = thresholds?.muyCriticoThreshold ?? -20;
  const partesEnSemana = weeklyPoints < muyCriticoThreshold ? 1 : 0;

  const history: HistoryItem[] = useMemo(() => {
    if (!student || !normName) return [];
    const items: HistoryItem[] = [];

    incidents
      .filter((i) => i.studentName.trim().toLowerCase() === normName)
      .forEach((inc) => {
        items.push({
          id: inc.id,
          name: inc.category || inc.description,
          points: getIncidentPoints(inc),
          date: inc.date,
          type: 'disruptiva',
          teacherName: inc.teacherName || 'Docente no especificado',
          description: inc.description,
          subject: inc.subject,
          timeSlot: inc.timeSlot,
          measure: inc.immediateMeasure,
          rawDate: new Date(inc.date + 'T12:00:00'),
        });
      });

    positives
      .filter((p) => p.studentName.trim().toLowerCase() === normName)
      .forEach((pos) => {
        items.push({
          id: pos.id,
          name: pos.category || pos.description,
          points: getPositivePoints(pos),
          date: pos.date,
          type: 'positiva',
          teacherName: pos.teacherName || 'Docente no especificado',
          description: pos.description,
          subject: (pos as any).subject,
          timeSlot: (pos as any).timeSlot,
          rawDate: new Date(pos.date + 'T12:00:00'),
        });
      });

    items.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    return items;
  }, [normName, incidents, positives]);

  // Active week range bounds
  const activeMondayTime = useMemo(() => {
    const d = new Date(activeMonday);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [activeMonday]);

  const activeSundayTime = useMemo(() => {
    return activeMondayTime + 7 * 24 * 60 * 60 * 1000;
  }, [activeMondayTime]);

  // Filter history for active week
  const activeWeekItems = useMemo(() => {
    return history.filter((item) => {
      const t = item.rawDate.getTime();
      return t >= activeMondayTime && t < activeSundayTime;
    });
  }, [history, activeMondayTime, activeSundayTime]);

  // Group behaviors for active week
  const weekConductGroups: ConductBarItem[] = useMemo(() => {
    const map = new Map<string, ConductBarItem>();
    activeWeekItems.forEach((item) => {
      const key = `${item.type}_${item.name}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalPoints += item.points;
      } else {
        map.set(key, {
          name: item.name,
          type: item.type,
          count: 1,
          totalPoints: item.points,
        });
      }
    });

    const result = Array.from(map.values());
    // Sort: disruptivas first, then by count descending
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'disruptiva' ? -1 : 1;
      return b.count - a.count;
    });
    return result;
  }, [activeWeekItems]);

  // Group behaviors for full course ("Conductas desde el inicio")
  const courseConductGroups: ConductBarItem[] = useMemo(() => {
    const map = new Map<string, ConductBarItem>();
    history.forEach((item) => {
      const key = `${item.type}_${item.name}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalPoints += item.points;
      } else {
        map.set(key, {
          name: item.name,
          type: item.type,
          count: 1,
          totalPoints: item.points,
        });
      }
    });

    const result = Array.from(map.values());
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'disruptiva' ? -1 : 1;
      return b.count - a.count;
    });
    return result;
  }, [history]);

  // Filtered list for the audit view
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (listTypeFilter !== 'ALL' && item.type !== listTypeFilter) return false;
      if (!listSearch.trim()) return true;
      const q = listSearch.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.teacherName.toLowerCase().includes(q) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.date.toLowerCase().includes(q)
      );
    });
  }, [history, listSearch, listTypeFilter]);

  // Calculate maximum counts for relative bar widths
  const maxWeekCount = useMemo(() => {
    if (weekConductGroups.length === 0) return 1;
    return Math.max(...weekConductGroups.map((g) => g.count));
  }, [weekConductGroups]);

  const maxCourseCount = useMemo(() => {
    if (courseConductGroups.length === 0) return 1;
    return Math.max(...courseConductGroups.map((g) => g.count));
  }, [courseConductGroups]);

  // Quick summary counts for week
  const weekDisruptiveCount = activeWeekItems.filter((i) => i.type === 'disruptiva').length;
  const weekPositiveCount = activeWeekItems.filter((i) => i.type === 'positiva').length;

  // Quick summary counts for course
  const courseDisruptiveCount = history.filter((i) => i.type === 'disruptiva').length;
  const coursePositiveCount = history.filter((i) => i.type === 'positiva').length;

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header - Strictly NO "+ Registrar Conducta" link */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl ${
                student.avatarColor || 'bg-blue-600'
              } text-white font-black text-base flex items-center justify-center shadow-md border-2 border-white/20 shrink-0`}
            >
              {student.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                Ficha Resumen de Conductas
              </span>
              <h2 className="text-xl font-black text-white leading-tight">
                {student.name}
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2">
                <span>{student.className}</span>
                <span>•</span>
                <span>Semana activa: {formatWeekRange(activeMonday)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPIs Banner: Incorpora la información Partes en la semana */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* 1. Partes en la semana (Solicitado expresamente) */}
            <div
              className={`p-3 rounded-2xl border shadow-2xs ${
                partesEnSemana > 0
                  ? 'bg-rose-50/90 border-rose-200 ring-2 ring-rose-300/40'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-700">
                Partes en la semana
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-xl font-black ${
                    partesEnSemana > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {partesEnSemana} {partesEnSemana === 1 ? 'parte' : 'partes'}
                </span>
              </div>
              <span
                className={`text-[10px] block mt-0.5 font-semibold ${
                  partesEnSemana > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {partesEnSemana > 0
                  ? `Límite superado (< ${muyCriticoThreshold} pts)`
                  : 'Semana favorable'}
              </span>
            </div>

            {/* 2. Partes Acumulados en el curso */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Partes curso
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span
                  className={`text-xl font-black ${
                    partesCount > 0 ? 'text-rose-700' : 'text-slate-800'
                  }`}
                >
                  {partesCount} {partesCount === 1 ? 'parte' : 'partes'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Total del curso
              </span>
            </div>

            {/* 3. Puntos Semana Activa */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Puntos semana
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-xl font-black ${
                    weeklyPoints > 0
                      ? 'text-emerald-600'
                      : weeklyPoints < 0
                      ? 'text-rose-600'
                      : 'text-slate-700'
                  }`}
                >
                  {weeklyPoints > 0 ? `+${weeklyPoints}` : weeklyPoints} pts
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Desde el lunes
              </span>
            </div>

            {/* 4. Semáforo Semanal */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Semáforo semanal
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`w-3.5 h-3.5 rounded-full shadow-xs shrink-0 ${
                    semaforo === 'verde'
                      ? 'bg-emerald-500 ring-2 ring-emerald-200'
                      : semaforo === 'amarillo'
                      ? 'bg-amber-400 ring-2 ring-amber-200'
                      : 'bg-rose-500 ring-2 ring-rose-200 animate-pulse'
                  }`}
                />
                <span className="text-xs font-black uppercase text-slate-800">
                  {semaforo === 'verde' ? 'Verde' : semaforo === 'amarillo' ? 'Amarillo' : 'Rojo'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {semaforo === 'verde'
                  ? `Favorable (> ${thresholds?.favorableThreshold ?? -10})`
                  : semaforo === 'amarillo'
                  ? 'Crítico'
                  : 'Muy Crítico'}
              </span>
            </div>

            {/* 5. Puntos Curso */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                Puntos curso
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-xl font-black ${
                    coursePoints >= 0 ? 'text-indigo-600' : 'text-rose-700'
                  }`}
                >
                  {coursePoints > 0 ? `+${coursePoints}` : coursePoints} pts
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Acumulado anual
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher & Link to List */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveSection('graficos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'graficos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficos de Conductas</span>
            </button>

            {/* Enlace al listado con todas las conductas registradas y el profesor que las creó */}
            <button
              onClick={() => setActiveSection('listado')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'listado'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Listado de Conductas y Profesores ({history.length})</span>
            </button>
          </div>

          {activeSection === 'graficos' && (
            <button
              onClick={() => setActiveSection('listado')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <span>Ver listado con profesores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* SECTION 1: GRÁFICOS */}
          {activeSection === 'graficos' && (
            <div className="space-y-6">
              {/* Link Banner directly inside view as requested */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Registro de Auditoría de Docentes
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Consulta el listado completo de anotaciones con el profesor que creó cada conducta.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveSection('listado')}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Listado ({history.length})</span>
                </button>
              </div>

              {/* GRÁFICO 1: Conductas en la semana activa (disruptivas y positivas) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Conductas en la semana activa
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatWeekRange(activeMonday)} • Desglose de conductas disruptivas y positivas registradas
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                      <Star className="w-3 h-3 text-emerald-600" />
                      <span>{weekPositiveCount} Positivas</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{weekDisruptiveCount} Disruptivas</span>
                    </span>
                  </div>
                </div>

                {/* Bars Render */}
                {weekConductGroups.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {weekConductGroups.map((conduct, idx) => {
                      const isPositive = conduct.type === 'positiva';
                      const pct = Math.max(12, Math.round((conduct.count / maxWeekCount) * 100));

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                            <span className="flex items-center gap-1.5 truncate pr-2">
                              {isPositive ? (
                                <Star className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              )}
                              <span className="truncate">{conduct.name}</span>
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-500 text-[11px] font-medium">
                                {conduct.count} {conduct.count === 1 ? 'vez' : 'veces'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                                  isPositive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {conduct.totalPoints > 0 ? `+${conduct.totalPoints}` : conduct.totalPoints} pts
                              </span>
                            </div>
                          </div>

                          {/* Bar background and track */}
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isPositive
                                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                  : 'bg-gradient-to-r from-rose-400 to-rose-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-800">
                      Sin conductas registradas en esta semana
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      El alumno no tiene incidencias disruptivas ni anotaciones en el rango semanal activo.
                    </p>
                  </div>
                )}
              </div>

              {/* GRÁFICO 2: conductas desde el inicio (Solicitado con este nombre exacto) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Conductas desde el inicio
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Historial acumulado a lo largo de todo el curso escolar
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                      <Star className="w-3 h-3 text-emerald-600" />
                      <span>{coursePositiveCount} Positivas en curso</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{courseDisruptiveCount} Disruptivas en curso</span>
                    </span>
                  </div>
                </div>

                {/* Bars Render */}
                {courseConductGroups.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {courseConductGroups.map((conduct, idx) => {
                      const isPositive = conduct.type === 'positiva';
                      const pct = Math.max(12, Math.round((conduct.count / maxCourseCount) * 100));

                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                            <span className="flex items-center gap-1.5 truncate pr-2">
                              {isPositive ? (
                                <Star className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              )}
                              <span className="truncate">{conduct.name}</span>
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-500 text-[11px] font-medium">
                                {conduct.count} {conduct.count === 1 ? 'vez' : 'veces'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                                  isPositive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {conduct.totalPoints > 0 ? `+${conduct.totalPoints}` : conduct.totalPoints} pts
                              </span>
                            </div>
                          </div>

                          {/* Bar background and track */}
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isPositive
                                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                                  : 'bg-gradient-to-r from-rose-400 to-rose-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Star className="w-7 h-7 text-indigo-400 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-800">
                      Sin conductas registradas desde el inicio del curso
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      El historial se graficará de manera acumulada cuando se anoten conductas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: LISTADO CON TODAS LAS CONDUCTAS Y EL PROFESOR QUE LAS CREÓ */}
          {activeSection === 'listado' && (
            <div className="space-y-4">
              {/* Search & Type filter bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por profesor, conducta, materia o fecha..."
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setListTypeFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      listTypeFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({history.length})
                  </button>
                  <button
                    onClick={() => setListTypeFilter('positiva')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      listTypeFilter === 'positiva'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Positivas ({coursePositiveCount})
                  </button>
                  <button
                    onClick={() => setListTypeFilter('disruptiva')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      listTypeFilter === 'disruptiva'
                        ? 'bg-rose-700 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    Disruptivas ({courseDisruptiveCount})
                  </button>
                </div>
              </div>

              {/* Conduct Cards List */}
              <div className="space-y-2.5">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            item.type === 'positiva'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.type === 'positiva' ? 'Positiva' : 'Disruptiva'}
                        </span>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.name}
                        </h4>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Explicitly highlight teacher who created it as requested */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] pt-1">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                          <User className="w-3 h-3 text-indigo-600" />
                          <span>Profesor/a: {item.teacherName}</span>
                        </span>

                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{item.date}</span>
                        </span>

                        {item.timeSlot && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.timeSlot}</span>
                          </span>
                        )}

                        {item.subject && (
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            <span>{item.subject}</span>
                          </span>
                        )}

                        {item.measure && (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                            ⚖️ Medida: {item.measure}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span
                        className={`text-sm font-black px-3 py-1.5 rounded-xl border ${
                          item.points > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.points > 0 ? `+${item.points}` : item.points} pts
                      </span>
                    </div>
                  </div>
                ))}

                {filteredHistory.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      Sin conductas registradas con los filtros seleccionados
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Prueba con otro término de búsqueda o cambia la categoría de filtro.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer - No +Registrar Conducta link */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Mostrando información disciplinaria y conductual actualizada
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
