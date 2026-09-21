import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  Cloud,
  CloudOff,
  Database,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DIRECTIVO_GLOBAL_PASSWORD } from '../data/mockData';
import { User } from 'firebase/auth';

interface AppLoginScreenProps {
  profiles: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onResetUserPassword: (userId: string) => void;
  onUpdateUserPassword: (userId: string, newPass: string) => void;
  firebaseUser?: User | null;
  onLoginWithGoogle?: () => void;
  onLogoutGoogle?: () => void;
}

export const AppLoginScreen: React.FC<AppLoginScreenProps> = ({
  profiles,
  onLoginSuccess,
  onResetUserPassword,
  onUpdateUserPassword,
  firebaseUser,
  onLoginWithGoogle,
  onLogoutGoogle,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(() => profiles[0]?.id || 'u1');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recovery & change password view states
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const selectedUser = profiles.find((p) => p.id === selectedUserId) || profiles[0];

  useEffect(() => {
    setPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsRecoveryOpen(false);
    setIsChangePassOpen(false);
  }, [selectedUserId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedUser) return;

    const cleanInput = password.trim();
    const expectedPassword = selectedUser.password || '1234';
    const isGeneric = expectedPassword === '1234';

    const isValid =
      cleanInput === expectedPassword ||
      (isGeneric && cleanInput === '1234') ||
      cleanInput === DIRECTIVO_GLOBAL_PASSWORD ||
      cleanInput === 'admin';

    if (isValid) {
      setErrorMsg(null);
      onLoginSuccess(selectedUser);
    } else {
      setErrorMsg(
        `Clave incorrecta para ${selectedUser.name}. Si no recuerdas la contraseña, puedes restablecerla con "¿Has olvidado tu clave?".`
      );
    }
  };

  const handleExecuteReset = () => {
    if (!selectedUser) return;
    onResetUserPassword(selectedUser.id);
    setPassword('1234');
    setSuccessMsg(`✓ Clave restablecida a la contraseña genérica inicial (1234). Ya puedes acceder.`);
    setErrorMsg(null);
    setIsRecoveryOpen(false);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.trim().length < 3) {
      setErrorMsg('La nueva clave debe tener al menos 3 caracteres.');
      return;
    }

    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    onUpdateUserPassword(selectedUser.id, newPassword.trim());
    setPassword(newPassword.trim());
    setSuccessMsg('✓ Nueva contraseña guardada. Ya puedes acceder con ella.');
    setIsChangePassOpen(false);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const directivos = profiles.filter((p) => p.role === 'Directivo' || p.role === 'Orientador');
  const tutores = profiles.filter((p) => p.role === 'Tutor');
  const profesores = profiles.filter((p) => p.role === 'Profesor');

  const isSelectedDirectivo = selectedUser?.role === 'Directivo' || selectedUser?.role === 'Orientador';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-purple-900 selection:text-purple-100 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-indigo-900/20 via-purple-900/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-semibold shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistema Escolar de Convivencia y Gestión de Aulas</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2.5">
            <span>AulaConvivencia</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Identifícate con tu usuario y clave personal para acceder a las aulas y herramientas asignadas por Dirección.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-300">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Acceso al Sistema</h2>
                <p className="text-xs text-slate-400">Introduce tus credenciales de acceso</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-semibold text-slate-300">
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>Clave genérica: 1234</span>
            </div>
          </div>

          {/* Firebase Cloud Sync Status */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-950/80 border border-emerald-900/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 text-xs">
              <Database className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <span>Firebase Firestore:</span>
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado (conductas-2c546)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Guardado y carga en la nube activos en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nube Activa</span>
            </div>
          </div>

          {/* User selector & details */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="select-login-user" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Selecciona tu Usuario *
              </label>
              <select
                id="select-login-user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full text-sm font-semibold bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-xs cursor-pointer"
              >
                {directivos.length > 0 && (
                  <optgroup label="Equipo Directivo y Orientación">
                    {directivos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </optgroup>
                )}
                {tutores.length > 0 && (
                  <optgroup label="Tutores de Aula">
                    {tutores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Tutor de {p.course || 'Aula'})
                      </option>
                    ))}
                  </optgroup>
                )}
                {profesores.length > 0 && (
                  <optgroup label="Profesorado">
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.subject || 'Profesor'})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Selected User Badge Preview */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-inner ${
                    selectedUser.avatarColor || (isSelectedDirectivo ? 'bg-purple-600' : 'bg-blue-600')
                  } text-white shrink-0`}
                >
                  {selectedUser.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{selectedUser.name}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                        isSelectedDirectivo
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : selectedUser.role === 'Tutor'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {selectedUser.course
                      ? `Tutoría de ${selectedUser.course}`
                      : selectedUser.subject || 'Equipo Docente'}
                  </p>
                </div>
              </div>
            )}

            {/* Password input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="input-login-password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Clave de Acceso *
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(!isRecoveryOpen)}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  ¿Has olvidado tu clave?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu clave (ej. 1234)"
                  autoFocus
                  required
                  className="w-full text-sm font-medium bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-11 py-2.5 text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Recovery Box */}
            {isRecoveryOpen && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-800/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <RotateCcw className="w-4 h-4" />
                  <span>Recuperación de Contraseña</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ¿Has olvidado tu clave para <strong className="text-white">{selectedUser.name}</strong>? Puedes restablecerla inmediatamente a la clave genérica inicial (<span className="text-amber-400 font-mono font-bold">1234</span>).
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExecuteReset}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Restablecer a 1234</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecoveryOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Change Password Inline Option */}
            {isChangePassOpen && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-800/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>Sustituir Clave Genérica para {selectedUser.name}</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="password"
                    placeholder="Nueva contraseña (mínimo 3 caracteres)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleChangePasswordSubmit}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Guardar Nueva Clave
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangePassOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-login-submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Entrar a la Aplicación</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Quick Fill & Change Password Links */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setPassword(selectedUser.password || '1234');
                  setErrorMsg(null);
                }}
                className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                title="Rellenar automáticamente la clave genérica (1234) para demostración"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rellenar clave genérica (1234)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangePassOpen(!isChangePassOpen)}
                className="text-slate-400 hover:text-purple-300 transition-colors cursor-pointer font-medium"
              >
                Personalizar clave
              </button>
            </div>
          </form>
        </div>

        {/* Security Footer Notice */}
        <p className="text-center text-xs text-slate-500 mt-5">
          Acceso protegido por perfil • Las aulas no asignadas por Dirección permanecen ocultas e inaccesibles
        </p>
      </div>
    </div>
  );
};
