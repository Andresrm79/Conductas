import React from 'react';
import {
  RefreshCw,
  Database,
  Cloud,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface FirebaseSyncBannerProps {
  firebaseUser?: User | null;
  isSyncing: boolean;
  isOnline?: boolean;
  onLoginWithGoogle?: () => void;
  onLogoutGoogle?: () => void;
  onTriggerSync?: () => void;
}

export const FirebaseSyncBanner: React.FC<FirebaseSyncBannerProps> = ({
  isSyncing,
  onTriggerSync,
}) => {
  return (
    <div
      id="firebase-sync-bar"
      className="bg-slate-900 border-b border-slate-800 text-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          
          {/* Status info */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Cloud:</span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Conectado a conductas-2c546
            </span>

            <span className="text-slate-400 hidden sm:inline text-[11px]">
              Base de datos en la nube activa. Todos los datos se leen y guardan en tu proyecto de Firebase.
            </span>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2 shrink-0">
            {isSyncing ? (
              <span className="flex items-center gap-1 text-[11px] text-amber-300 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Sincronizando...</span>
              </span>
            ) : (
              onTriggerSync && (
                <button
                  type="button"
                  id="btn-sync-firebase"
                  onClick={onTriggerSync}
                  title="Verificar y forzar sincronización con Firebase"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>Sincronizar ahora</span>
                </button>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
