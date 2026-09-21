import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Calendar,
  Clock,
  BookOpen,
  User,
  ShieldAlert,
  ArrowUpDown,
  CheckCircle2,
  ExternalLink,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import { Incident, SeverityLevel, IncidentStatus, UserProfile } from '../types';
import { COMMON_COURSES } from '../data/mockData';

interface IncidentListProps {
  incidents: Incident[];
  currentUser: UserProfile;
  onSelectIncident: (incident: Incident) => void;
  onOpenStudentProfile: (studentName: string) => void;
  onQuickStatusChange: (incidentId: string, newStatus: IncidentStatus) => void;
  onOpenNewIncident: () => void;
  onOpenExcelImport: () => void;
  activeClassName?: string | null;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  currentUser,
  onSelectIncident,
  onOpenStudentProfile,
  onQuickStatusChange,
  onOpenNewIncident,
  onOpenExcelImport,
  activeClassName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(() => {
    if (activeClassName && activeClassName !== 'ALL' && activeClassName !== 'Vista Global') {
      return activeClassName;
    }
    return 'ALL';
  });

  // Keep selectedCourse in sync if active class changes
  React.useEffect(() => {
    if (activeClassName && activeClassName !== 'ALL' && activeClassName !== 'Vista Global') {
      setSelectedCourse(activeClassName);
    }
  }, [activeClassName]);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [onlyMine, setOnlyMine] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<'date' | 'student' | 'severity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = inc.studentName.toLowerCase().includes(query);
        const matchesDesc = inc.description.toLowerCase().includes(query);
        const matchesTeacher = inc.teacherName.toLowerCase().includes(query);
        const matchesSub = inc.subject.toLowerCase().includes(query);
        const matchesCat = inc.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesTeacher && !matchesSub && !matchesCat) {
          return false;
        }
      }

      // Course
      if (selectedCourse !== 'ALL' && inc.studentGroup !== selectedCourse) {
        return false;
      }

      // Severity
      if (selectedSeverity !== 'ALL' && inc.severity !== selectedSeverity) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) {
        return false;
      }

      // Only mine
      if (onlyMine && inc.teacherName.toLowerCase() !== currentUser.name.toLowerCase()) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'date') {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return sortOrder === 'desc' ? diff : -diff;
      }
      if (sortField === 'student') {
        const diff = a.studentName.localeCompare(b.studentName);
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortField === 'severity') {
        const rank = { 'Muy Grave': 3, 'Grave': 2, 'Leve': 1 };
        const diff = (rank[b.severity] || 0) - (rank[a.severity] || 0);
        return sortOrder === 'desc' ? diff : -diff;
      }
      return 0;
    });
  }, [incidents, searchTerm, selectedCourse, selectedSeverity, selectedStatus, onlyMine, currentUser, sortField, sortOrder]);

  const toggleSort = (field: 'date' | 'student' | 'severity') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-incidents"
              placeholder="Buscar por alumno, profesor, materia o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          {/* View mode & Scope toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Scope: Mis incidencias vs Todo */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                id="btn-filter-all-scope"
                onClick={() => setOnlyMine(false)}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
                  !onlyMine ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todo el Centro
              </button>
              <button
                id="btn-filter-mine-scope"
                onClick={() => setOnlyMine(true)}
                className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
                  onlyMine ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mis Registros
              </button>
            </div>

            {/* View switcher: Table vs Cards */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                title="Vista tabla formato Excel"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                id="btn-view-cards"
                onClick={() => setViewMode('cards')}
                title="Vista en tarjetas detalladas"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-700 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>

          {/* Course filter */}
          <select
            id="select-filter-course"
            aria-label="Filtrar por curso"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Todos los Cursos</option>
            {COMMON_COURSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Severity filter */}
          <select
            id="select-filter-severity"
            aria-label="Filtrar por gravedad"
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Todas las Gravedades</option>
            <option value="Leve">Falta Leve</option>
            <option value="Grave">Falta Grave</option>
            <option value="Muy Grave">Falta Muy Grave</option>
          </select>

          {/* Status filter */}
          <select
            id="select-filter-status"
            aria-label="Filtrar por estado"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Abierta">Abierta</option>
            <option value="En seguimiento">En seguimiento</option>
            <option value="Medida cumplida">Medida cumplida</option>
            <option value="Cerrada">Cerrada</option>
          </select>

          {/* Results count indicator */}
          <span className="ml-auto text-[11px] font-medium text-slate-700">
            Mostrando <strong>{filteredIncidents.length}</strong> de {incidents.length} registros
          </span>
        </div>
      </div>

      {/* Empty State */}
      {filteredIncidents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              No se encontraron incidencias
            </h3>
            <p className="text-xs text-slate-700 mt-1 max-w-md mx-auto">
              Prueba a cambiar los filtros de búsqueda o registra una nueva incidencia directamente.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenNewIncident}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              + Registrar Nueva Incidencia
            </button>
            <button
              onClick={onOpenExcelImport}
              className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Importar desde Excel
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: EXCEL TABLE GRID */}
      {viewMode === 'table' && filteredIncidents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => toggleSort('date')}
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Fecha / Hora</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('student')}
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Alumno / Curso</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3">Materia / Profesor</th>
                  <th className="p-3">Conducta / Hecho</th>
                  <th
                    onClick={() => toggleSort('severity')}
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Gravedad</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3">Medida Aplicada</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Date / Time */}
                    <td
                      onClick={() => onSelectIncident(inc)}
                      className="p-3 text-slate-700 whitespace-nowrap cursor-pointer"
                    >
                      <span className="font-semibold text-slate-900 block">{inc.date}</span>
                      <span className="text-[11px] text-slate-700">{inc.timeSlot.split(' ')[0]}</span>
                    </td>

                    {/* Student & Group */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenStudentProfile(inc.studentName)}
                          title="Ver ficha del alumno"
                          className="font-bold text-slate-900 hover:text-blue-700 hover:underline cursor-pointer text-left"
                        >
                          {inc.studentName}
                        </button>
                      </div>
                      <span className="inline-block text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                        {inc.studentGroup}
                      </span>
                    </td>

                    {/* Subject & Teacher */}
                    <td
                      onClick={() => onSelectIncident(inc)}
                      className="p-3 cursor-pointer"
                    >
                      <span className="font-medium text-slate-800 block truncate max-w-[140px]">
                        {inc.subject}
                      </span>
                      <span className="text-[11px] text-slate-700 truncate max-w-[140px] block">
                        {inc.teacherName}
                      </span>
                    </td>

                    {/* Disruption Category & snippet */}
                    <td
                      onClick={() => onSelectIncident(inc)}
                      className="p-3 cursor-pointer max-w-[240px]"
                    >
                      <p className="font-semibold text-slate-800 truncate">{inc.category}</p>
                      <p className="text-[11px] text-slate-700 truncate">{inc.description}</p>
                    </td>

                    {/* Severity Badge */}
                    <td
                      onClick={() => onSelectIncident(inc)}
                      className="p-3 cursor-pointer whitespace-nowrap"
                    >
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          inc.severity === 'Muy Grave'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : inc.severity === 'Grave'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>

                    {/* Immediate Measure */}
                    <td
                      onClick={() => onSelectIncident(inc)}
                      className="p-3 cursor-pointer max-w-[180px]"
                    >
                      <span className="text-[11px] text-slate-700 line-clamp-2">
                        {inc.immediateMeasure}
                      </span>
                    </td>

                    {/* Fast Status Switcher */}
                    <td className="p-3 whitespace-nowrap">
                      <select
                        aria-label={`Cambiar estado de incidencia de ${inc.studentName}`}
                        value={inc.status}
                        onChange={(e) =>
                          onQuickStatusChange(inc.id, e.target.value as IncidentStatus)
                        }
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-hidden ${
                          inc.status === 'Medida cumplida'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : inc.status === 'Cerrada'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : inc.status === 'En seguimiento'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Abierta">Abierta</option>
                        <option value="En seguimiento">En seguimiento</option>
                        <option value="Medida cumplida">Medida cumplida</option>
                        <option value="Cerrada">Cerrada</option>
                      </select>
                    </td>

                    {/* Action Button */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectIncident(inc)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Ver Parte
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS */}
      {viewMode === 'cards' && filteredIncidents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <button
                      onClick={() => onOpenStudentProfile(inc.studentName)}
                      className="text-sm font-bold text-slate-900 hover:text-blue-700 text-left hover:underline cursor-pointer"
                    >
                      {inc.studentName}
                    </button>
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded ml-2">
                      {inc.studentGroup}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      inc.severity === 'Muy Grave'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : inc.severity === 'Grave'
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <div className="text-[11px] text-slate-700 flex flex-wrap items-center gap-2 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {inc.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {inc.subject}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 mb-1">
                  {inc.category}
                </p>
                <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {inc.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-700">
                  <span className="font-medium text-slate-700">Prof:</span> {inc.teacherName}
                </div>

                <button
                  onClick={() => onSelectIncident(inc)}
                  className="px-3 py-1 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Abrir Ficha →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
