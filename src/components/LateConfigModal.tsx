import React, { useState } from 'react';
import { Sliders, X, Check, AlertCircle, Clock, ShieldCheck, Bell } from 'lucide-react';
import { LateArrivalConfig } from '../types';

interface LateConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LateArrivalConfig;
  onSaveConfig: (newConfig: LateArrivalConfig) => void;
  totalStudentsWithWarning: number;
}

export const LateConfigModal: React.FC<LateConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  totalStudentsWithWarning,
}) => {
  const [threshold, setThreshold] = useState<number>(config.warningThreshold);
  const [notifyFamily, setNotifyFamily] = useState<boolean>(config.notifyFamilyOnThreshold);
  const [expectedTime, setExpectedTime] = useState<string>(config.defaultExpectedTime || '08:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      warningThreshold: Math.max(1, threshold),
      notifyFamilyOnThreshold: notifyFamily,
      defaultExpectedTime: expectedTime,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configuración de Límite de Retrasos</h3>
              <p className="text-xs text-slate-400">Umbral para disparar avisos automáticos de dirección</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Main Threshold Configuration */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <label htmlFor="input-threshold-number" className="block font-bold text-slate-900">
              Número de retrasos para generar aviso disciplinario:
            </label>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setThreshold((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-black text-slate-700 text-lg flex items-center justify-center cursor-pointer shadow-2xs"
              >
                -
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  id="input-threshold-number"
                  min={1}
                  max={20}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full text-center text-xl font-black text-purple-700 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setThreshold((prev) => prev + 1)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-black text-slate-700 text-lg flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cuando un alumno acumule <strong>{threshold} o más retrasos</strong> durante el curso escolar, se activará automáticamente el aviso visual de alerta en cabecera y en los listados de aula.
            </p>
          </div>

          {/* Expected Start Time */}
          <div className="space-y-1">
            <label htmlFor="input-config-expected-time" className="block font-bold text-slate-700">
              Hora de entrada oficial del centro:
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                id="input-config-expected-time"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50 font-bold text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Se utiliza para computar automáticamente los minutos de retraso de los alumnos.
            </p>
          </div>

          {/* Notify family option */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="check-notify-family-threshold"
              checked={notifyFamily}
              onChange={(e) => setNotifyFamily(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer mt-0.5"
            />
            <label
              htmlFor="check-notify-family-threshold"
              className="font-bold text-slate-800 cursor-pointer select-none"
            >
              Requerir citación y comunicación formal con los tutores legales al alcanzar el límite.
            </label>
          </div>

          {/* Current Impact Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px]">
              Con el límite fijado en <strong>{threshold} retrasos</strong>, hay actualmente alumnos bajo aviso en el sistema.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
