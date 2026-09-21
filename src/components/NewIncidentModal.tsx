import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Award,
  CheckCircle2,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { Incident, SeverityLevel, UserProfile, PositiveBehavior, BehaviorType, SchoolClass } from '../types';
import {
  COMMON_COURSES,
  COMMON_LOCATIONS,
  COMMON_MEASURES,
  COMMON_SUBJECTS,
  COMMON_TIME_SLOTS,
} from '../data/mockData';
import { getClassConductConfig, getStoredBehaviorTypes, isUserAuthorizedForClass } from '../utils/storage';

export type ConductClassification = 'Disruptiva' | 'Positiva';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSavePositive?: (positive: Omit<PositiveBehavior, 'id'>) => void;
  currentUser: UserProfile;
  existingStudents: string[];
  defaultGroup?: string;
  initialStudentName?: string;
  behaviorTypes?: BehaviorType[];
  classes?: SchoolClass[];
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSavePositive,
  currentUser,
  existingStudents,
  defaultGroup,
  initialStudentName,
  behaviorTypes: propBehaviorTypes,
  classes,
}) => {
  const isDirectivo = currentUser.role === 'Directivo' || currentUser.role === 'Orientador';

  // Solo mostrar las aulas asignadas por Dirección para profesores y tutores
  const allowedCourses = useMemo(() => {
    if (classes && classes.length > 0) {
      if (isDirectivo) {
        return classes.filter((c) => !c.isHidden).map((c) => c.name);
      }
      const filtered = classes
        .filter((c) => !c.isHidden && isUserAuthorizedForClass(currentUser, c.name))
        .map((c) => c.name);
      return filtered.length > 0 ? filtered : [currentUser.course || '1º ESO A'];
    }
    if (isDirectivo) return COMMON_COURSES;
    const filtered = COMMON_COURSES.filter((course) => isUserAuthorizedForClass(currentUser, course));
    return filtered.length > 0 ? filtered : (currentUser.allowedClasses?.length ? currentUser.allowedClasses : [currentUser.course || '1º ESO A']);
  }, [classes, currentUser, isDirectivo]);

  const [classification, setClassification] = useState<ConductClassification>('Disruptiva');
  const [studentName, setStudentName] = useState(() => initialStudentName || '');
  const [studentGroup, setStudentGroup] = useState(() => {
    if (defaultGroup && defaultGroup !== 'ALL' && defaultGroup !== 'Vista Global') {
      return defaultGroup;
    }
    return allowedCourses[0] || '1º ESO A';
  });
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Behaviors configured by the tutor for this class
  const [configuredBehaviors, setConfiguredBehaviors] = useState<BehaviorType[]>(() => {
    const config = getClassConductConfig(defaultGroup || allowedCourses[0] || '1º ESO A');
    const list = config.behaviorTypes?.length ? config.behaviorTypes : (propBehaviorTypes || getStoredBehaviorTypes());
    return list.filter((b) => b.active !== false);
  });

  const [selectedBehaviorId, setSelectedBehaviorId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [severity, setSeverity] = useState<SeverityLevel>('Leve');
  const [points, setPoints] = useState<number>(-5);

  const [timeSlot, setTimeSlot] = useState(COMMON_TIME_SLOTS[1]);
  const [subject, setSubject] = useState(currentUser.subject || COMMON_SUBJECTS[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(COMMON_LOCATIONS[0]);
  const [immediateMeasure, setImmediateMeasure] = useState(COMMON_MEASURES[0]);
  const [directivoNotes, setDirectivoNotes] = useState('');

  // Keep studentGroup and studentName in sync when opening modal
  useEffect(() => {
    if (isOpen) {
      if (defaultGroup && defaultGroup !== 'ALL' && defaultGroup !== 'Vista Global') {
        setStudentGroup(defaultGroup);
      } else if (allowedCourses.length > 0 && !allowedCourses.includes(studentGroup)) {
        setStudentGroup(allowedCourses[0]);
      }
      if (initialStudentName) {
        setStudentName(initialStudentName);
      }
    }
  }, [isOpen, defaultGroup, initialStudentName, allowedCourses]);

  // Synchronize configured behaviors whenever modal opens, studentGroup changes, or classification changes
  useEffect(() => {
    if (!isOpen) return;

    const config = getClassConductConfig(studentGroup);
    const list = config.behaviorTypes?.length
      ? config.behaviorTypes
      : (propBehaviorTypes && propBehaviorTypes.length > 0 ? propBehaviorTypes : getStoredBehaviorTypes());
    const active = list.filter((b) => b.active !== false);
    setConfiguredBehaviors(active);

    const targetType = classification === 'Disruptiva' ? 'disruptiva' : 'positiva';
    const matching = active.filter((b) => b.type === targetType);

    if (matching.length > 0) {
      // Keep selected if still valid in current list, otherwise default to first
      const existing = matching.find((b) => b.id === selectedBehaviorId);
      const chosen = existing || matching[0];
      setSelectedBehaviorId(chosen.id);
      setCategory(chosen.name);
      setPoints(chosen.points);

      if (chosen.points <= -25) setSeverity('Muy Grave');
      else if (chosen.points <= -15) setSeverity('Grave');
      else setSeverity('Leve');
    }
  }, [isOpen, studentGroup, classification, propBehaviorTypes]);

  // Switch classification between Disruptiva and Positiva
  const handleClassificationChange = (newClass: ConductClassification) => {
    setClassification(newClass);
    const targetType = newClass === 'Disruptiva' ? 'disruptiva' : 'positiva';
    const matching = configuredBehaviors.filter((b) => b.type === targetType);

    if (matching.length > 0) {
      const first = matching[0];
      setSelectedBehaviorId(first.id);
      setCategory(first.name);
      setPoints(first.points);

      if (first.points <= -25) setSeverity('Muy Grave');
      else if (first.points <= -15) setSeverity('Grave');
      else setSeverity('Leve');
    }
  };

  // Change selected conduct from dropdown
  const handleBehaviorSelect = (behaviorId: string) => {
    const found = configuredBehaviors.find((b) => b.id === behaviorId);
    if (found) {
      setSelectedBehaviorId(found.id);
      setCategory(found.name);
      setPoints(found.points);

      if (found.points <= -25) setSeverity('Muy Grave');
      else if (found.points <= -15) setSeverity('Grave');
      else setSeverity('Leve');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !description.trim()) {
      alert('Por favor, indica al menos el nombre del alumno y una breve descripción de los hechos.');
      return;
    }

    if (classification === 'Positiva') {
      const posPoints = Math.abs(points) > 0 ? Math.abs(points) : 1;
      if (onSavePositive) {
        onSavePositive({
          studentName: studentName.trim(),
          studentGroup,
          date,
          category,
          description: description.trim(),
          teacherName: currentUser.name,
          points: posPoints,
          behaviorTypeId: selectedBehaviorId,
        });
      } else {
        onSubmit({
          studentName: studentName.trim(),
          studentGroup,
          date,
          timeSlot,
          subject,
          teacherName: currentUser.name,
          teacherRole: currentUser.role,
          category,
          severity: 'Leve',
          points: posPoints,
          behaviorTypeId: selectedBehaviorId,
          description: description.trim(),
          location,
          immediateMeasure: 'Reconocimiento positivo registrado',
          status: 'Cerrada',
          familyNotified: false,
          directivoNotes: directivoNotes.trim() ? directivoNotes.trim() : undefined,
        });
      }
    } else {
      // Conducta Disruptiva
      const finalPoints = points < 0 ? points : -Math.abs(points);
      onSubmit({
        studentName: studentName.trim(),
        studentGroup,
        date,
        timeSlot,
        subject,
        teacherName: currentUser.name,
        teacherRole: currentUser.role,
        category,
        severity,
        points: finalPoints,
        behaviorTypeId: selectedBehaviorId,
        description: description.trim(),
        location,
        immediateMeasure,
        status: 'Abierta',
        familyNotified: false,
        directivoNotes: directivoNotes.trim() ? directivoNotes.trim() : undefined,
      });
    }

    // Reset & close
    setStudentName('');
    setDescription('');
    onClose();
  };

  const isDisruptive = classification === 'Disruptiva';
  const activeBehaviors = configuredBehaviors.filter((b) =>
    isDisruptive ? b.type === 'disruptiva' : b.type === 'positiva'
  );

  return (
    <div
      id="modal-new-incident"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs transition-colors ${
                isDisruptive
                  ? 'bg-rose-100 border-rose-300 text-rose-700'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
            >
              {isDisruptive ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Award className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registrar Nueva Conducta
              </h2>
              <p className="text-xs text-slate-700">
                Registrado por: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role})
              </p>
            </div>
          </div>
          <button
            id="btn-close-new-incident"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Row 1: Alumno y Curso */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nombre y Apellidos del Alumno *
              </label>
              <input
                id="input-student-name"
                type="text"
                list="students-datalist"
                required
                placeholder="Ej. Mateo Gómez Vidal"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full text-sm font-medium px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
              <datalist id="students-datalist">
                {existingStudents.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Curso / Grupo *
              </label>
              <select
                id="select-student-group"
                value={studentGroup}
                onChange={(e) => setStudentGroup(e.target.value)}
                className="w-full text-sm font-medium px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white cursor-pointer"
              >
                {allowedCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {!isDirectivo && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  Aulas asignadas por Dirección ({allowedCourses.length})
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Fecha, Hora, Materia, Espacio */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fecha
              </label>
              <input
                id="input-incident-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Franja / Hora
              </label>
              <select
                id="select-incident-timeslot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {COMMON_TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Materia / Asignatura
              </label>
              <select
                id="select-incident-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {COMMON_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lugar / Espacio
              </label>
              <select
                id="select-incident-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {COMMON_LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Calificación de la conducta: 2 opciones (Disruptiva o Positiva) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Calificación de la conducta *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-conduct-disruptiva"
                onClick={() => handleClassificationChange('Disruptiva')}
                className={`py-3 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                  isDisruptive
                    ? 'bg-rose-50/90 border-rose-600 text-rose-950 ring-2 ring-rose-200 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isDisruptive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <span>Disruptiva</span>
                    {isDisruptive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-200 text-rose-800 rounded">
                        Seleccionada
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-tight">
                    Falta o incidencia en el aula
                  </p>
                </div>
              </button>

              <button
                type="button"
                id="btn-conduct-positiva"
                onClick={() => handleClassificationChange('Positiva')}
                className={`py-3 px-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                  !isDisruptive
                    ? 'bg-emerald-50/90 border-emerald-600 text-emerald-950 ring-2 ring-emerald-200 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    !isDisruptive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <span>Positiva</span>
                    {!isDisruptive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-200 text-emerald-800 rounded">
                        Seleccionada
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-tight">
                    Compañerismo, esfuerzo o participación
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Row 4: Tipo de conducta (despliega las conductas configuradas por el tutor con sus puntos en la misma línea) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de conducta *
            </label>
            <select
              id="select-incident-category"
              value={selectedBehaviorId}
              onChange={(e) => handleBehaviorSelect(e.target.value)}
              className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white cursor-pointer"
            >
              {activeBehaviors.length > 0 ? (
                activeBehaviors.map((b) => {
                  const ptsString = b.points > 0 ? `(+${b.points} pts)` : `(${b.points} pts)`;
                  return (
                    <option key={b.id} value={b.id}>
                      {b.name} {ptsString}
                    </option>
                  );
                })
              ) : (
                <option value="">No hay conductas configuradas para esta categoría</option>
              )}
            </select>
          </div>

          {/* Row 5: Descripción detallada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descripción Objetiva de los Hechos *
            </label>
            <textarea
              id="textarea-incident-description"
              rows={3}
              required
              placeholder={
                isDisruptive
                  ? 'Describa con precisión lo ocurrido, palabras textuales si hubo insultos, comportamiento observable y contexto...'
                  : 'Describa la acción meritoria, ayuda a compañeros o actitud positiva demostrada...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm font-normal px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Row 6: Medida Inmediata Aplicada (para conductas disruptivas) */}
          {isDisruptive && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Medida Inmediata / Correctora Aplicada
                </label>
                <span className="text-[11px] text-slate-600">Según Decreto de Convivencia</span>
              </div>
              <select
                id="select-incident-measure"
                value={immediateMeasure}
                onChange={(e) => setImmediateMeasure(e.target.value)}
                className="w-full text-sm font-medium px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white cursor-pointer"
              >
                {COMMON_MEASURES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Directivo notes if applicable */}
          {(currentUser.role === 'Directivo' || currentUser.role === 'Orientador') && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                Observaciones de Jefatura de Estudios / Orientación (Opcional)
              </label>
              <input
                type="text"
                value={directivoNotes}
                onChange={(e) => setDirectivoNotes(e.target.value)}
                placeholder="Ej. Se coordina entrevista con familia o derivación a mediación escolar..."
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-purple-300 bg-white"
              />
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer ${
              isDisruptive
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${isDisruptive ? 'text-amber-400' : 'text-emerald-300'}`}
            />
            <span>
              {isDisruptive ? 'Guardar Conducta Disruptiva' : 'Guardar Conducta Positiva'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
