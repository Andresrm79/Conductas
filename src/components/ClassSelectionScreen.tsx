import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Users,
  Search,
  Building2,
  AlertTriangle,
  GraduationCap,
  PlusCircle,
  KeyRound,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  Smartphone,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { Incident, SchoolClass, UserProfile } from '../types';
import { INITIAL_PROFILES } from '../data/mockData';
import { isUserAuthorizedForClass } from '../utils/storage';
import { ClassPasswordModal } from './ClassPasswordModal';
import { CreateClassModal } from './CreateClassModal';
import { EditClassModal } from './EditClassModal';

interface ClassSelectionScreenProps {
  classes: SchoolClass[];
  incidents: Incident[];
  currentUser: UserProfile;
  profiles?: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onClassUnlocked: (selectedClass: SchoolClass | 'ALL') => void;
  onAddClass: (newClass: SchoolClass) => void;
  onUpdateClass: (updatedClass: SchoolClass) => void;
  onDeleteClass: (classId: string) => void;
  onUpdateClassPassword: (classId: string, newPass: string) => void;
  onOpenExcelImport: () => void;
  onOpenDirectivoAccess: () => void;
  onOpenChangePassword?: () => void;
  onToggleHideClass?: (classId: string) => void;
  onLogout?: () => void;
}

