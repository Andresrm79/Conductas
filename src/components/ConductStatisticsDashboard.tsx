import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Calendar,
  Users,
  ShieldAlert,
  AlertCircle,
  FileSpreadsheet,
  Download,
  School,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
  getWeekKey,
  getMondayOfActiveWeek,
  formatWeekRange,
} from '../utils/storage';
import { exportIncidentsToExcel } from '../utils/excelHelper';

interface ConductStatisticsDashboardProps {
  incidents?: Incident[];
  positives?: PositiveBehavior[];
  classes?: SchoolClass[];
  students?: ClassStudent[];
  lateArrivals?: LateArrival[];
  currentUser?: UserProfile;
  onOpenStudentProfile: (studentName: string) => void;
  onSelectIncident?: (inc: Incident) => void;
}

export const ConductStatisticsDashboard: React.FC<ConductStatisticsDashboardProps> = ({
  incidents = [],
  positives = [],
  classes = [],
  students = [],
  lateArrivals = [],
  currentUser,
  onOpenStudentProfile,
  onSelectIncident = () => {},
}) => {
  const [behaviorTypeFilter, setBehaviorTypeFilter] = useState<'all' | 'disruptiva' | 'positiva'>('all');
  const [expandedWeekKey, setExpandedWeekKey] = useState<string | null>(null);

  const totalIncidents = (incidents || []).length;
  const totalPositives = (positives || []).length;
  const totalConducts = totalIncidents + totalPositives;

  // 1. TIPOS DE CONDUCTAS MÁS REPETITIVAS
  const repetitiveBehaviors = useMemo(() => {
    interface BehaviorStat {
      name: string;
      type: 'disruptiva' | 'positiva';
      count: number;
      percentageOfCategory: number;
      percentageOfTotal: number;
      severities?: { leves: number; graves: number; muyGraves: number };
      pointsImpact: number;
    }

    const map = new Map<string, BehaviorStat>();

    incidents.forEach((inc) => {
      const name = inc.category?.trim() || 'Conducta no categorizada';
      const existing = map.get(name) || {
        name,
        type: 'disruptiva',
        count: 0,
        percentageOfCategory: 0,
        percentageOfTotal: 0,
        severities: { leves: 0, graves: 0, muyGraves: 0 },
        pointsImpact: 0,
      };

      existing.count += 1;
      if (inc.severity === 'Leve') existing.severities!.leves += 1;
      if (inc.severity === 'Grave') existing.severities!.graves += 1;
      if (inc.severity === 'Muy Grave') existing.severities!.muyGraves += 1;
      existing.pointsImpact += getIncidentPoints(inc);

      map.set(name, existing);
    });

    positives.forEach((pos) => {
      const name = pos.category?.trim() || 'Conducta cívica / positiva';
      const existing = map.get(name) || {
        name,
        type: 'positiva',
        count: 0,
        percentageOfCategory: 0,
        percentageOfTotal: 0,
        pointsImpact: 0,
      };

      existing.count += 1;
      existing.pointsImpact += getPositivePoints(pos);
      map.set(name, existing);
    });

    const list = Array.from(map.values());
    list.forEach((b) => {
      b.percentageOfTotal = totalConducts > 0 ? Math.round((b.count / totalConducts) * 100) : 0;
      if (b.type === 'disruptiva') {
        b.percentageOfCategory = totalIncidents > 0 ? Math.round((b.count / totalIncidents) * 100) : 0;
      } else {
        b.percentageOfCategory = totalPositives > 0 ? Math.round((b.count / totalPositives) * 100) : 0;
      }
    });

    return list.sort((a, b) => b.count - a.count);
  }, [incidents, positives, totalIncidents, totalPositives, totalConducts]);

  const filteredBehaviors = useMemo(() => {
    if (behaviorTypeFilter === 'disruptiva') return repetitiveBehaviors.filter((b) => b.type === 'disruptiva');
    if (behaviorTypeFilter === 'positiva') return repetitiveBehaviors.filter((b) => b.type === 'positiva');
    return repetitiveBehaviors;
  }, [repetitiveBehaviors, behaviorTypeFilter]);

  // 2. NÚMERO DE CONDUCTAS DISRUPTIVAS POR AULA
  const disruptivePerClass = useMemo(() => {
    const map = new Map<
      string,
      {
        className: string;
        count: number;
        leves: number;
        graves: number;
        muyGraves: number;
        percentageOfTotal: number;
        tutorName?: string;
      }
    >();

    classes.forEach((c) => {
      map.set(c.name.trim(), {
        className: c.name.trim(),
        count: 0,
        leves: 0,
        graves: 0,
        muyGraves: 0,
        percentageOfTotal: 0,
        tutorName: c.tutorName,
      });
    });

    incidents.forEach((inc) => {
      const g = inc.studentGroup.trim();
      let row = map.get(g);
      if (!row) {
        row = {
          className: g,
          count: 0,
          leves: 0,
          graves: 0,
          muyGraves: 0,
          percentageOfTotal: 0,
        };
        map.set(g, row);
      }

      row.count += 1;
      if (inc.severity === 'Leve') row.leves += 1;
      if (inc.severity === 'Grave') row.graves += 1;
      if (inc.severity === 'Muy Grave') row.muyGraves += 1;
    });

    const list = Array.from(map.values());
    list.forEach((r) => {
      r.percentageOfTotal = totalIncidents > 0 ? Math.round((r.count / totalIncidents) * 100) : 0;
    });

    return list.sort((a, b) => b.count - a.count);
  }, [classes, incidents, totalIncidents]);

  // 3. NÚMERO DE CONDUCTAS POSITIVAS POR AULA
  const positivePerClass = useMemo(() => {
    const map = new Map<
      string,
      {
        className: string;
        count: number;
        points: number;
        percentageOfTotal: number;
        tutorName?: string;
      }
    >();

    classes.forEach((c) => {
      map.set(c.name.trim(), {
        className: c.name.trim(),
        count: 0,
        points: 0,
        percentageOfTotal: 0,
        tutorName: c.tutorName,
      });
    });

    positives.forEach((pos) => {
      const g = pos.studentGroup.trim();
      let row = map.get(g);
      if (!row) {
        row = {
          className: g,
          count: 0,
          points: 0,
          percentageOfTotal: 0,
        };
        map.set(g, row);
      }

      row.count += 1;
      row.points += getPositivePoints(pos);
    });

    const list = Array.from(map.values());
    list.forEach((r) => {
      r.percentageOfTotal = totalPositives > 0 ? Math.round((r.count / totalPositives) * 100) : 0;
    });

    return list.sort((a, b) => b.count - a.count);
  }, [classes, positives, totalPositives]);

  // 4. NÚMERO DE PARTES POR SEMANA
  const partesPerWeek = useMemo(() => {
    interface WeekParteData {
      weekKey: string;
      label: string;
      mondayDate: Date;
      partesCount: number;
      severeIncidents: Incident[];
      studentsAffected: string[];
    }

    const map = new Map<string, WeekParteData>();

    // Disciplinary reports generated directly by severe incidents or low weekly net scores
    incidents.forEach((inc) => {
      const isParte =
        inc.severity === 'Muy Grave' ||
        (inc.points && inc.points <= -20) ||
        inc.severity === 'Grave';

      if (!isParte) return;

      const wKey = getWeekKey(inc.date);
      let entry = map.get(wKey);
      if (!entry) {
        const parts = inc.date.split('-');
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
        const mon = getMondayOfActiveWeek(d);
        entry = {
          weekKey: wKey,
          label: formatWeekRange(mon),
          mondayDate: mon,
          partesCount: 0,
          severeIncidents: [],
          studentsAffected: [],
        };
        map.set(wKey, entry);
      }

      entry.partesCount += 1;
      entry.severeIncidents.push(inc);
      if (!entry.studentsAffected.includes(inc.studentName)) {
        entry.studentsAffected.push(inc.studentName);
      }
    });

    const list = Array.from(map.values());
    return list.sort((a, b) => b.mondayDate.getTime() - a.mondayDate.getTime());
  }, [incidents]);

  const totalPartesCount = useMemo(() => {
    return partesPerWeek.reduce((acc, w) => acc + w.partesCount, 0);
  }, [partesPerWeek]);

  // 5. ALUMNOS QUE AGLUTINAN LA MAYORÍA DE CONDUCTAS DISRUPTIVAS
  const concentratedStudents = useMemo(() => {
    const studentMap = new Map<
      string,
      {
        studentName: string;
        studentGroup: string;
        totalDisruptivas: number;
        leves: number;
        graves: number;
        muyGraves: number;
        totalNegativePoints: number;
        partesCount: number;
        retrasosCount: number;
        lastDate: string;
        needsIntervention: boolean;
        percentageOfTotalSchoolDisruptions: number;
      }
    >();

    incidents.forEach((inc) => {
      const name = inc.studentName.trim();
      let row = studentMap.get(name);
      if (!row) {
        row = {
          studentName: name,
          studentGroup: inc.studentGroup,
          totalDisruptivas: 0,
          leves: 0,
          graves: 0,
          muyGraves: 0,
          totalNegativePoints: 0,
          partesCount: 0,
          retrasosCount: 0,
          lastDate: inc.date,
          needsIntervention: false,
          percentageOfTotalSchoolDisruptions: 0,
        };
        studentMap.set(name, row);
      }

      row.totalDisruptivas += 1;
      if (inc.severity === 'Leve') row.leves += 1;
      if (inc.severity === 'Grave') row.graves += 1;
      if (inc.severity === 'Muy Grave') row.muyGraves += 1;
      row.totalNegativePoints += getIncidentPoints(inc);

      if (inc.severity === 'Muy Grave' || (inc.points && inc.points <= -20)) {
        row.partesCount += 1;
      }

      if (new Date(inc.date).getTime() > new Date(row.lastDate).getTime()) {
        row.lastDate = inc.date;
      }
    });

    // Populate late arrivals count
    (lateArrivals || []).forEach((la) => {
      const name = la.studentName.trim();
      const row = studentMap.get(name);
      if (row) {
        row.retrasosCount += 1;
      }
    });

    const list = Array.from(studentMap.values());
    list.forEach((s) => {
      s.needsIntervention = s.muyGraves > 0 || s.graves >= 2 || s.totalDisruptivas >= 3;
      s.percentageOfTotalSchoolDisruptions =
        totalIncidents > 0 ? Math.round((s.totalDisruptivas / totalIncidents) * 100) : 0;
    });

    // Sort descending by total disruptive conducts
    return list.sort((a, b) => b.totalDisruptivas - a.totalDisruptivas);
  }, [incidents, lateArrivals, totalIncidents]);

  // Pareto metric: what percentage of incidents is caused by the top 3 or top 5 students
  const paretoMetric = useMemo(() => {
    if (concentratedStudents.length === 0 || totalIncidents === 0) return null;
    const topCount = Math.min(3, concentratedStudents.length);
    const topStudentsIncidents = concentratedStudents
      .slice(0, topCount)
      .reduce((acc, s) => acc + s.totalDisruptivas, 0);
    const pct = Math.round((topStudentsIncidents / totalIncidents) * 100);
    return {
      topCount,
      percentage: pct,
      studentsNames: concentratedStudents.slice(0, topCount).map((s) => s.studentName),
    };
  }, [concentratedStudents, totalIncidents]);

  const maxDisruptiveClassCount = disruptivePerClass[0]?.count || 1;
  const maxPositiveClassCount = positivePerClass[0]?.count || 1;
  const maxPartesWeekCount = partesPerWeek[0]?.partesCount || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-md">
              Módulo de Analítica Directiva
            </span>
            <span className="text-xs text-slate-400">
              Datos consolidados en tiempo real
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Estadísticas y Patrones de Conducta
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Análisis de recurrencia, distribución por aula, evolución semanal de partes disciplinarios y concentración de conductas disruptivas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportIncidentsToExcel(incidents, `analisis_convivencia_direccion_${new Date().toISOString().slice(0, 10)}.xlsx`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Análisis Completo</span>
        </button>
      </div>

      {/* KPI Cards: 4 High-level Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Conductas Disruptivas</span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{totalIncidents}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Total de partes e incidencias registradas
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Conductas Positivas</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">+{totalPositives}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Reconocimientos de mérito cívico
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Partes Disciplinarios</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{totalPartesCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Acumulados en {partesPerWeek.length} semanas lectivas
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500">Alumnos Prioritarios</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">
            {concentratedStudents.filter((s) => s.needsIntervention).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Aglutinan la mayor conflictividad escolar
          </p>
        </div>
      </div>

      {/* SECTION 5: ALUMNOS QUE AGLUTINAN LA MAYORÍA DE CONDUCTAS DISRUPTIVAS */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Alumnos que Aglutinan la Mayoría de Conductas Disruptivas
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Análisis de concentración y alumnos clave para la intervención del equipo directivo y orientación.
            </p>
          </div>

          {paretoMetric && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 text-xs text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>{paretoMetric.topCount} alumnos</strong> concentran el <strong>{paretoMetric.percentage}%</strong> de las conductas disruptivas del centro.
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="p-3">Alumno / Aula</th>
                <th className="p-3 text-center">Faltas Leves</th>
                <th className="p-3 text-center">Faltas Graves</th>
                <th className="p-3 text-center">Muy Graves</th>
                <th className="p-3 text-center">Total Conductas</th>
                <th className="p-3 text-center">% de Centro</th>
                <th className="p-3 text-center">Retrasos</th>
                <th className="p-3">Estado Disciplinario</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {concentratedStudents.slice(0, 10).map((st, idx) => (
                <tr
                  key={st.studentName}
                  className={`hover:bg-slate-50 transition-colors ${
                    idx < 3 ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <button
                          type="button"
                          onClick={() => onOpenStudentProfile(st.studentName)}
                          className="font-bold text-slate-900 hover:text-purple-700 hover:underline cursor-pointer block text-left"
                        >
                          {st.studentName}
                        </button>
                        <span className="text-[11px] font-medium text-slate-500">
                          {st.studentGroup}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-center font-bold text-amber-800">{st.leves}</td>
                  <td className="p-3 text-center font-bold text-orange-800">{st.graves}</td>
                  <td className="p-3 text-center font-black text-red-800">{st.muyGraves}</td>
                  <td className="p-3 text-center font-black text-rose-700 text-sm">
                    {st.totalDisruptivas}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {st.percentageOfTotalSchoolDisruptions}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-700">
                    {st.retrasosCount > 0 ? (
                      <span className="text-amber-700 font-bold">{st.retrasosCount}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="p-3">
                    {st.needsIntervention ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        COMISIÓN / ALERTA
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Seguimiento ordinario
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenStudentProfile(st.studentName)}
                      className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                    >
                      Ver Expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 1: TIPOS DE CONDUCTAS MÁS REPETITIVAS */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                Tipos de Conductas más Repetitivas
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Frecuencia y porcentaje de recurrencia de conductas en las aulas.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setBehaviorTypeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                behaviorTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({repetitiveBehaviors.length})
            </button>
            <button
              type="button"
              onClick={() => setBehaviorTypeFilter('disruptiva')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                behaviorTypeFilter === 'disruptiva'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disruptivas
            </button>
            <button
              type="button"
              onClick={() => setBehaviorTypeFilter('positiva')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                behaviorTypeFilter === 'positiva'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Positivas
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {filteredBehaviors.slice(0, 10).map((b, idx) => {
            const isDisruptive = b.type === 'disruptiva';
            const barWidth = Math.max(8, b.percentageOfCategory);

            return (
              <div key={b.name} className="space-y-1.5 p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        isDisruptive
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isDisruptive ? 'Disruptiva' : 'Positiva'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 text-xs self-end sm:self-auto">
                    <span>
                      <strong className="text-slate-900 font-extrabold">{b.count}</strong> veces
                    </span>
                    <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                      {b.percentageOfCategory}% de su categoría
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDisruptive ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2 & 3: CONDUCTAS DISRUPTIVAS Y POSITIVAS POR AULA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 2. Conductas Disruptivas por Aula */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Conductas Disruptivas por Aula
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              {totalIncidents} total
            </span>
          </div>

          <div className="space-y-3">
            {disruptivePerClass.map((c) => {
              const pct = maxDisruptiveClassCount > 0 ? Math.round((c.count / maxDisruptiveClassCount) * 100) : 0;
              return (
                <div key={c.className} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{c.className}</span>
                      {c.tutorName && (
                        <span className="text-[11px] text-slate-500 ml-1.5 hidden sm:inline">
                          ({c.tutorName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        {c.leves > 0 && <span className="text-amber-700">{c.leves}L</span>}
                        {c.graves > 0 && <span className="text-orange-700">{c.graves}G</span>}
                        {c.muyGraves > 0 && <span className="text-red-700 font-black">{c.muyGraves}MG</span>}
                      </div>
                      <span className="font-black text-rose-700 text-sm">{c.count}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Conductas Positivas por Aula */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Conductas Positivas por Aula
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              +{totalPositives} reconocimientos
            </span>
          </div>

          <div className="space-y-3">
            {positivePerClass.map((c) => {
              const pct = maxPositiveClassCount > 0 ? Math.round((c.count / maxPositiveClassCount) * 100) : 0;
              return (
                <div key={c.className} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{c.className}</span>
                      {c.tutorName && (
                        <span className="text-[11px] text-slate-500 ml-1.5 hidden sm:inline">
                          ({c.tutorName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-700">+{c.points} pts</span>
                      <span className="font-black text-emerald-800 text-sm">+{c.count}</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* SECTION 4: NÚMERO DE PARTES POR SEMANA */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                Evolución del Número de Partes por Semana
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro histórico y tendencia de partes disciplinarios incoados a lo largo de las semanas del curso.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 text-purple-900 px-3 py-1 rounded-xl text-xs font-bold">
            Total Partes: {totalPartesCount}
          </div>
        </div>

        {partesPerWeek.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800">Sin partes disciplinarios graves incoados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Weekly Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {partesPerWeek.map((w) => {
                const isExpanded = expandedWeekKey === w.weekKey;
                return (
                  <div
                    key={w.weekKey}
                    onClick={() => setExpandedWeekKey(isExpanded ? null : w.weekKey)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isExpanded
                        ? 'border-purple-500 bg-purple-50/40 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {w.label}
                      </span>
                      <span className="text-lg font-black text-rose-700">
                        {w.partesCount} {w.partesCount === 1 ? 'parte' : 'partes'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                      <span>{w.studentsAffected.length} alumno(s)</span>
                      <div className="flex items-center gap-1 font-bold text-purple-700">
                        <span>{isExpanded ? 'Ocultar' : 'Ver detalle'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expanded Week Details */}
            {expandedWeekKey && (
              <div className="bg-slate-900 text-white p-5 rounded-2xl animate-in fade-in duration-150 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Detalle de Partes en: {partesPerWeek.find((w) => w.weekKey === expandedWeekKey)?.label}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setExpandedWeekKey(null)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {partesPerWeek
                    .find((w) => w.weekKey === expandedWeekKey)
                    ?.severeIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="bg-slate-800/90 p-3 rounded-xl flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">
                            {inc.studentName} ({inc.studentGroup})
                          </p>
                          <p className="text-slate-300 text-[11px] mt-0.5">{inc.category}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5 italic">Medida: {inc.immediateMeasure}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30">
                            {inc.severity}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">{inc.date}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
};
