import React, { useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Download,
  School,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Incident, StudentStats, UserProfile } from '../types';
import { exportIncidentsToExcel } from '../utils/excelHelper';

interface DirectivoDashboardProps {
  incidents: Incident[];
  currentUser: UserProfile;
  onOpenStudentProfile: (studentName: string) => void;
  onSelectIncident: (inc: Incident) => void;
}

export const DirectivoDashboard: React.FC<DirectivoDashboardProps> = ({
  incidents,
  currentUser,
  onOpenStudentProfile,
  onSelectIncident,
}) => {
  // Aggregate Student Statistics & Recurrence
  const studentStats = useMemo(() => {
    const map = new Map<string, StudentStats>();

    incidents.forEach((inc) => {
      const key = inc.studentName.trim();
      const existing = map.get(key) || {
        studentName: key,
        studentGroup: inc.studentGroup,
        totalIncidents: 0,
        leves: 0,
        graves: 0,
        muyGraves: 0,
        lastIncidentDate: inc.date,
        needsIntervention: false,
        recentCategories: [],
      };

      existing.totalIncidents += 1;
      if (inc.severity === 'Leve') existing.leves += 1;
      if (inc.severity === 'Grave') existing.graves += 1;
      if (inc.severity === 'Muy Grave') existing.muyGraves += 1;

      if (!existing.recentCategories.includes(inc.category)) {
        existing.recentCategories.push(inc.category);
      }

      if (new Date(inc.date).getTime() > new Date(existing.lastIncidentDate).getTime()) {
        existing.lastIncidentDate = inc.date;
      }

      // Reincidence condition
      existing.needsIntervention =
        existing.muyGraves > 0 || existing.graves >= 2 || existing.totalIncidents >= 3;

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize high risk
      if (a.needsIntervention && !b.needsIntervention) return -1;
      if (!a.needsIntervention && b.needsIntervention) return 1;
      return b.totalIncidents - a.totalIncidents;
    });
  }, [incidents]);

  // Breakdown by Course
  const courseDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((i) => {
      counts[i.studentGroup] = (counts[i.studentGroup] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  // Breakdown by Time Slot
  const timeSlotDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((i) => {
      counts[i.timeSlot] = (counts[i.timeSlot] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  // Breakdown by Category
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  const total = incidents.length;
  const reincidentesCount = studentStats.filter((s) => s.needsIntervention).length;
  const openCount = incidents.filter((i) => i.status === 'Abierta' || i.status === 'En seguimiento').length;
  const familiesNotifiedCount = incidents.filter((i) => i.familyNotified).length;
  const notificationRate = total > 0 ? Math.round((familiesNotifiedCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Directivo Badge */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-md">
              Módulo de Jefatura de Estudios y Dirección
            </span>
            <span className="text-xs text-slate-300">
              Sesión activa: {currentUser.name}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Supervisión y Análisis de Convivencia Escolar
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Detección temprana de reincidencia, seguimiento de protocolos y métricas globales del centro.
          </p>
        </div>

        <button
          id="btn-export-directivo-report"
          onClick={() => exportIncidentsToExcel(incidents, `informe_convivencia_${new Date().toISOString().slice(0, 10)}.xlsx`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Informe General en Excel</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Total Incidencias</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              <School className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{total}</p>
          <p className="text-[11px] text-slate-700 mt-1">
            Registradas en el sistema escolar
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900">Alumnos en Alerta</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{reincidentesCount}</p>
          <p className="text-[11px] text-slate-700 mt-1">
            Reincidentes o con faltas graves
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Casos Pendientes</span>
            <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">{openCount}</p>
          <p className="text-[11px] text-slate-700 mt-1">
            Abiertas o en mediación activa
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Familias Comunicadas</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{notificationRate}%</p>
          <p className="text-[11px] text-slate-700 mt-1">
            {familiesNotifiedCount} de {total} incidencias comunicadas
          </p>
        </div>
      </div>

      {/* High-Risk / Recurrent Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Alumnos Prioritarios y Alertas de Reincidencia
              </h3>
              <p className="text-xs text-slate-700">
                Alumnos ordenados por número y severidad de conductas contrarias a las normas
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-center">
            {studentStats.length} alumnos registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Alumno / Grupo</th>
                <th className="p-3 text-center">Faltas Leves</th>
                <th className="p-3 text-center">Faltas Graves</th>
                <th className="p-3 text-center">Muy Graves</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3">Última Incidencia</th>
                <th className="p-3">Estado de Alerta</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentStats.map((s) => (
                <tr
                  key={s.studentName}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    s.needsIntervention ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <td className="p-3">
                    <button
                      onClick={() => onOpenStudentProfile(s.studentName)}
                      className="font-bold text-slate-900 hover:text-blue-700 hover:underline cursor-pointer block text-left"
                    >
                      {s.studentName}
                    </button>
                    <span className="text-[11px] font-medium text-slate-700">
                      {s.studentGroup}
                    </span>
                  </td>

                  <td className="p-3 text-center font-semibold text-amber-800">
                    {s.leves}
                  </td>
                  <td className="p-3 text-center font-bold text-orange-800">
                    {s.graves}
                  </td>
                  <td className="p-3 text-center font-black text-red-800">
                    {s.muyGraves}
                  </td>
                  <td className="p-3 text-center font-black text-slate-900">
                    {s.totalIncidents}
                  </td>

                  <td className="p-3 text-slate-700 whitespace-nowrap">
                    {s.lastIncidentDate}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {s.needsIntervention ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3" />
                        COMISIÓN / ALERTA
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Ordinario
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onOpenStudentProfile(s.studentName)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Ver Expediente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Grid: Cursos, Franjas Horarias, Tipologías */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Course Ranking */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <School className="w-4 h-4 text-slate-500" />
            Cursos con Mayor Conflictividad
          </h3>
          <div className="space-y-2.5">
            {courseDistribution.map(([course, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={course} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{course}</span>
                    <span className="font-bold text-slate-600">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Slot Ranking */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            Franjas Horarias Críticas
          </h3>
          <div className="space-y-2.5">
            {timeSlotDistribution.map(([slot, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const isRecreo = slot.toLowerCase().includes('recreo');
              return (
                <div key={slot} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">{slot}</span>
                    <span className="font-bold text-slate-600">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isRecreo ? 'bg-amber-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Behavior Types Ranking */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            Tipologías más Frecuentes
          </h3>
          <div className="space-y-2.5">
            {categoryDistribution.slice(0, 5).map(([cat, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">{cat}</span>
                    <span className="font-bold text-slate-600">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
