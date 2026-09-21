import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  User,
  Clock,
  Calendar,
  BookOpen,
  ShieldAlert,
  MessageSquare,
  Building,
  Check,
  BellRing,
} from 'lucide-react';
import { Incident, UserProfile } from '../types';

interface TutorParteAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  partes: Incident[];
  onConfirmRead: (incidentId: string, notes?: string) => void;
  onConfirmAllRead?: () => void;
}

export const TutorParteAlertModal: React.FC<TutorParteAlertModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  partes,
  onConfirmRead,
  onConfirmAllRead,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [confirmedChecks, setConfirmedChecks] = useState<Record<string, boolean>>({});
  const [tutorNotes, setTutorNotes] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  if (partes.length === 0) {
    return (
      <div
        id="modal-tutor-parte-alert-empty"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Sin Partes Disciplinarios</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enhorabuena, {currentUser.name}. Ningún alumno de tu aula o tutoría tiene partes graves o muy graves registrados actualmente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const unreadPartes = partes.filter((p) => !p.tutorReadConfirmation?.confirmed);
  const readPartes = partes.filter((p) => p.tutorReadConfirmation?.confirmed);

  // Active incident to view in detail (default to first unread, or first overall)
  const activeIncident =
    partes.find((p) => p.id === selectedIncidentId) ||
    unreadPartes[0] ||
    partes[0];

  const handleToggleCheck = (id: string) => {
    setConfirmedChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmSingle = (incidentId: string) => {
    const notes = tutorNotes[incidentId] || '';
    onConfirmRead(incidentId, notes);
  };

  return (
    <div
      id="modal-tutor-parte-alert"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-amber-700 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Aviso de Tutoría: Partes Disciplinarios
                </h2>
                {unreadPartes.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black animate-bounce">
                    {unreadPartes.length} {unreadPartes.length === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-xs font-bold border border-emerald-300/40">
                    Todos revisados
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Tutor/a: <strong className="text-white">{currentUser.name}</strong> • Grupo:{' '}
                <strong className="text-amber-200">{currentUser.course || 'Aula asignada'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar aviso"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notice */}
        <div className="bg-rose-50 border-b border-rose-100 px-4 py-2.5 flex items-center justify-between text-xs text-rose-900 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              La normativa del centro estipula que el tutor debe <strong>confirmar la recepción y lectura</strong> de
              los partes disciplinarios de sus alumnos.
            </span>
          </div>
          {unreadPartes.length > 1 && onConfirmAllRead && (
            <button
              type="button"
              onClick={onConfirmAllRead}
              className="px-2.5 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              Confirmar todos ({unreadPartes.length})
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Selector if multiple partes */}
          {partes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {partes.map((p) => {
                const isConfirmed = !!p.tutorReadConfirmation?.confirmed;
                const isSelected = p.id === activeIncident.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedIncidentId(p.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : isConfirmed
                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                    }`}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{p.studentName}</span>
                    <span className="text-[10px] opacity-75">({p.date})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Parte Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Header info */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  {activeIncident.studentName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {activeIncident.studentName}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Grupo: <span className="text-purple-700">{activeIncident.studentGroup}</span> • Fecha:{' '}
                    {activeIncident.date} ({activeIncident.timeSlot})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
                    activeIncident.severity === 'Muy Grave'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  Parte {activeIncident.severity}
                </span>
                {typeof activeIncident.points === 'number' && (
                  <span className="px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-black">
                    {activeIncident.points} pts
                  </span>
                )}
              </div>
            </div>

            {/* Incident Details Grid */}
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Profesor/a que emite el parte
                  </span>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {activeIncident.teacherName} ({activeIncident.teacherRole})
                  </p>
                  <p className="text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    Asignatura: {activeIncident.subject}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Ubicación y Estado
                  </span>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {activeIncident.location}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    Estado actual: <strong className="text-purple-700">{activeIncident.status}</strong>
                  </p>
                </div>
              </div>

              {/* Categoría y Hechos */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Conducta sancionada / Infracción
                </span>
                <p className="font-bold text-rose-900 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200 text-xs">
                  {activeIncident.category}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Descripción de los hechos registrados
                </span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {activeIncident.description}
                </p>
              </div>

              {/* Medida correctora aplicada */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Medida correctora / Sanción inmediata
                </span>
                <p className="font-semibold text-amber-950 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
                  {activeIncident.immediateMeasure}
                </p>
              </div>

              {/* Notas de Dirección / Orientación si existen */}
              {activeIncident.directivoNotes && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-700 uppercase block">
                    Instrucciones de Jefatura / Orientación
                  </span>
                  <p className="text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200 leading-relaxed font-medium">
                    {activeIncident.directivoNotes}
                  </p>
                </div>
              )}

              {/* SECCIÓN CONFIRMACIÓN DE LECTURA */}
              <div className="pt-3 border-t border-slate-200">
                {activeIncident.tutorReadConfirmation?.confirmed ? (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-900">
                        Confirmación de Lectura Registrada
                      </h4>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Confirmado por el tutor/a{' '}
                        <strong>{activeIncident.tutorReadConfirmation.tutorName}</strong> el{' '}
                        {new Date(activeIncident.tutorReadConfirmation.confirmedAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        .
                      </p>
                      {activeIncident.tutorReadConfirmation.notes && (
                        <p className="text-[11px] text-emerald-700 italic mt-1 bg-white/60 p-1.5 rounded-lg border border-emerald-200">
                          Nota del tutor: {activeIncident.tutorReadConfirmation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                        Requerimiento de Confirmación de Lectura
                      </h4>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!confirmedChecks[activeIncident.id]}
                        onChange={() => handleToggleCheck(activeIncident.id)}
                        className="mt-0.5 w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs text-slate-800 font-semibold leading-snug">
                        He leído los hechos y la medida disciplinaria impuesta al alumno de mi tutoría. Confirmo la
                        recepción formal de este parte disciplinario.
                      </span>
                    </label>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Observaciones / Actuaciones del Tutor/a (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Cita presencial convocada con los padres para este viernes..."
                        value={tutorNotes[activeIncident.id] || ''}
                        onChange={(e) =>
                          setTutorNotes((prev) => ({ ...prev, [activeIncident.id]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        id={`btn-confirm-read-parte-${activeIncident.id}`}
                        disabled={!confirmedChecks[activeIncident.id]}
                        onClick={() => handleConfirmSingle(activeIncident.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                          confirmedChecks[activeIncident.id]
                            ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar Lectura del Parte</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Total partes en la tutoría: <strong>{partes.length}</strong> (
            <span className="text-rose-700 font-bold">{unreadPartes.length} sin confirmar</span>)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 cursor-pointer shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
