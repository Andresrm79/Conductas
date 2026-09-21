import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Award,
  AlertTriangle,
  Scale,
  Sparkles,
  Check,
  Search,
  Sliders,
} from 'lucide-react';
import { BehaviorType, BehaviorCategory } from '../types';

interface BehaviorTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  behaviorTypes: BehaviorType[];
  onAddBehaviorType: (type: Omit<BehaviorType, 'id'>) => void;
  onUpdateBehaviorType: (type: BehaviorType) => void;
  onDeleteBehaviorType: (id: string) => void;
}

export const BehaviorTypesModal: React.FC<BehaviorTypesModalProps> = ({
  isOpen,
  onClose,
  behaviorTypes,
  onAddBehaviorType,
  onUpdateBehaviorType,
  onDeleteBehaviorType,
}) => {
  const [filter, setFilter] = useState<'ALL' | BehaviorCategory>('ALL');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingType, setEditingType] = useState<BehaviorType | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<BehaviorCategory>('disruptiva');
  const [points, setPoints] = useState<number>(-10);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setType('disruptiva');
    setPoints(-10);
    setDescription('');
    setIsCreating(false);
    setEditingType(null);
  };

  const handleStartEdit = (bType: BehaviorType) => {
    setEditingType(bType);
    setName(bType.name);
    setType(bType.type);
    setPoints(bType.points);
    setDescription(bType.description || '');
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Ensure negative points for disruptive, positive for positive
    let finalPoints = Math.abs(points);
    if (type === 'disruptiva') {
      finalPoints = -finalPoints;
    }

    if (editingType) {
      onUpdateBehaviorType({
        ...editingType,
        name: name.trim(),
        type,
        points: finalPoints,
        description: description.trim(),
      });
    } else {
      onAddBehaviorType({
        name: name.trim(),
        type,
        points: finalPoints,
        description: description.trim(),
      });
    }

    resetForm();
  };

  const filteredTypes = behaviorTypes.filter((b) => {
    if (filter !== 'ALL' && b.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return b.name.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q));
    }
    return true;
  });

  const positiveCount = behaviorTypes.filter((b) => b.type === 'positiva').length;
  const disruptiveCount = behaviorTypes.filter((b) => b.type === 'disruptiva').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-amber-400 border border-white/10 flex items-center justify-center shadow-inner">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                Baremo Escolar y Catálogo de Conductas
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Tipos de Conductas y Puntuaciones
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({behaviorTypes.length})
              </button>
              <button
                onClick={() => setFilter('disruptiva')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === 'disruptiva' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Disruptivas ({disruptiveCount})</span>
              </button>
              <button
                onClick={() => setFilter('positiva')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === 'positiva' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Positivas ({positiveCount})</span>
              </button>
            </div>

            {/* Create button */}
            {!isCreating && (
              <button
                onClick={() => {
                  setEditingType(null);
                  setName('');
                  setType('disruptiva');
                  setPoints(-10);
                  setDescription('');
                  setIsCreating(true);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Crear Tipo de Conducta</span>
              </button>
            )}
          </div>

          {/* Creation / Edit Form Card */}
          {isCreating && (
            <form
              onSubmit={handleSubmit}
              className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>{editingType ? 'Editar Tipo de Conducta' : 'Nuevo Tipo de Conducta para el Baremo'}</span>
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Type selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Naturaleza de la Conducta *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setType('disruptiva');
                        if (points > 0) setPoints(-points);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        type === 'disruptiva'
                          ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Disruptiva (Negativa)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setType('positiva');
                        if (points < 0) setPoints(Math.abs(points));
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        type === 'positiva'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Positiva (Reconocimiento)</span>
                    </button>
                  </div>
                </div>

                {/* Points selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {type === 'disruptiva' ? 'Penalización de Puntos (Negativo)' : 'Puntuación Otorgada (Positivo)'} *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      className={`w-full px-3 py-2 text-xs font-extrabold rounded-xl border ${
                        type === 'disruptiva'
                          ? 'text-rose-700 bg-rose-50/50 border-rose-300 focus:ring-rose-500'
                          : 'text-emerald-700 bg-emerald-50/50 border-emerald-300 focus:ring-emerald-500'
                      } focus:outline-hidden focus:ring-2`}
                    />
                    {/* Quick chips */}
                    <div className="flex gap-1">
                      {type === 'disruptiva' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPoints(-5)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => setPoints(-10)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -10
                          </button>
                          <button
                            type="button"
                            onClick={() => setPoints(-20)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -20
                          </button>
                          <button
                            type="button"
                            onClick={() => setPoints(-50)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-rose-50 cursor-pointer text-slate-700"
                          >
                            -50
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPoints(5)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => setPoints(10)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => setPoints(15)}
                            className="px-2 py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 cursor-pointer text-slate-700"
                          >
                            +15
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre descriptivo de la conducta *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Falta de respeto al docente, Interrupción continuada, Trabajo cooperativo..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Criterio / Descripción pedagógica
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre cuándo aplica este baremo o medida correctiva aconsejada..."
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingType ? 'Guardar Cambios' : 'Añadir al Baremo'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar conducta en el baremo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* List of Behavior Types */}
          <div className="space-y-2">
            {filteredTypes.map((bType) => (
              <div
                key={bType.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      bType.type === 'positiva'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {bType.type === 'positiva' ? (
                      <Award className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {bType.name}
                      </h4>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          bType.type === 'positiva'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {bType.points > 0 ? `+${bType.points} pts` : `${bType.points} pts`}
                      </span>
                      {bType.isCustom && (
                        <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          Personalizada
                        </span>
                      )}
                    </div>
                    {bType.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {bType.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartEdit(bType)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Editar baremo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la conducta "${bType.name}" del baremo?`)) {
                        onDeleteBehaviorType(bType.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar conducta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredTypes.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No se encontraron conductas en el baremo</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Puedes crear nuevos tipos de conductas positivas o disruptivas con puntuación.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Las conductas configuradas aquí aplican automáticamente su puntuación al ser registradas.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
