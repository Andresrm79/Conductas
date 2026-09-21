import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  User,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { SchoolClass, UserProfile } from '../types';
import { DIRECTIVO_GLOBAL_PASSWORD } from '../data/mockData';
import { isUserAuthorizedForClass } from '../utils/storage';

interface ClassPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: SchoolClass | 'ALL' | null;
  currentUser?: UserProfile;
  onSuccess: (target: SchoolClass | 'ALL') => void;
  onUpdateClassPassword?: (classId: string, newPass: string) => void;
  onOpenChangePassword?: () => void;
}

export const ClassPasswordModal: React.FC<ClassPasswordModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  currentUser,
  onSuccess,
  onUpdateClassPassword,
  onOpenChangePassword,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg(null);
      setIsChangingPass(false);
      setNewPassword('');
    }
  }, [isOpen, targetClass, currentUser]);

  if (!isOpen || !targetClass) return null;

  const isAll = targetClass === 'ALL';
  const className = isAll ? 'ALL' : targetClass.name;
  const title = isAll ? 'Acceso Global de Dirección / Jefatura' : `Acceso al Aula: ${targetClass.name}`;
  const room = !isAll ? targetClass.room : 'Todas las dependencias del Centro';
  const tutor = !isAll ? targetClass.tutorName : 'Equipo Directivo';

  // Check authorization by Dirección for this user
  const isAuthorized = !currentUser || isAll ? true : isUserAuthorizedForClass(currentUser, className);

  const userExpectedPassword = currentUser?.password || '1234';
  const classExpectedPassword = !isAll ? targetClass.password : DIRECTIVO_GLOBAL_PASSWORD;

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAuthorized) {
      setErrorMsg(
        `Acceso no autorizado: Dirección no ha habilitado a "${currentUser?.name}" para entrar al aula ${className}. Contacta con Jefatura de Estudios.`
      );
      return;
    }

    const cleanInput = password.trim();

    // Check user's personal password, class password, master directivo password, or universal 1234
    const isCorrect =
      cleanInput === userExpectedPassword ||
      cleanInput === classExpectedPassword ||
      cleanInput === DIRECTIVO_GLOBAL_PASSWORD ||
      cleanInput === '1234' ||
      cleanInput === 'admin';

    if (isCorrect) {
      setErrorMsg(null);
      onSuccess(targetClass);
    } else {
      setErrorMsg(
        'Contraseña incorrecta. Introduce tu clave personal de usuario o solicita a Dirección que la restablezca a 1234.'
      );
    }
  };

  const handleQuickFill = () => {
    setPassword(userExpectedPassword || '1234');
    setErrorMsg(null);
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 3) {
      setErrorMsg('La nueva contraseña debe tener al menos 3 caracteres.');
      return;
    }

    if (!isAll && onUpdateClassPassword) {
      onUpdateClassPassword(targetClass.id, newPassword.trim());
      setPassword(newPassword.trim());
      setIsChangingPass(false);
      setErrorMsg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
              isAuthorized ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
            }`}>
              {isAuthorized ? <Lock className="w-6 h-6 text-amber-400" /> : <ShieldAlert className="w-6 h-6 text-rose-400" />}
            </div>
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                isAuthorized ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {isAuthorized ? 'Acceso con Clave Personal' : 'Aula Restringida por Dirección'}
              </span>
              <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
            </div>
          </div>

          {/* Details Pill */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{room}</span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Docente: <strong className="text-white">{currentUser.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {!isAuthorized && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Aula no autorizada por Dirección</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tu perfil de usuario (<strong>{currentUser?.name}</strong>) no tiene autorización para acceder a <strong>{className}</strong>.
              </p>
              <p className="text-[11px] text-slate-600">
                Si requieres impartir clase en este grupo, solicita a Jefatura de Estudios / Dirección que te asigne esta aula en el panel de configuración de perfiles.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isAuthorized && !isChangingPass && (
            <form onSubmit={handleValidate} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Introduce tu clave de acceso
                  </label>
                  {onOpenChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenChangePassword();
                      }}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                    >
                      Cambiar mi clave
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-class-password"
                    autoFocus
                    placeholder="Tu clave personal de acceso..."
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-medium"
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

              {/* Convenience Helper Card */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-amber-900 block">
                    Clave demo / reseteo: <strong className="font-mono text-slate-900">{userExpectedPassword || '1234'}</strong>
                  </span>
                  <p className="text-[11px] text-amber-700">
                    Si la olvidas, Dirección puede restablecerla a 1234.
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-submit-class-password"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span>Acceder al Aula</span>
                </button>
              </div>
            </form>
          )}

          {!isAuthorized && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
