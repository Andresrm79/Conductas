import React from 'react';
import {
  X,
  User,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Incident, LateArrival } from '../types';

interface StudentProfileModalProps {
  studentName: string | null;
  incidents: Incident[];
  lateArrivals?: LateArrival[];
  lateWarningThreshold?: number;
  onClose: () => void;
  onSelectIncident: (inc: Incident) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentName,
  incidents,
  lateArrivals = [],
  lateWarningThreshold = 3,
  onClose,
  onSelectIncident,
}) => {
  if (!studentName) return null;

  const studentIncidents = incidents.filter(
    (i) => i.studentName.toLowerCase().trim() === studentName.toLowerCase().trim()
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const studentLates = lateArrivals.filter(
    (la) => la.studentName.toLowerCase().trim() === studentName.toLowerCase().trim()
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = studentIncidents.length;
  const leves = studentIncidents.filter((i) => i.severity === 'Leve').length;
  const graves = studentIncidents.filter((i) => i.severity === 'Grave').length;
  const muyGraves = studentIncidents.filter((i) => i.severity === 'Muy Grave').length;
  const lateCount = studentLates.length;
  const hasLateWarning = lateCount >= lateWarningThreshold;

  const studentGroup =
    studentIncidents[0]?.studentGroup || studentLates[0]?.studentGroup || 'Sin grupo asignado';
  const subjectsInvolved = Array.from(new Set(studentIncidents.map((i) => i.subject)));
  const teachersInvolved = Array.from(new Set(studentIncidents.map((i) => i.teacherName)));

  const isReincidente = total >= 3 || graves >= 2 || muyGraves > 0;

  return (
    <div
      id="modal-student-profile"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{studentName}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                  {studentGroup}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Expediente y registro acumulado de convivencia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Top Status & Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-700 block uppercase">Total Faltas</span>
              <p className="text-xl font-black text-slate-900 mt-1">{total}</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[11px] font-bold text-amber-900 block uppercase">Leves</span>
              <p className="text-xl font-black text-amber-700 mt-1">{leves}</p>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-[11px] font-bold text-orange-900 block uppercase">Graves</span>
              <p className="text-xl font-black text-orange-700 mt-1">{graves}</p>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="text-[11px] font-bold text-red-900 block uppercase">Muy Graves</span>
              <p className="text-xl font-black text-red-700 mt-1">{muyGraves}</p>
            </div>

            <div className={`p-3 rounded-xl border ${hasLateWarning ? 'bg-amber-100 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-bold block uppercase ${hasLateWarning ? 'text-amber-900' : 'text-slate-700'}`}>
                Retrasos
              </span>
              <p className={`text-xl font-black mt-1 ${hasLateWarning ? 'text-amber-900' : 'text-slate-800'}`}>
                {lateCount}
              </p>
              {hasLateWarning && (
                <span className="text-[9px] font-black uppercase text-rose-700 block">
                  Límite ({lateWarningThreshold}) Superado
                </span>
              )}
            </div>
          </div>

          {/* Late Arrival Warning Banner */}
          {hasLateWarning && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <p className="font-bold">⚠️ Aviso de Puntualidad y Retrasos Reiterados</p>
                <p className="text-amber-900 mt-0.5">
                  El alumno acumula <strong>{lateCount} retrasos</strong> (umbral fijado en {lateWarningThreshold}). Conforme al RRI, corresponde citación a la familia y apercibimiento formal de asistencia.
                </p>
              </div>
            </div>
          )}

          {/* Intervention Advice Banner */}
          {isReincidente && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <p className="font-bold">Protocolo de Alerta de Convivencia Activo</p>
                <p className="text-amber-800 mt-0.5">
                  El alumno acumula conductas reiteradas que requieren intervención conjunta de Tutoría, Jefatura de Estudios y Departamento de Orientación. Se recomienda formalizar un compromiso pedagógico de conducta y citación presencial a la familia.
                </p>
              </div>
            </div>
          )}

          {/* Context Overview */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-bold text-slate-800">Materias involucradas:</span>
              {subjectsInvolved.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700">
                  {s}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-bold text-slate-800">Profesores que han registrado:</span>
              {teachersInvolved.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-700">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Incident Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Historial Cronológico de Incidencias ({studentIncidents.length})
            </h3>

            {studentIncidents.length === 0 ? (
              <p className="text-xs text-slate-700 italic">No hay incidencias registradas para este alumno.</p>
            ) : (
              <div className="space-y-3">
                {studentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-white transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inc.severity === 'Muy Grave'
                              ? 'bg-red-100 text-red-800'
                              : inc.severity === 'Grave'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inc.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{inc.category}</span>
                        <span className="text-xs text-slate-700">({inc.subject})</span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-1">{inc.description}</p>
                      <div className="text-[11px] text-slate-700 flex items-center gap-2">
                        <span>{inc.date}</span>
                        <span>•</span>
                        <span>{inc.timeSlot}</span>
                        <span>•</span>
                        <span>Prof: {inc.teacherName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {inc.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Late Arrivals Sub-section */}
          {studentLates.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Historial de Retrasos y Hora de Llegada ({studentLates.length})
                  </h3>
                </div>
                {hasLateWarning && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                    Límite Superado ({studentLates.length}/{lateWarningThreshold})
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {studentLates.map((la) => (
                  <div
                    key={la.id}
                    className="p-3 rounded-xl border border-slate-200 bg-amber-50/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                          {la.arrivalTime}
                        </span>
                        <span className="text-slate-600 font-medium">({la.date})</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            la.justified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {la.justified ? 'Justificado' : 'Injustificado'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Motivo: <strong>{la.reason || 'Sin justificar'}</strong> • Retraso: +{la.minutesLate} min
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {la.recordedBy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-2xl text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
