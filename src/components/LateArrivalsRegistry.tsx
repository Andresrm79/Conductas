import React, { useState, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  Sliders,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Bell,
  Trash2,
  Building2,
  User,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { LateArrival, LateArrivalConfig, SchoolClass, ClassStudent, UserProfile } from '../types';
import * as XLSX from 'xlsx';

interface LateArrivalsRegistryProps {
  lateArrivals?: LateArrival[];
  config: LateArrivalConfig;
  classes?: SchoolClass[];
  students?: ClassStudent[];
  currentUser: UserProfile;
  selectedClassFilter?: string;
  onSelectClassFilter?: (className: string) => void;
  onOpenNewLateArrival?: () => void;
  onAddLateArrival?: () => void;
  onOpenConfigModal?: () => void;
  onOpenConfig?: () => void;
  onUpdateLateArrival?: (updated: LateArrival) => void;
  onEditLateArrival?: (updated: LateArrival) => void;
  onDeleteLateArrival: (id: string) => void;
  onOpenStudentProfile: (studentName: string) => void;
}

interface StudentLateSummary {
  studentName: string;
  studentGroup: string;
  totalCount: number;
  unjustifiedCount: number;
  justifiedCount: number;
  totalMinutes: number;
  hasWarning: boolean;
  latestDate: string;
  latestTime: string;
}

export const LateArrivalsRegistry: React.FC<LateArrivalsRegistryProps> = ({
  lateArrivals = [],
  config,
  classes = [],
  students = [],
  currentUser,
  selectedClassFilter = 'ALL',
  onSelectClassFilter = (_className: string) => {},
  onOpenNewLateArrival,
  onAddLateArrival,
  onOpenConfigModal,
  onOpenConfig,
  onUpdateLateArrival,
  onEditLateArrival,
  onDeleteLateArrival,
  onOpenStudentProfile,
}) => {
  const handleOpenAddLate = onOpenNewLateArrival || onAddLateArrival || (() => {});
  const handleOpenConfig = onOpenConfigModal || onOpenConfig || (() => {});
  const handleUpdateLate = onUpdateLateArrival || onEditLateArrival || (() => {});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'warning_only' | 'unjustified'>('all');

  // Compute total counts per student to identify who has reached or exceeded threshold
  const studentLateStats = useMemo(() => {
    const map = new Map<string, StudentLateSummary>();

    lateArrivals.forEach((la) => {
      const name = la.studentName.trim();
      let cur = map.get(name);
      if (!cur) {
        cur = {
          studentName: name,
          studentGroup: la.studentGroup,
          totalCount: 0,
          unjustifiedCount: 0,
          justifiedCount: 0,
          totalMinutes: 0,
          hasWarning: false,
          latestDate: la.date,
          latestTime: la.arrivalTime,
        };
        map.set(name, cur);
      }

      cur.totalCount += 1;
      if (la.justified) {
        cur.justifiedCount += 1;
      } else {
        cur.unjustifiedCount += 1;
      }
      cur.totalMinutes += la.minutesLate;

      if (new Date(`${la.date}T${la.arrivalTime}`).getTime() > new Date(`${cur.latestDate}T${cur.latestTime}`).getTime()) {
        cur.latestDate = la.date;
        cur.latestTime = la.arrivalTime;
      }
    });

    map.forEach((val) => {
      val.hasWarning = val.totalCount >= config.warningThreshold;
    });

    return map;
  }, [lateArrivals, config.warningThreshold]);

  // List of students with warning
  const studentsWithWarning = useMemo(() => {
    const list: StudentLateSummary[] = Array.from(studentLateStats.values());
    return list.filter((s) => s.hasWarning);
  }, [studentLateStats]);

  // Filtered late arrivals
  const filteredArrivals = useMemo(() => {
    return lateArrivals.filter((la) => {
      // Class filter
      if (selectedClassFilter !== 'ALL' && la.studentGroup !== selectedClassFilter) {
        return false;
      }

      // Filter mode
      if (filterMode === 'warning_only') {
        const stat = studentLateStats.get(la.studentName.trim());
        if (!stat || !stat.hasWarning) return false;
      } else if (filterMode === 'unjustified') {
        if (la.justified) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          la.studentName.toLowerCase().includes(q) ||
          la.studentGroup.toLowerCase().includes(q) ||
          (la.reason?.toLowerCase().includes(q) ?? false) ||
          la.date.includes(q) ||
          la.arrivalTime.includes(q)
        );
      }

      return true;
    });
  }, [lateArrivals, selectedClassFilter, filterMode, searchTerm, studentLateStats]);

  // Total summary metrics
  const totalLateRecords = lateArrivals.length;
  const totalUnjustified = lateArrivals.filter((la) => !la.justified).length;
  const totalMinutesLost = lateArrivals.reduce((acc, la) => acc + la.minutesLate, 0);

  // Export to Excel
  const handleExportLateExcel = () => {
    const data = filteredArrivals.map((la) => ({
      ID: la.id,
      Alumno: la.studentName,
      Aula: la.studentGroup,
      Fecha: la.date,
      'Hora de Llegada': la.arrivalTime,
      'Hora Prevista': la.expectedTime,
      'Minutos de Retraso': la.minutesLate,
      Justificado: la.justified ? 'SÍ' : 'NO',
      Motivo: la.reason,
      'Registrado Por': la.recordedBy,
      'Familia Notificada': la.familyNotified ? 'SÍ' : 'NO',
      Observaciones: la.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registro_Retrasos');
    XLSX.writeFile(wb, `registro_retrasos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white p-6 rounded-3xl shadow-md border border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-md">
              Control de Puntualidad y Retrasos
            </span>
            <span className="text-xs text-amber-200/80">
              Límite configurado: <strong>{config.warningThreshold} retrasos</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Registro Oficial de Retrasos y Hora de Llegada
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Control horario de accesos con hora exacta de llegada y advertencias automáticas de expediente disciplinario.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenConfig}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Configurar Límite ({config.warningThreshold})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddLate}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Registrar Retraso</span>
          </button>

          <button
            type="button"
            onClick={handleExportLateExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards - Always on the same line */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3.5 lg:gap-4">
        {/* 1. Retrasos Registrados */}
        <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 truncate block">
              Retrasos Registrados
            </span>
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">{totalLateRecords}</p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 truncate block">
              Total incidencias
            </p>
          </div>
        </div>

        {/* 2. Avisos por Límite */}
        <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 truncate block">
              Avisos por Límite
            </span>
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-black text-rose-700 leading-tight">{studentsWithWarning.length}</p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 truncate block">
              ≥ {config.warningThreshold} retrasos
            </p>
          </div>
        </div>

        {/* 3. Injustificados */}
        <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 truncate block">
              Injustificados
            </span>
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-black text-amber-800 leading-tight">{totalUnjustified}</p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 truncate block">
              {totalLateRecords > 0 ? Math.round((totalUnjustified / totalLateRecords) * 100) : 0}% sin justificar
            </p>
          </div>
        </div>

        {/* 4. Minutos Perdidos */}
        <div className="bg-white p-2.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 truncate block">
              Minutos Perdidos
            </span>
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-black text-purple-700 leading-tight">{totalMinutesLost} min</p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 truncate block">
              Docencia afectada
            </p>
          </div>
        </div>
      </div>

      {/* PROMINENT WARNING BANNER (Disparado cuando hay alumnos que superan el límite) */}
      {studentsWithWarning.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-400 rounded-3xl p-5 shadow-xs animate-in zoom-in-98 duration-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-amber-950 uppercase tracking-tight">
                    🚨 AVISO DE PUNTUALIDAD: Límite de {config.warningThreshold} Retrasos Superado
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    {studentsWithWarning.length} ALUMNOS
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1">
                  Los siguientes alumnos han alcanzado o superado el umbral configurado de <strong>{config.warningThreshold} retrasos</strong>. Requiere notificación formal a tutores legales y citación de tutoría.
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {studentsWithWarning.map((s) => (
                    <button
                      key={s.studentName}
                      type="button"
                      onClick={() => onOpenStudentProfile(s.studentName)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-slate-900 hover:text-purple-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{s.studentName} ({s.studentGroup})</span>
                      <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-black text-[10px]">
                        {s.totalCount} retrasos
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFilterMode('warning_only')}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Filtrar Solo Alumnos con Aviso
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por alumno, aula, motivo o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-slate-50/70"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Classroom Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedClassFilter}
              onChange={(e) => onSelectClassFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todas las Aulas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter modes */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('warning_only')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filterMode === 'warning_only'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3 h-3" />
              <span>Con Aviso ({studentsWithWarning.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('unjustified')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterMode === 'unjustified'
                  ? 'bg-white text-amber-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Injustificados
            </button>
          </div>
        </div>
      </div>

      {/* Main Table of Late Arrivals */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Listado de Registros ({filteredArrivals.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {selectedClassFilter !== 'ALL' ? `Filtrando por ${selectedClassFilter}` : 'Mostrando todo el centro'}
          </span>
        </div>

        {filteredArrivals.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800">No hay registros de retraso con los filtros seleccionados</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Pulsa en "+ Registrar Retraso" para añadir una nueva entrada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="p-3">Alumno / Aula</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Hora de Llegada</th>
                  <th className="p-3 text-center">Minutos</th>
                  <th className="p-3">Justificación / Motivo</th>
                  <th className="p-3">Aviso de Límite</th>
                  <th className="p-3">Registrado por</th>
                  <th className="p-3">Familia</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArrivals.map((la) => {
                  const studentStat = studentLateStats.get(la.studentName.trim());
                  const hasWarning = studentStat?.hasWarning ?? false;

                  return (
                    <tr
                      key={la.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasWarning ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Student & Class */}
                      <td className="p-3">
                        <div>
                          <button
                            type="button"
                            onClick={() => onOpenStudentProfile(la.studentName)}
                            className="font-bold text-slate-900 hover:text-purple-700 hover:underline cursor-pointer block text-left"
                          >
                            {la.studentName}
                          </button>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {la.studentGroup}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3 font-mono text-slate-700 whitespace-nowrap">
                        {la.date}
                      </td>

                      {/* Hora de llegada */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-1 rounded-lg border border-amber-200">
                          {la.arrivalTime}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          previsto: {la.expectedTime}
                        </span>
                      </td>

                      {/* Minutos tarde */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          +{la.minutesLate} min
                        </span>
                      </td>

                      {/* Justified / Reason */}
                      <td className="p-3 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateLateArrival({
                                ...la,
                                justified: !la.justified,
                              })
                            }
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer ${
                              la.justified
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                            title="Haz clic para cambiar estado de justificación"
                          >
                            {la.justified ? 'JUSTIFICADO' : 'INJUSTIFICADO'}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 truncate" title={la.reason}>
                          {la.reason || 'Sin especificar'}
                        </p>
                      </td>

                      {/* Warning Status */}
                      <td className="p-3 whitespace-nowrap">
                        {hasWarning ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            AVISO: {studentStat?.totalCount}/{config.warningThreshold}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {studentStat?.totalCount || 1} de {config.warningThreshold}
                          </span>
                        )}
                      </td>

                      {/* Recorded By */}
                      <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {la.recordedBy}
                      </td>

                      {/* Family Notified */}
                      <td className="p-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateLate({
                              ...la,
                              familyNotified: !la.familyNotified,
                            })
                          }
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                            la.familyNotified
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {la.familyNotified ? 'Notificada' : 'Pendiente'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteLateArrival(la.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