export const ClassSelectionScreen: React.FC<ClassSelectionScreenProps> = ({
  classes,
  incidents,
  currentUser,
  profiles = INITIAL_PROFILES,
  onSelectUser,
  onClassUnlocked,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onUpdateClassPassword,
  onOpenExcelImport,
  onOpenDirectivoAccess,
  onOpenChangePassword,
  onToggleHideClass,
  onLogout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | '1ESO-2ESO' | '3ESO-4ESO' | 'Bachillerato'>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ACTIVE' | 'HIDDEN' | 'ALL'>('ACTIVE');
  
  // Password modal state
  const [targetClassForPassword, setTargetClassForPassword] = useState<SchoolClass | 'ALL' | null>(null);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);

  const isDirectivo = currentUser.role === 'Directivo' || currentUser.role === 'Orientador';

  // Los tutores y profesores SOLO deben ver en sus perfiles las aulas que se les han asignado por dirección
  const visibleClasses = useMemo(() => {
    if (isDirectivo) return classes;
    return classes.filter((c) => isUserAuthorizedForClass(currentUser, c.name));
  }, [classes, currentUser, isDirectivo]);

  const activeClassesCount = useMemo(() => visibleClasses.filter((c) => !c.isHidden).length, [visibleClasses]);
  const hiddenClassesCount = useMemo(() => visibleClasses.filter((c) => c.isHidden).length, [visibleClasses]);

  // Authorized classes count for current user
  const authorizedClassesCount = useMemo(() => visibleClasses.length, [visibleClasses]);

  const isUsingGeneric = (currentUser.password || '1234') === '1234';

  // Compute incidents per class
  const classStats = useMemo(() => {
    const map = new Map<string, { total: number; leves: number; graves: number; muyGraves: number }>();
    incidents.forEach((inc) => {
      const g = inc.studentGroup.trim();
      const current = map.get(g) || { total: 0, leves: 0, graves: 0, muyGraves: 0 };
      current.total += 1;
      if (inc.severity === 'Leve') current.leves += 1;
      if (inc.severity === 'Grave') current.graves += 1;
      if (inc.severity === 'Muy Grave') current.muyGraves += 1;
      map.set(g, current);
    });
    return map;
  }, [incidents]);

  // Filtered classes - strictly based on user's authorized classes
  const filteredClasses = useMemo(() => {
    return visibleClasses.filter((c) => {
      // Visibility filter: ACTIVE vs HIDDEN vs ALL (applicable for Directivo)
      if (isDirectivo) {
        if (visibilityFilter === 'ACTIVE' && c.isHidden) return false;
        if (visibilityFilter === 'HIDDEN' && !c.isHidden) return false;
      } else {
        // Teachers and tutors only see active assigned classes
        if (c.isHidden) return false;
      }

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesTutor = c.tutorName.toLowerCase().includes(q);
        const matchesRoom = c.room.toLowerCase().includes(q);
        if (!matchesName && !matchesTutor && !matchesRoom) return false;
      }

      // Stage
      if (stageFilter === '1ESO-2ESO') {
        return c.name.startsWith('1º ESO') || c.name.startsWith('2º ESO');
      }
      if (stageFilter === '3ESO-4ESO') {
        return c.name.startsWith('3º ESO') || c.name.startsWith('4º ESO');
      }
      if (stageFilter === 'Bachillerato') {
        return c.stage === 'Bachillerato' || c.name.includes('Bachillerato');
      }

      return true;
    });
  }, [visibleClasses, isDirectivo, searchTerm, stageFilter, visibilityFilter]);

  const totalIncidents = incidents.length;
  const pendingIncidents = incidents.filter(i => i.status === 'Abierta' || i.status === 'En seguimiento').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Brand Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">AulaConvivencia</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Portal de Aulas
                </span>
              </div>
              <p className="text-xs text-slate-600">Registro colaborativo y control disciplinario</p>
            </div>
          </div>

          {/* User selector & excel shortcut */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 pl-1.5 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">Docente:</span>
              </span>
              <select
                id="select-login-user"
                aria-label="Docente activo"
                value={currentUser.id}
                onChange={(e) => {
                  const p = profiles.find((x) => x.id === e.target.value);
                  if (p) onSelectUser(p);
                }}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 shadow-2xs cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>

              {onOpenChangePassword && (
                <button
                  type="button"
                  id="btn-selection-change-password"
                  onClick={onOpenChangePassword}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isUsingGeneric
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 ring-2 ring-amber-400/40'
                      : 'text-slate-700 hover:text-purple-700 hover:bg-white'
                  }`}
                  title={
                    isUsingGeneric
                      ? 'Estás usando la clave genérica (1234). Haz clic para cambiarla por tu clave personal.'
                      : 'Cambiar mi contraseña de acceso'
                  }
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden lg:inline">Cambiar Clave</span>
                  {isUsingGeneric && (
                    <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-1 py-0.2 rounded">
                      1234
                    </span>
                  )}
                </button>
              )}
            </div>

            <button
              onClick={onOpenExcelImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Importar Excel con histórico de conductas"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Importar Excel</span>
            </button>

            {/* Cerrar Sesión */}
            {onLogout && (
              <button
                id="btn-class-selection-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-colors shadow-2xs cursor-pointer"
                title="Cerrar sesión y volver a la pantalla de acceso"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold tracking-wide border border-amber-400/30">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Apps de Aula Estilo Glide • Acceso Seguro</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {isDirectivo ? 'Selecciona el Aula a la que Deseas Acceder' : 'Tus Aulas Asignadas por Dirección'}
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isDirectivo
                ? 'Cada clase cuenta con su propia App de gestión y registro de conductas: Resumen general, Registro de Incidencias, Alumnos y Tendencias. Introduce la contraseña del aula para acceder.'
                : `Hola, ${currentUser.name} (${currentUser.role}). A continuación se muestran exclusivamente las aulas que Dirección ha asignado a tu perfil para el registro y seguimiento de conductas.`}
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/10">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>{visibleClasses.length}</strong> {isDirectivo ? 'Clases Activas en el Centro' : 'Aulas Asignadas a tu Perfil'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-white/10">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span><strong>{pendingIncidents}</strong> Incidencias Activas</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-200 px-3 py-1.5 rounded-xl backdrop-blur-xs border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sesión activa: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
              </div>
            </div>

            {isUsingGeneric && (
              <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-100">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    Estás usando la <strong>clave genérica (1234)</strong>. Te recomendamos sustituirla por una contraseña personal.
                  </span>
                </div>
                {onOpenChangePassword && (
                  <button
                    type="button"
                    onClick={onOpenChangePassword}
                    className="px-3 py-1 bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg hover:bg-amber-300 transition-colors cursor-pointer shrink-0"
                  >
                    Cambiar Clave Ahora
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search, Filter & Add Class Tools */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-classes"
              placeholder="Buscar clase por nombre (ej. 2º ESO), tutor o aula física..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Stage & Visibility filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {isDirectivo ? (
              <>
                {/* Visibility Mode for Directivo */}
                <button
                  type="button"
                  id="filter-classes-active"
                  onClick={() => setVisibilityFilter('ACTIVE')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    visibilityFilter === 'ACTIVE'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Activas ({activeClassesCount})</span>
                </button>

                <button
                  type="button"
                  id="filter-classes-hidden"
                  onClick={() => setVisibilityFilter('HIDDEN')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    visibilityFilter === 'HIDDEN'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Ver aulas ocultas que no se están utilizando"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ocultas ({hiddenClassesCount})</span>
                </button>

                <span className="text-slate-300 mx-1 hidden sm:inline">|</span>
              </>
            ) : (
              <div className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Aulas Asignadas por Dirección ({visibleClasses.length})</span>
              </div>
            )}

            <button
              onClick={() => setStageFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                stageFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStageFilter('1ESO-2ESO')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                stageFilter === '1ESO-2ESO'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              1º y 2º ESO
            </button>
            <button
              onClick={() => setStageFilter('3ESO-4ESO')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                stageFilter === '3ESO-4ESO'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              3º y 4º ESO
            </button>
            <button
              onClick={() => setStageFilter('Bachillerato')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                stageFilter === 'Bachillerato'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bachillerato
            </button>

            {isDirectivo && (
              <button
                onClick={() => setIsCreateClassOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs ml-auto md:ml-2"
                title="Añadir una nueva clase al centro"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>+ Nueva Clase</span>
              </button>
            )}
          </div>
        </div>

        {/* Classes List - Shown one below the other (una debajo de otra) */}
        <div className="flex flex-col gap-3.5">
          {filteredClasses.map((cls) => {
            const stats = classStats.get(cls.name) || { total: 0, leves: 0, graves: 0, muyGraves: 0 };
            const hasIncidents = stats.total > 0;
            const isAuthorized = isUserAuthorizedForClass(currentUser, cls.name);
            const isHidden = Boolean(cls.isHidden);
            const isUserTutorOfThisClass =
              currentUser.role === 'Tutor' &&
              (cls.tutorName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
                currentUser.course === cls.name);

            return (
              <div
                key={cls.id}
                id={`card-class-${cls.id}`}
                className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-2xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 group ${
                  isHidden
                    ? 'border-slate-300 bg-slate-50/70 opacity-90'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                {/* Left section: Identity, Tutor, Stage, and Status Badges */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 flex-wrap">
                  {/* Color accent bar or icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cls.color} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs`}>
                    {cls.name.substring(0, 2)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                        {cls.name}
                      </h3>

                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                        {cls.stage}
                      </span>

                      {/* Tutor badge */}
                      {isUserTutorOfThisClass && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full font-extrabold">
                          <GraduationCap className="w-3 h-3 text-purple-700" />
                          <span>Tu Tutoría</span>
                        </span>
                      )}

                      {/* Visibility badge for Directivo */}
                      {isDirectivo && (
                        isHidden ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300"
                            title="Aula oculta por no estar en uso"
                          >
                            <EyeOff className="w-3 h-3 text-slate-500" />
                            <span>Oculta (Sin uso)</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Activa</span>
                          </span>
                        )
                      )}

                      {/* Authorization status */}
                      {!isDirectivo && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Asignada por Dirección</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tutor/a: <strong className="text-slate-700 font-semibold">{cls.tutorName}</strong></span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cls.room}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center section: Incidents Tally */}
                <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                  {hasIncidents ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium mr-1">Partes:</span>
                      {stats.leves > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                          {stats.leves} leves
                        </span>
                      )}
                      {stats.graves > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                          {stats.graves} graves
                        </span>
                      )}
                      {stats.muyGraves > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                          {stats.muyGraves} muy graves
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Sin incidencias registradas</span>
                    </div>
                  )}
                </div>

                {/* Right section: Management Buttons and Access Trigger */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0 flex-wrap">
                  {/* Directivo administrative controls */}
                  {isDirectivo && (
                    <>
                      {/* Toggle Hide / Show button */}
                      {onToggleHideClass && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleHideClass(cls.id);
                          }}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isHidden
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-300'
                          }`}
                          title={
                            isHidden
                              ? 'Reactivar y mostrar clase en la lista principal'
                              : 'Ocultar clase si no se está utilizando en el centro'
                          }
                        >
                          {isHidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Reactivar Aula</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                              <span>Ocultar Aula</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClass(cls);
                        }}
                        title="Editar datos de la clase"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingClass(cls);
                        }}
                        title="Eliminar clase"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {/* Access Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isAuthorized) {
                        onClassUnlocked(cls);
                      } else {
                        setTargetClassForPassword(cls);
                      }
                    }}
                    className="py-2 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Abrir App de {cls.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredClasses.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            {!isDirectivo && visibleClasses.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Sin aulas asignadas por Dirección
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Actualmente no tienes aulas asignadas a tu perfil de docente/tutoría (<strong>{currentUser.name}</strong>). Por favor, contacta con el equipo directivo para que te asigne tus grupos en la configuración de usuarios.
                </p>
              </>
            ) : (
              <>
                <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  {visibilityFilter === 'HIDDEN' ? 'No hay aulas ocultas' : 'No se encontraron clases'}
                </h3>
                <p className="text-xs text-slate-500">
                  {visibilityFilter === 'HIDDEN'
                    ? 'Todas las aulas del centro están activas y en uso. Puedes ocultar cualquier aula que no se utilice pulsando en "Ocultar Aula".'
                    : `No hay ningún aula que coincida con los filtros seleccionados.`}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStageFilter('ALL');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              </>
            )}
          </div>
        )}

        {/* Guidance Footer */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-bold block">Información sobre la seguridad de las aulas</span>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              La contraseña por defecto para todas las clases y para la vista global es <code className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-slate-900">1234</code>. Si un tutor o equipo directivo desea personalizar la clave de su grupo, puede hacerlo desde la ventana de acceso pulsando en <em>"¿Deseas personalizar la contraseña de esta clase?"</em>.
            </p>
          </div>
        </div>
      </main>

      {/* Password Modal */}
      <ClassPasswordModal
        isOpen={targetClassForPassword !== null}
        onClose={() => setTargetClassForPassword(null)}
        targetClass={targetClassForPassword}
        currentUser={currentUser}
        onOpenChangePassword={onOpenChangePassword}
        onSuccess={(target) => {
          setTargetClassForPassword(null);
          onClassUnlocked(target);
        }}
        onUpdateClassPassword={onUpdateClassPassword}
      />

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateClassOpen}
        onClose={() => setIsCreateClassOpen(false)}
        onAddClass={onAddClass}
      />

      {/* Edit Class Modal */}
      <EditClassModal
        isOpen={editingClass !== null}
        onClose={() => setEditingClass(null)}
        targetClass={editingClass}
        onUpdateClass={onUpdateClass}
      />

      {/* Delete Confirmation Modal */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">¿Eliminar {deletingClass.name}?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Esta acción eliminará el aula del centro. Podrás volver a crearla en cualquier momento si fuera necesario.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClass(deletingClass.id);
                  setDeletingClass(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sí, Eliminar Clase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
