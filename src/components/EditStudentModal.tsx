import React, { useState, useEffect } from 'react';
import { X, UserCheck, ShieldAlert, Check } from 'lucide-react';
import { ClassStudent } from '../types';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ClassStudent | null;
  onUpdateStudent: (updatedStudent: ClassStudent) => void;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600',
];

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onUpdateStudent,
}) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [positivePoints, setPositivePoints] = useState(0);
  const [negativePoints, setNegativePoints] = useState(0);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setNotes(student.conductNotes || '');
      setSelectedColor(student.avatarColor || AVATAR_COLORS[0]);
      setPositivePoints(student.positivePoints || 0);
      setNegativePoints(student.negativePoints || 0);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor introduce el nombre y apellidos del alumno.');
      return;
    }

    onUpdateStudent({
      ...student,
      name: name.trim(),
      avatarColor: selectedColor,
      conductNotes: notes.trim() || undefined,
      positivePoints: Number(positivePoints) || 0,
      negativePoints: Number(negativePoints) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Ficha de Convivencia
              </span>
              <h3 className="text-base font-bold text-white">
                Editar Alumno
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre y Apellidos del Alumno *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Color identificativo
            </label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full ${c} transition-transform cursor-pointer ${
                    selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-900' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Puntos Positivos ⭐
              </label>
              <input
                type="number"
                min={0}
                value={positivePoints}
                onChange={(e) => setPositivePoints(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Puntos Negativos ⚠️
              </label>
              <input
                type="number"
                min={0}
                value={negativePoints}
                onChange={(e) => setNegativePoints(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observaciones de conducta
            </label>
            <textarea
              rows={3}
              placeholder="Notas de tutoría sobre comportamiento, acuerdos o mediaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              <span>Guardar Alumno</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
