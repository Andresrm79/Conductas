import React, { useState, useMemo } from 'react';
import {
  Search,
  User,
  GraduationCap,
  AlertTriangle,
  FileText,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Incident, StudentStats } from '../types';
import { COMMON_COURSES } from '../data/mockData';

interface StudentListTabProps {
  incidents: Incident[];
  onOpenStudentProfile: (studentName: string) => void;
  onOpenNewIncidentForStudent: (studentName: string, studentGroup: string) => void;
  activeClassName?: string | null;
}

export const StudentListTab: React.FC<StudentListTabProps> = ({
  incidents,
  onOpenStudentProfile,
  onOpenNewIncidentForStudent,
  activeClassName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(() => {
    if (activeClassName && activeClassName !== 'ALL' && activeClassName !== 'Vista Global') {
      return activeClassName;
    }
    return 'ALL';
  });

  React.useEffect(() => {
    if (activeClassName && activeClassName !== 'ALL' && activeClassName !== 'Vista Global') {
      setSelectedCourse(activeClassName);
    }
  }, [activeClassName]);

  const students = useMemo(() => {
    const map = new Map<string, StudentStats>();

    incidents.forEach((inc) => {
      const name = inc.studentName.trim();
      const existing = map.get(name) || {
        studentName: name,
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

      existing.needsIntervention =
        existing.muyGraves > 0 || existing.graves >= 2 || existing.totalIncidents >= 3;

      map.set(name, existing);
    });

    return Array.from(map.values())
      .filter((s) => {
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          if (!s.studentName.toLowerCase().includes(q) && !s.studentGroup.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (selectedCourse !== 'ALL' && s.studentGroup !== selectedCourse) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [incidents, searchTerm, selectedCourse]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-students"
            placeholder="Buscar por nombre de alumno o curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="select-student-tab-course"
            aria-label="Filtrar alumnos por curso"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Todos los Cursos</option>
            {COMMON_COURSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <div
            key={student.studentName}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {student.studentName}
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded mt-0.5 inline-block">
                      {student.studentGroup}
                    </span>
                  </div>
                </div>

                {student.needsIntervention ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 shrink-0">
                    Alerta
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    {student.totalIncidents} parte(s)
                  </span>
                )}
              </div>

              {/* Incidents tally */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                <div className="p-1.5 bg-amber-50 rounded-lg">
                  <span className="text-[10px] text-amber-800 block font-semibold">Leves</span>
                  <span className="text-xs font-bold text-amber-700">{student.leves}</span>
                </div>
                <div className="p-1.5 bg-orange-50 rounded-lg">
                  <span className="text-[10px] text-orange-800 block font-semibold">Graves</span>
                  <span className="text-xs font-bold text-orange-700">{student.graves}</span>
                </div>
                <div className="p-1.5 bg-red-50 rounded-lg">
                  <span className="text-[10px] text-red-800 block font-semibold">Muy Graves</span>
                  <span className="text-xs font-bold text-red-700">{student.muyGraves}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenStudentProfile(student.studentName)}
                className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 py-1.5 cursor-pointer"
              >
                <span>Ver Historial Completo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onOpenNewIncidentForStudent(student.studentName, student.studentGroup)}
                title="Registrar incidencia para este alumno"
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-slate-800" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
