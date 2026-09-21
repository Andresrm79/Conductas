import React from 'react';
import {
  ShieldAlert,
  Building2,
  BarChart3,
  Clock,
  FileSpreadsheet,
  DoorOpen,
  Users,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';
import { INITIAL_PROFILES } from '../data/mockData';

export type DirectivoNavigationTab =
  | 'seguimiento_aula'
  | 'estadisticas'
  | 'retrasos'
  | 'usuarios_accesos';

interface DirectivoHeaderProps {
  currentUser: UserProfile;
  profiles?: UserProfile[];
  onSelectUser?: (user: UserProfile) => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
  activeNavTab?: DirectivoNavigationTab;
  activeTab?: DirectivoNavigationTab;
  onSelectNavTab?: (tab: DirectivoNavigationTab) => void;
  setActiveTab?: (tab: DirectivoNavigationTab) => void;
  selectedClassFilter?: string; // "ALL" or specific class name like "2º ESO B"
  onSelectClassFilter?: (className: string) => void;
  classesList?: string[]; // List of class names
  lateWarningCount?: number; // Number of students exceeding late threshold
  onOpenNewIncident?: () => void;
  onOpenNewLateArrival?: () => void;
  onOpenLateConfig?: () => void;
  onExportExcel: () => void;
  onExitDirectivo: () => void;
  totalDisruptivas?: number;
  totalIncidentsCount?: number;
  totalPositivas?: number;
}

export const DirectivoHeader: React.FC<DirectivoHeaderProps> = ({
  currentUser,
  profiles = INITIAL_PROFILES,
  onSelectUser,
  onOpenChangePassword,
  onLogout,
  activeNavTab,
  activeTab,
  onSelectNavTab,
  setActiveTab,
  selectedClassFilter = 'ALL',
  onSelectClassFilter,
  classesList = [],
  lateWarningCount = 0,
  onOpenLateConfig,
  onExportExcel,
  onExitDirectivo,
}) => {
  const currentTab = activeNavTab || activeTab || 'seguimiento_aula';
  const handleSelectTab = onSelectNavTab || setActiveTab || (() => {});
  const safeClassesList = classesList || [];
  const handleSelectClassFilter = onSelectClassFilter || (() => {});

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top line: Left-justified Usuario, Modo Docente, Excel on the same line; Right: Aviso de Retrasos */}
        <div className="py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-800">
          
          {/* Left-justified: Usuario + Modo Docente + Excel in the same line */}
          <div className="flex items-center justify-start gap-2 sm:gap-2.5 flex-nowrap overflow-x-auto max-w-full py-0.5">
            {/* Control de Usuario con letra reducida */}
            {onSelectUser ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 sm:p-1.5 rounded-xl border border-slate-700 shadow-2xs shrink-0">
                <div className="pl-1 pr-0.5 text-slate-300 flex items-center gap-1 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-bold tracking-tight">Usuario:</span>
                </div>
                <select
                  id="select-directivo-user"
                  aria-label="Seleccionar usuario activo"
                  value={currentUser.id}
                  onChange={(e) => {
                    const found = profiles.find((p) => p.id === e.target.value);
                    if (found) onSelectUser(found);
                  }}
                  className="text-xs sm:text-sm font-semibold bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.role})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-200 border border-purple-700 uppercase tracking-wide shrink-0">
                  {currentUser.role}
                </span>

                {/* Botón para cambiar propia contraseña */}
                {onOpenChangePassword && (
                  <button
                    type="button"
                    id="btn-directivo-header-change-password"
                    onClick={onOpenChangePassword}
                    className={`ml-0.5 px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                      (currentUser.password || '1234') === '1234'
                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-400/50 animate-pulse'
                        : 'text-amber-300 hover:text-white bg-slate-700/90 hover:bg-slate-700'
                    }`}
                    title={
                      (currentUser.password || '1234') === '1234'
                        ? 'Estás usando la clave genérica (1234). Haz clic para cambiarla por tu clave personal.'
                        : 'Cambiar mi contraseña de acceso'
                    }
                  >
                    <KeyRound className="w-3 h-3" />
                    <span className="hidden md:inline">Cambiar Clave</span>
                    {(currentUser.password || '1234') === '1234' && (
                      <span className="text-[10px] font-black bg-slate-900 text-amber-300 px-1 py-0.2 rounded">
                        1234
                      </span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs sm:text-sm shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-slate-100">{currentUser.name}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-700">
                  Dirección
                </span>
                {onOpenChangePassword && (
                  <button
                    type="button"
                    onClick={onOpenChangePassword}
                    className="ml-1 px-2 py-0.5 text-xs font-semibold text-amber-300 hover:text-white bg-slate-700 rounded-md cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    <span>Cambiar Clave</span>
                  </button>
                )}
              </div>
            )}

            {/* Modo Docente a continuación en la misma línea */}
            <button
              id="btn-directivo-exit"
              type="button"
              onClick={onExitDirectivo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95 shrink-0"
              title="Volver a la selección de clases o modo docente"
            >
              <DoorOpen className="w-4 h-4 text-slate-300 shrink-0" />
              <span>Modo Docente</span>
            </button>

            {/* Excel a continuación en la misma línea */}
            <button
              id="btn-directivo-export"
              type="button"
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95 shrink-0"
              title="Exportar informe general a Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Excel</span>
            </button>

            {/* Cerrar Sesión */}
            {onLogout && (
              <button
                id="btn-directivo-logout"
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-rose-300 hover:text-white bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-2xs active:scale-95 shrink-0 ml-1"
                title="Cerrar sesión y volver a la pantalla de acceso"
              >
                <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>

          {/* Arriba a la derecha: Aviso de Retraso de alta visibilidad */}
          <div className="flex items-center self-start lg:self-auto shrink-0">
            {lateWarningCount > 0 ? (
              <button
                id="btn-directivo-late-warning-badge"
                type="button"
                onClick={() => handleSelectTab('retrasos')}
                className="flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black px-4 py-2 rounded-2xl shadow-lg border-2 border-amber-500 animate-pulse transition-all cursor-pointer group"
                title="Haga clic para ver los alumnos que superan el límite de retrasos"
              >
                <AlertCircle className="w-5 h-5 text-slate-950 shrink-0 animate-bounce" />
                <div className="text-left leading-tight">
                  <div className="text-[11px] uppercase tracking-wider font-black text-amber-950">
                    AVISO DE RETRASO
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-950">
                    {lateWarningCount} alumno{lateWarningCount > 1 ? 's' : ''} con límite superado →
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Puntualidad al día (0 avisos)</span>
              </div>
            )}
          </div>
        </div>

        {/* Exclusive Navigation Bar for Dirección */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2.5 gap-2.5">
          
          {/* Main 4 Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" aria-label="Navegación de Dirección">
            <button
              id="nav-directivo-seguimiento"
              type="button"
              onClick={() => handleSelectTab('seguimiento_aula')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'seguimiento_aula'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Seguimiento por Aula</span>
            </button>

            <button
              id="nav-directivo-estadisticas"
              type="button"
              onClick={() => handleSelectTab('estadisticas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'estadisticas'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Estadísticas de Conducta</span>
            </button>

            <button
              id="nav-directivo-retrasos"
              type="button"
              onClick={() => handleSelectTab('retrasos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap relative ${
                currentTab === 'retrasos'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Registro de Retrasos</span>
              {lateWarningCount > 0 && (
                <span className="flex items-center justify-center px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black ml-1 animate-pulse">
                  {lateWarningCount}
                </span>
              )}
            </button>

            {/* PESTAÑA: USUARIOS Y PERMISOS DE AULA */}
            <button
              id="nav-directivo-usuarios-accesos"
              type="button"
              onClick={() => handleSelectTab('usuarios_accesos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === 'usuarios_accesos'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Perfiles y Accesos</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-950/80 text-purple-300 rounded border border-purple-700">
                {profiles.length}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
