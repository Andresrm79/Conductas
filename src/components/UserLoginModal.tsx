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
  ShieldAlert,
} from 'lucide-react';
import { UserProfile } from '../types';

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

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg(null);
      setShowPassword(false);
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  const expectedPassword = (targetUser.password || '1234').trim();
  const isGenericPassword = expectedPassword === '1234';
  const isDirectivo = targetUser.role === 'Directivo' || targetUser.role === 'Orientador';

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInput = password.trim();

    // Strict validation: must match the user's actual password. No bypasses.
    const isCorrect = cleanInput === expectedPassword;

    if (isCorrect) {
      setErrorMsg(null);
      onAuthenticated(targetUser);
    } else {
      if (cleanInput === '1234' && expectedPassword !== '1234') {
        setErrorMsg(
          `La clave genérica 1234 ya no es válida para ${targetUser.name}. Esta cuenta tiene configurada una clave personal; introduce tu nueva clave para acceder.`
        );
      } else {
        setErrorMsg(
          `Contraseña incorrecta para ${targetUser.name}. Introduce la clave correspondiente a tu cuenta.`
        );
      }
    }
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

          {/* LOGIN FORM */}
          <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <label
                  htmlFor="input-user-login-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Clave de Acceso
                </label>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-user-login-password"
                    autoFocus
                    placeholder={
                      isGenericPassword
                        ? 'Introduce la clave genérica (1234)...'
                        : 'Introduce tu clave personal de acceso...'
                    }
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

              {/* Status information */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed space-y-1">
                {isGenericPassword ? (
                  <p>
                    💡 Esta cuenta aún tiene la <strong>clave genérica inicial (1234)</strong>. Tras identificarte, podrás cambiarla por tu clave personal.
                  </p>
                ) : (
                  <p className="text-purple-800">
                    🔒 Esta cuenta tiene una <strong>clave personal activa</strong>. Debes introducir tu clave actual para acceder.
                  </p>
                )}
                <p className="text-[11px] text-slate-500 pt-0.5">
                  ¿Olvidaste tu clave? Contacta con Jefatura de Estudios / Dirección para su restablecimiento.
                </p>
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
        </div>
      </div>
    </div>
  );
};
