import React, { useState, useEffect } from 'react';
import { X, Building2, User, KeyRound, ShieldAlert, Check, Palette, Eye, EyeOff } from 'lucide-react';
import { SchoolClass } from '../types';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: SchoolClass | null;
  onUpdateClass: (updatedClass: SchoolClass) => void;
}

const CLASS_GRADIENTS = [
  { label: 'Azul Índigo', value: 'from-blue-600 to-indigo-700' },
  { label: 'Azul Cielo', value: 'from-sky-600 to-blue-700' },
  { label: 'Verde Esmeralda', value: 'from-emerald-600 to-teal-700' },
  { label: 'Ámbar Cálido', value: 'from-amber-500 to-orange-600' },
  { label: 'Púrpura Violeta', value: 'from-purple-600 to-indigo-800' },
  { label: 'Rojo Carmesí', value: 'from-rose-600 to-red-700' },
  { label: 'Pizarra Oscura', value: 'from-slate-700 to-slate-900' },
  { label: 'Verde Bosque', value: 'from-teal-600 to-emerald-800' },
];

export const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  onUpdateClass,
}) => {
  const [name, setName] = useState('');
  const [stage, setStage] = useState<'ESO' | 'Bachillerato' | 'FP' | 'Primaria'>('ESO');
  const [cycle, setCycle] = useState<'1º Ciclo ESO' | '2º Ciclo ESO' | 'Bachillerato' | 'Otros'>('1º Ciclo ESO');
  const [room, setRoom] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [password, setPassword] = useState('1234');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(CLASS_GRADIENTS[0].value);
  const [isActiveInUse, setIsActiveInUse] = useState(true);

  useEffect(() => {
    if (targetClass) {
      setName(targetClass.name);
      setStage(targetClass.stage);
      setCycle(targetClass.cycle || '1º Ciclo ESO');
      setRoom(targetClass.room);
      setTutorName(targetClass.tutorName);
      setPassword(targetClass.password || '1234');
      setDescription(targetClass.description || '');
      setColor(targetClass.color || CLASS_GRADIENTS[0].value);
      setIsActiveInUse(!targetClass.isHidden);
    }
  }, [targetClass]);

  if (!isOpen || !targetClass) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor introduce el nombre de la clase.');
      return;
    }

    const updated: SchoolClass = {
      ...targetClass,
      name: name.trim(),
      stage,
      cycle,
      room: room.trim() || 'Aula por asignar',
      tutorName: tutorName.trim() || 'Tutor por asignar',
      password: password.trim() || '1234',
      description: description.trim(),
      color,
      isHidden: !isActiveInUse,
    };

    onUpdateClass(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Editar Datos de la Clase</h3>
              <p className="text-xs text-slate-400">Modifica la información del grupo o aula {targetClass.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Clase *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Etapa Educativa
              </label>
              <select
                value={stage}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setStage(val);
                  if (val === 'Bachillerato') setCycle('Bachillerato');
                  else if (val === 'ESO') setCycle('1º Ciclo ESO');
                  else setCycle('Otros');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium cursor-pointer"
              >
                <option value="ESO">Educación Secundaria (ESO)</option>
                <option value="Bachillerato">Bachillerato</option>
                <option value="FP">Formación Profesional (FP)</option>
                <option value="Primaria">Primaria</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ubicación / Aula física
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ej. Aula 204"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Profesor/a Tutor/a
              </label>
              <input
                type="text"
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                placeholder="Nombre del tutor/a"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contraseña de Acceso para Profesores *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>Color de Distintivo del Grupo</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CLASS_GRADIENTS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setColor(g.value)}
                  className={`h-8 rounded-xl bg-gradient-to-r ${g.value} transition-all relative flex items-center justify-center cursor-pointer ${
                    color === g.value ? 'ring-2 ring-slate-900 ring-offset-2 scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={g.label}
                >
                  {color === g.value && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones del Grupo (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas generales sobre el grupo o acuerdos..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-hidden resize-none"
            />
          </div>

          {/* Estado de Uso / Visibilidad */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isActiveInUse ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {isActiveInUse ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isActiveInUse ? 'Aula Activa en Seguimiento' : 'Aula Oculta (No utilizada)'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {isActiveInUse
                    ? 'Visible en la lista de seguimiento y selección de clases.'
                    : 'Oculta en la lista principal por no estar en uso.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActiveInUse(!isActiveInUse)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                isActiveInUse
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-300 hover:bg-slate-400 text-slate-800'
              }`}
            >
              {isActiveInUse ? 'Activa' : 'Oculta'}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
