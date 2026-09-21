import React, { useState, useMemo } from 'react';
import { Clock, X, Check, AlertTriangle, User, Building2, Calendar, FileText } from 'lucide-react';
import { LateArrival, SchoolClass, ClassStudent, UserProfile } from '../types';
import { isUserAuthorizedForClass } from '../utils/storage';

interface LateArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (arrival: Omit<LateArrival, 'id' | 'createdAt'>) => void;
  classes: SchoolClass[];
  students: ClassStudent[];
  currentUser: UserProfile;
  initialClassName?: string;
  initialStudentName?: string;
}

export const LateArrivalModal: React.FC<LateArrivalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  students,
  currentUser,
  initialClassName,
  initialStudentName,
}) => {
  const isDirectivo = currentUser.role === 'Directivo' || currentUser.role === 'Orientador';

  // Solo mostrar las aulas asignadas por Dirección para tutores y profesores
  const authorizedClasses = useMemo(() => {
    if (isDirectivo) return classes.filter((c) => !c.isHidden);
    const filtered = classes.filter((c) => !c.isHidden && isUserAuthorizedForClass(currentUser, c.name));
    return filtered.length > 0 ? filtered : classes.slice(0, 1);
  }, [classes, currentUser, isDirectivo]);

  const [studentName, setStudentName] = useState(initialStudentName || '');
  const [studentGroup, setStudentGroup] = useState(() => {
    if (initialClassName && initialClassName !== 'ALL' && initialClassName !== 'Vista Global') {
      return initialClassName;
    }
    return authorizedClasses[0]?.name ?? '1º ESO A';
  });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [arrivalTime, setArrivalTime] = useState('08:20');
  const [expectedTime, setExpectedTime] = useState('08:00');
  const [justified, setJustified] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate minutes difference
  const calculateMinutesLate = (arrival: string, expected: string): number => {
    try {
      const [arrH, arrM] = arrival.split(':').map(Number);
      const [expH, expM] = expected.split(':').map(Number);
      const arrTotal = arrH * 60 + arrM;
      const expTotal = expH * 60 + expM;
      const diff = arrTotal - expTotal;
      return diff > 0 ? diff : 0;
    } catch {
      return 15;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Por favor indica el nombre del alumno.');
      return;
    }
    if (!arrivalTime) {
      setError('Debes indicar la hora exacta de llegada.');
      return;
    }

    const minutes = calculateMinutesLate(arrivalTime, expectedTime);

    onSave({
      studentName: studentName.trim(),
      studentGroup,
      date,
      arrivalTime,
      expectedTime,
      minutesLate: minutes,
      justified,
      reason: reason.trim() || (justified ? 'Justificado por familia' : 'Sin justificar'),
      recordedBy: `${currentUser.name} (${currentUser.role})`,
      familyNotified: false,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  // Autocomplete student group if a known student is typed
  const handleStudentNameChange = (val: string) => {
    setStudentName(val);
    setError(null);
    const found = students.find((s) => s.name.toLowerCase() === val.toLowerCase());
    if (found) {
      setStudentGroup(found.className);
    }
  };

  const minutesCalculated = calculateMinutesLate(arrivalTime, expectedTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registro de Retraso de Alumno</h3>
              <p className="text-xs text-slate-400">Indica la hora de llegada y motivo para el cómputo de faltas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student & Class Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="input-late-student-name" className="block font-bold text-slate-700">
                Nombre del Alumno *
              </label>
              <input
                type="text"
                id="input-late-student-name"
                list="students-datalist"
                value={studentName}
                onChange={(e) => handleStudentNameChange(e.target.value)}
                placeholder="Ej. Mateo Gómez Vidal"
                autoFocus
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
              <datalist id="students-datalist">
                {students.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.className}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label htmlFor="select-late-student-group" className="block font-bold text-slate-700">
                Aula / Grupo *
              </label>
              <select
                id="select-late-student-group"
                value={studentGroup}
                onChange={(e) => setStudentGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50 cursor-pointer font-semibold"
              >
                {authorizedClasses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {!isDirectivo && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  Aulas asignadas por Dirección ({authorizedClasses.length})
                </p>
              )}
            </div>
          </div>

          {/* Date, Expected Time & Arrival Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="input-late-date" className="block font-bold text-slate-700">
                Fecha
              </label>
              <input
                type="date"
                id="input-late-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="input-late-arrival-time" className="block font-bold text-slate-700">
                Hora de Llegada *
              </label>
              <input
                type="time"
                id="input-late-arrival-time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-amber-50/40 font-bold text-amber-950"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="input-late-expected-time" className="block font-bold text-slate-700">
                Hora Prevista
              </label>
              <input
                type="time"
                id="input-late-expected-time"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50 text-slate-600"
              />
            </div>
          </div>

          {/* Computed minutes badge */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between text-amber-900">
            <span className="font-semibold">Tiempo lectivo perdido:</span>
            <span className="font-black text-sm bg-amber-200/80 px-2 py-0.5 rounded-md text-amber-950">
              +{minutesCalculated} minutos de retraso
            </span>
          </div>

          {/* Justification Checkbox & Reason */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="check-late-justified"
                checked={justified}
                onChange={(e) => setJustified(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label
                htmlFor="check-late-justified"
                className="font-bold text-slate-800 cursor-pointer select-none"
              >
                Retraso Justificado (justificante médico, familiar acreditado o transporte escolar)
              </label>
            </div>

            <div className="space-y-1">
              <label htmlFor="input-late-reason" className="block font-bold text-slate-700">
                Motivo / Justificación
              </label>
              <input
                type="text"
                id="input-late-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Cita médica, avería de autobús, se durmió..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="input-late-notes" className="block font-bold text-slate-700">
                Observaciones adicionales (opcional)
              </label>
              <textarea
                id="input-late-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotaciones de conserjería, guardia o jefatura..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50 resize-none"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Guardar Registro de Retraso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
