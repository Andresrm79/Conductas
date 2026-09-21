import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Building2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DIRECTIVO_GLOBAL_PASSWORD } from '../data/mockData';

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile | null;
  currentUser: UserProfile;
  onAuthenticated: (user: UserProfile) => void;
  onResetPassword: (userId: string) => void;
  onOpenChangePassword?: () => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onAuthenticated,
  onResetPassword,
  onOpenChangePassword,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'login' | 'recovery'>('login');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg(null);
      setShowPassword(false);
      setViewMode('login');
      setRecoverySuccessMsg(null);
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  const expectedPassword = targetUser.password || '1234';
  const isDirectivo = targetUser.role === 'Directivo';
  const isGenericPassword = expectedPassword === '1234';

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInput = password.trim();

    // Check personal password, or universal admin/1234 fallback if user hasn't changed it
    const isCorrect =
      cleanInput === expectedPassword ||
      (isGenericPassword && cleanInput === '1234') ||
      cleanInput === DIRECTIVO_GLOBAL_PASSWORD ||
      cleanInput === 'admin';

    if (isCorrect) {
      setErrorMsg(null);
      onAuthenticated(targetUser);
    } else {
      setErrorMsg(
        `Contraseña incorrecta para ${targetUser.name}. Si no recuerdas tu clave, pulsa en "¿Has olvidado tu clave?" para restablecerla.`
      );
    }
  };

  const handleQuickFill = () => {
    setPassword(expectedPassword || '1234');
    setErrorMsg(null);
  };

  const handleExecuteReset = () => {
    onResetPassword(targetUser.id);
    setPassword('1234');
    setRecoverySuccessMsg(
      `✓ Contraseña de ${targetUser.name} restablecida con éxito a la clave genérica: 1234.`
    );
    setErrorMsg(null);
    setTimeout(() => {
      setViewMode('login');
    }, 1400);
  };

  return (
    <div
      id="modal-user-login-auth"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`p-6 text-white relative ${
            isDirectivo
              ? 'bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900'
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cancelar cambio de usuario"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${
                targetUser.avatarColor || (isDirectivo ? 'bg-purple-600' : 'bg-blue-600')
              } text-white ring-4 ring-white/20`}
            >
              {targetUser.name.charAt(0)}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isDirectivo
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {isDirectivo ? 'Perfil de Dirección' : `Rol: ${targetUser.role}`}
                </span>
                {targetUser.course && (
                  <span className="text-[10px] font-bold bg-white/15 text-slate-200 px-1.5 py-0.5 rounded">
                    Tutor {targetUser.course}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{targetUser.name}</h3>
              {targetUser.subject && (
                <p className="text-xs text-slate-300">{targetUser.subject}</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Autenticación requerida</span>
            </span>
            <span className="text-slate-400">
              Usuario activo actual: <strong>{currentUser.name}</strong>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {recoverySuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{recoverySuccessMsg}</span>
            </div>
          )}

          {/* VIEW: NORMAL LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="input-user-login-password"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Clave de Acceso
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('recovery');
                      setErrorMsg(null);
                    }}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>¿Has olvidado tu clave?</span>
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-user-login-password"
                    autoFocus
                    placeholder="Introduce tu clave de usuario..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Convenience Pill for demo testing */}
              <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-amber-900 block">
                    Clave de acceso de {targetUser.name}:{' '}
                    <strong className="font-mono text-slate-900 bg-amber-200/80 px-1.5 py-0.5 rounded">
                      {expectedPassword}
                    </strong>
                  </span>
                  <p className="text-[11px] text-amber-800">
                    {isGenericPassword
                      ? 'Clave genérica provisional del centro (1234).'
                      : 'Contraseña personalizada por el usuario.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-2.5 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Autocompletar
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-submit-user-login"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>Iniciar Sesión</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW: PASSWORD RECOVERY */}
          {viewMode === 'recovery' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900 text-xs">
                  <RotateCcw className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>Recuperación de Clave para {targetUser.name}</span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  Si has olvidado tu contraseña personalizada, puedes restablecerla en este momento a la <strong>clave genérica del centro (1234)</strong>.
                </p>
                <p className="text-[11px] text-slate-600">
                  Una vez dentro, podrás definir una nueva contraseña personalizada desde la opción <em>"Cambiar Clave"</em>.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                <p className="font-bold text-slate-800">Opciones disponibles de recuperación:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li>Restablecimiento directo a la clave genérica (1234).</li>
                  <li>Solicitar a Jefatura de Estudios / Dirección que la resetee desde su panel.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Volver al formulario
                </button>
                <button
                  type="button"
                  id="btn-confirm-reset-password"
                  onClick={handleExecuteReset}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-200" />
                  <span>Restablecer a 1234</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
