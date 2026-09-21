import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, X, CheckCircle2, UserCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { DIRECTIVO_GLOBAL_PASSWORD, INITIAL_PROFILES } from '../data/mockData';

interface DirectivoAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (directivoUser: UserProfile) => void;
}

export const DirectivoAuthModal: React.FC<DirectivoAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const directivoProfile =
    INITIAL_PROFILES.find((p) => p.role === 'Directivo') || INITIAL_PROFILES[3];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DIRECTIVO_GLOBAL_PASSWORD || password === '1234') {
      setError(null);
      setPassword('');
      onAuthenticated(directivoProfile);
    } else {
      setError('Contraseña incorrecta. (Clave por defecto de dirección: 1234)');
    }
  };

  const handleDirectAccess = () => {
    setError(null);
    setPassword('');
    onAuthenticated(directivoProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-400/30">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-500/25 text-purple-300 px-2.5 py-0.5 rounded-md border border-purple-400/30">
            Acceso Restringido a Dirección
          </span>

          <h3 className="text-xl font-bold tracking-tight text-white mt-1">
            Panel de Convivencia y Retrasos
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Esta sección contiene el seguimiento de conductas por aula, estadísticas disciplinarias y control de retrasos.
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="input-directivo-password"
              className="block text-xs font-bold text-slate-700"
            >
              Introduce la clave de acceso de Dirección:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                id="input-directivo-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Clave (por defecto: 1234)"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                {directivoProfile.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-800">{directivoProfile.name}</p>
                <p className="text-[11px] text-slate-500">Jefatura de Estudios / Dirección</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDirectAccess}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors cursor-pointer"
            >
              Acceso Rápido
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Desbloquear Dirección</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
