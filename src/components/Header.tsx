import React from 'react';
import {
  ShieldAlert,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Users,
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Building2,
  DoorOpen,
  ArrowLeft,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_PROFILES } from '../data/mockData';

interface HeaderProps {
  currentUser: UserProfile;
  profiles?: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenNewIncident: () => void;
  onOpenExcelImport: () => void;
  onExportExcel: () => void;
  onResetData: () => void;
  totalIncidentsCount: number;
  openIncidentsCount: number;
  activeClassName: string | null;
  onChangeClass: () => void;
  onOpenDirectivoAccess: () => void;
  unreadPartesCount?: number;
  onOpenTutorPartes?: () => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  profiles = INITIAL_PROFILES,
  onSelectUser,
  onOpenNewIncident,
  onOpenExcelImport,
  onExportExcel,
  onResetData,
  totalIncidentsCount,
  openIncidentsCount,
  activeClassName,
  onChangeClass,
  onOpenDirectivoAccess,
  unreadPartesCount,
  onOpenTutorPartes,
  onOpenChangePassword,
  onLogout,
}) => {
  const availableProfiles = profiles && profiles.length > 0 ? profiles : INITIAL_PROFILES;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner with Center Identity & User Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  AulaConvivencia
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Centro Educativo
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Control de conductas disruptivas e incidencias de aula
              </p>
            </div>
          </div>

          {/* Active Class Pill & Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Active Class Badge with Exit/Change button */}
            {activeClassName && (
              <div className="flex items-center gap-2 bg-indigo-50/90 border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                <span className="text-slate-600 font-medium">Aula:</span>
                <span className="font-extrabold text-indigo-950 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                  {activeClassName}
                </span>
                <button
                  id="btn-header-change-class"
                  onClick={onChangeClass}
                  title="Volver a la pantalla inicial de selección de clases"
                  className="flex items-center gap-1 ml-1 text-[11px] font-bold text-indigo-900 hover:text-indigo-950 bg-indigo-200/70 hover:bg-indigo-300/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  <DoorOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Cambiar de clase</span>
                </button>
              </div>
            )}

            {/* En la misma línea: Usuario e Importar Excel */}
            <div className="flex items-center gap-2 flex-nowrap">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                <div className="pl-2 pr-1 text-xs text-slate-700 flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-semibold">Usuario:</span>
                </div>
                <select
                  id="select-active-user"
                  aria-label="Seleccionar usuario activo"
                  value={currentUser.id}
                  onChange={(e) => {
                    const found = availableProfiles.find((p) => p.id === e.target.value);
                    if (found) onSelectUser(found);
                  }}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 shadow-2xs cursor-pointer"
                >
                  {availableProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.role} {profile.subject ? `- ${profile.subject}` : ''})
                    </option>
                  ))}
                </select>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    currentUser.role === 'Directivo'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : currentUser.role === 'Orientador'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : currentUser.role === 'Tutor'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {currentUser.role}
                </span>

                {/* Botón para cambiar propia contraseña */}
                {onOpenChangePassword && (
                  <button
                    type="button"
                    id="btn-header-change-password"
                    onClick={onOpenChangePassword}
                    className={`ml-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                      (currentUser.password || '1234') === '1234'
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 ring-2 ring-amber-400/40'
                        : 'text-slate-700 hover:text-purple-700 hover:bg-white'
                    }`}
                    title={
                      (currentUser.password || '1234') === '1234'
                        ? 'Estás usando la clave genérica (1234). Haz clic para cambiarla por tu clave personal.'
                        : 'Cambiar mi contraseña de acceso'
                    }
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Cambiar Clave</span>
                    {(currentUser.password || '1234') === '1234' && (
                      <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-1 py-0.2 rounded">
                        1234
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Botón Aviso de Partes de Tutoría */}
              {currentUser.role === 'Tutor' && onOpenTutorPartes && (
                <button
                  type="button"
                  id="btn-header-tutor-partes"
                  onClick={onOpenTutorPartes}
                  title="Avisos y confirmaciones de partes de alumnos en tu tutoría"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer whitespace-nowrap ${
                    unreadPartesCount && unreadPartesCount > 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300 animate-pulse'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                >
                  <ShieldAlert className={`w-4 h-4 ${unreadPartesCount && unreadPartesCount > 0 ? 'text-amber-200' : 'text-amber-700'}`} />
                  <span>Avisos de Partes</span>
                  {typeof unreadPartesCount === 'number' && unreadPartesCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black">
                      {unreadPartesCount}
                    </span>
                  )}
                </button>
              )}

              {/* Botón Importar Excel en la misma línea que Usuario */}
              <button
                id="btn-import-excel-header"
                onClick={onOpenExcelImport}
                title="Importar hoja Excel o CSV"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-xl transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Importar Excel</span>
              </button>

              {/* Botón Cerrar Sesión */}
              {onLogout && (
                <button
                  id="btn-header-logout"
                  onClick={onLogout}
                  title="Cerrar sesión y volver a la pantalla de acceso"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Secondary Action Bar: Exclusively Behavior Registry Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 pb-1 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
              <span>Registro de Conductas</span>
            </span>
          </div>

          {/* Reset data helper */}
          <div className="flex items-center gap-2">
            <button
              id="btn-reset-demo-data"
              onClick={onResetData}
              title="Restaurar datos de prueba iniciales"
              className="flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Restablecer datos demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
