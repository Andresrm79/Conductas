import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSaveNewPassword: (userId: string, newPassword: string) => void;
  onResetPassword?: (userId: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveNewPassword,
  onResetPassword,
}) => {
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setResetSuccessMsg(null);
      setShowCurrentPass(false);
      setShowNewPass(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const isUsingGeneric = (currentUser.password || '1234') === '1234';

  const handleSelfReset = () => {
    if (onResetPassword) {
      onResetPassword(currentUser.id);
      setCurrentPasswordInput('1234');
      setResetSuccessMsg('✓ Clave restablecida a la contraseña genérica 1234. Ya puedes definir tu nueva clave.');
      setErrorMsg(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const actualExpectedPass = currentUser.password || '1234';

    // Verify current password
    if (currentPasswordInput.trim() !== actualExpectedPass) {
      setErrorMsg('La contraseña actual introducida no es correcta.');
      return;
    }

    if (newPassword.trim().length < 3) {
      setErrorMsg('La nueva contraseña debe tener al menos 3 caracteres.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMsg('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    onSaveNewPassword(currentUser.id, newPassword.trim());
    setSuccessMsg('¡Contraseña actualizada correctamente!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold shadow-inner">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Seguridad de la Cuenta
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Cambiar Contraseña de Acceso
              </h3>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Docente: <strong className="text-white">{currentUser.name}</strong></span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {resetSuccessMsg && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5 text-xs text-purple-900 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{resetSuccessMsg}</span>
            </div>
          )}

          {isUsingGeneric && !resetSuccessMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <span className="font-bold text-amber-700">Aviso:</span>
              <p className="text-[11px] leading-relaxed">
                Actualmente tienes asignada la <strong>clave genérica (1234)</strong>. Introduce <strong>1234</strong> como contraseña actual y crea tu clave personal a continuación.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña Actual
                </label>
                {onResetPassword && (
                  <button
                    type="button"
                    onClick={handleSelfReset}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                  >
                    ¿Olvidada? Restablecer a 1234
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  id="input-current-password"
                  placeholder="Introduce tu clave actual..."
                  value={currentPasswordInput}
                  onChange={(e) => {
                    setCurrentPasswordInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showCurrentPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                (Por defecto es <strong>1234</strong> si no la has modificado antes).
              </p>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nueva Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  id="input-new-password"
                  placeholder="Nueva contraseña (mínimo 3 caracteres)..."
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showNewPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  id="input-confirm-password"
                  placeholder="Repite la nueva contraseña..."
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
                  required
                />
              </div>
            </div>

            {/* Info notice about directivo reset */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              💡 <strong>¿Has olvidado tu clave anterior?</strong> Solicita a Jefatura de Estudios / Dirección que la resetee a <strong>1234</strong> desde la pestaña de <em>Usuarios y Permisos</em>.
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-save-new-password"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Guardar Contraseña</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
