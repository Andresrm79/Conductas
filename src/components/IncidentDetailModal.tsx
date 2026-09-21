import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  BookOpen,
  User,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  PhoneCall,
  Save,
} from 'lucide-react';
import { Incident, IncidentStatus, UserProfile } from '../types';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdateIncident: (updated: Incident) => void;
  currentUser: UserProfile;
  onOpenStudentProfile: (studentName: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onUpdateIncident,
  currentUser,
  onOpenStudentProfile,
}) => {
  const [status, setStatus] = useState<IncidentStatus>(incident?.status || 'Pendiente');
  const [directivoNotes, setDirectivoNotes] = useState(incident?.directivoNotes || '');
  const [familyNotified, setFamilyNotified] = useState(incident?.familyNotified || false);
  const [immediateMeasure, setImmediateMeasure] = useState(incident?.immediateMeasure || '');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (incident) {
      setStatus(incident.status);
      setDirectivoNotes(incident.directivoNotes || '');
      setFamilyNotified(incident.familyNotified);
      setImmediateMeasure(incident.immediateMeasure);
    }
  }, [incident]);

  if (!incident) return null;

  const handleSave = () => {
    const updated: Incident = {
      ...incident,
      status,
      directivoNotes: directivoNotes.trim() || undefined,
      familyNotified,
      immediateMeasure,
      updatedAt: new Date().toISOString(),
    };
    onUpdateIncident(updated);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="modal-incident-detail"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 print:border-none print:shadow-none print:max-h-none">
        
        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                incident.severity === 'Muy Grave'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : incident.severity === 'Grave'
                  ? 'bg-orange-100 text-orange-800 border border-orange-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              Falta {incident.severity}
            </span>
            <h2 className="text-sm font-bold text-slate-800">
              Parte de Incidencia Nº #{incident.id.slice(-6)}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-incident"
              onClick={handlePrint}
              title="Imprimir documento oficial de convivencia"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir Parte</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Modal Body Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800">
          
          {/* Printable Official Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-700">
                  DOCUMENTO OFICIAL DE COMISIÓN DE CONVIVENCIA
                </p>
                <h1 className="text-lg font-extrabold text-slate-900">
                  COMUNICACIÓN DE CONDUCTA CONTRARIA A LAS NORMAS
                </h1>
              </div>
              <div className="text-right text-xs text-slate-700">
                <p>Fecha registro: {incident.date}</p>
                <p>Hora / Franja: {incident.timeSlot}</p>
              </div>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-700 block">
                Datos del Alumno / Alumna:
              </span>
              <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                {incident.studentName}
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
                  {incident.studentGroup}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenStudentProfile(incident.studentName)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline print:hidden self-start sm:self-center cursor-pointer"
            >
              Ver expediente completo del alumno →
            </button>
          </div>

          {/* Context Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-700 block font-medium">Asignatura:</span>
              <strong className="text-slate-900 block mt-0.5">{incident.subject}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-700 block font-medium">Lugar / Espacio:</span>
              <strong className="text-slate-900 block mt-0.5">{incident.location}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-700 block font-medium">Docente informante:</span>
              <strong className="text-slate-900 block mt-0.5">{incident.teacherName}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-700 block font-medium">Familia informada:</span>
              <strong className="text-slate-900 block mt-0.5">
                {familyNotified ? 'Sí (Notificada)' : 'No registrada'}
              </strong>
            </div>
          </div>

          {/* Incident Type & Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Hechos Ocurridos y Conducta Observada
            </h3>
            <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-900 mb-1">
                Tipificación: {incident.category}
              </p>
              <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>
          </div>

          {/* Immediate Measure */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Medida Correctora / Pedagógica Inmediata
            </h3>
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <input
                type="text"
                value={immediateMeasure}
                onChange={(e) => setImmediateMeasure(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Directivo Notes / Jefatura de Estudios Section */}
          <div className="space-y-2 p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                Seguimiento y Resolución de Jefatura de Estudios / Dirección
              </h3>
              {currentUser.role === 'Directivo' && (
                <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded">
                  Modo Editor Directivo
                </span>
              )}
            </div>

            <textarea
              rows={2}
              value={directivoNotes}
              onChange={(e) => setDirectivoNotes(e.target.value)}
              placeholder="Anotaciones de directivos, citación de familias, apertura de expediente o compromisos de convivencia..."
              className="w-full text-xs font-normal p-2.5 rounded-lg border border-purple-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Estado:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Abierta">Abierta (En curso)</option>
                  <option value="En seguimiento">En seguimiento / Mediación</option>
                  <option value="Medida cumplida">Medida cumplida</option>
                  <option value="Cerrada">Cerrada / Resuelta</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={familyNotified}
                  onChange={(e) => setFamilyNotified(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300"
                />
                <span>Familia notificada</span>
              </label>
            </div>
          </div>

          {/* Printable Signature Lines */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-12 text-center text-xs text-slate-700 border-t border-slate-300 mt-10">
            <div>
              <div className="h-16 border-b border-slate-400 mb-2"></div>
              <p className="font-bold">Firma del Profesor/a Informante</p>
              <p className="text-[10px] text-slate-700">{incident.teacherName}</p>
            </div>
            <div>
              <div className="h-16 border-b border-slate-400 mb-2"></div>
              <p className="font-bold">Jefatura de Estudios / Dirección</p>
              <p className="text-[10px] text-slate-700">Visto Bueno y Registro</p>
            </div>
            <div>
              <div className="h-16 border-b border-slate-400 mb-2"></div>
              <p className="font-bold">Enterado Padre / Madre / Tutor Legal</p>
              <p className="text-[10px] text-slate-700">Firma y Fecha de Notificación</p>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar sin guardar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
