import React, { useState } from 'react';
import { X, Award, Star, Sparkles, User, CheckCircle2 } from 'lucide-react';
import { ClassStudent, PositiveBehavior, UserProfile } from '../types';

interface AddPositiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ClassStudent | null;
  currentUser: UserProfile;
  onSavePositive: (positive: Omit<PositiveBehavior, 'id'>) => void;
}

const POSITIVE_CATEGORIES = [
  'Participación destacada en clase',
  'Compañerismo y ayuda mutua',
  'Trabajo constante y entrega puntual',
  'Excelente actitud y respeto',
  'Iniciativa y creatividad en proyectos',
  'Superación y esfuerzo personal',
  'Cuidado del material y orden del aula',
];

export const AddPositiveModal: React.FC<AddPositiveModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
  onSavePositive,
}) => {
  const [category, setCategory] = useState(POSITIVE_CATEGORIES[0]);
  const [points, setPoints] = useState(1);
  const [description, setDescription] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePositive({
      studentName: student.name,
      studentGroup: student.className,
      date: new Date().toISOString().split('T')[0],
      category,
      description: description.trim() || category,
      teacherName: currentUser.name,
      points,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-amber-300 border border-white/20 flex items-center justify-center shadow-inner">
              <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                Reconocimiento Positivo
              </span>
              <h3 className="text-base font-bold text-white leading-tight">
                {student.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Conducta Positiva
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {POSITIVE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Puntos otorgados
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPoints(p)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    points === p
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{p} {p === 1 ? 'Punto' : 'Puntos'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Comentario o detalle (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Explicó con gran claridad la duda de su compañero..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 resize-none"
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Guardar Felicitación</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
