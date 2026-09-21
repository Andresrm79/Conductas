import React, { useState, useMemo } from 'react';
import {
  Users,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Building2,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  Info,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { SchoolClass, UserProfile, UserRole } from '../types';

interface DirectivoUsersConfigTabProps {
  profiles: UserProfile[];
  classes: SchoolClass[];
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddUser: (newUser: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onResetUserPassword: (userId: string) => void;
}

export const DirectivoUsersConfigTab: React.FC<DirectivoUsersConfigTabProps> = ({
  profiles,
  classes,
  currentUser,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onResetUserPassword,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // Modal state for Edit / Create User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Profesor');
  const [formSubject, setFormSubject] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formPassword, setFormPassword] = useState('1234');
  const [formAvatarColor, setFormAvatarColor] = useState('bg-blue-600');
  const [formAllowedAll, setFormAllowedAll] = useState(false);
  const [formAllowedClasses, setFormAllowedClasses] = useState<string[]>([]);

  // Permissions Modal state for quick class assignment
  const [permissionsTargetUser, setPermissionsTargetUser] = useState<UserProfile | null>(null);
  const [permAllowedAll, setPermAllowedAll] = useState(false);
  const [permClasses, setPermClasses] = useState<string[]>([]);

  // Toast / Alert notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSubj = (p.subject || '').toLowerCase().includes(q);
        const matchesRole = p.role.toLowerCase().includes(q);
        const matchesCourse = (p.course || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSubj && !matchesRole && !matchesCourse) return false;
      }
      return true;
    });
  }, [profiles, roleFilter, searchTerm]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingUserId(null);
    setFormName('');
    setFormRole('Profesor');
    setFormSubject('');
    setFormCourse('');
    setFormPassword('1234');
    setFormAvatarColor('bg-blue-600');
    setFormAllowedAll(false);
    setFormAllowedClasses(classes.slice(0, 2).map((c) => c.name));
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: UserProfile) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormRole(user.role);
    setFormSubject(user.subject || '');
    setFormCourse(user.course || '');
    setFormPassword(user.password || '1234');
    setFormAvatarColor(user.avatarColor || 'bg-blue-600');
    const isAll = user.allowedClasses?.includes('ALL') || user.role === 'Directivo' || user.role === 'Orientador';
    setFormAllowedAll(isAll);
    setFormAllowedClasses(user.allowedClasses || []);
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const resolvedAllowed: string[] = formAllowedAll || formRole === 'Directivo' || formRole === 'Orientador'
      ? ['ALL']
      : formAllowedClasses;

    if (modalMode === 'create') {
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: formName.trim(),
        role: formRole,
        subject: formSubject.trim() || undefined,
        course: formRole === 'Tutor' ? formCourse.trim() || undefined : undefined,
        avatarColor: formAvatarColor,
        password: formPassword.trim() || '1234',
        allowedClasses: resolvedAllowed,
      };
      onAddUser(newUser);
      showToast(`Docente "${newUser.name}" registrado con éxito.`);
    } else if (modalMode === 'edit' && editingUserId) {
      const current = profiles.find((p) => p.id === editingUserId);
      if (current) {
        const updatedUser: UserProfile = {
          ...current,
          name: formName.trim(),
          role: formRole,
          subject: formSubject.trim() || undefined,
          course: formRole === 'Tutor' ? formCourse.trim() || undefined : undefined,
          avatarColor: formAvatarColor,
          password: formPassword.trim() || current.password || '1234',
          allowedClasses: resolvedAllowed,
        };
        onUpdateUser(updatedUser);
        showToast(`Perfil de "${updatedUser.name}" actualizado.`);
      }
    }
    setIsModalOpen(false);
  };

  // Asignación directa de roles por Dirección
  const handleQuickRoleChange = (user: UserProfile, newRole: UserRole) => {
    if (user.role === newRole) return;

    let updatedAllowed = user.allowedClasses ? [...user.allowedClasses] : [];
    if (newRole === 'Directivo' || newRole === 'Orientador') {
      updatedAllowed = ['ALL'];
    } else if (user.role === 'Directivo' && (!updatedAllowed.length || updatedAllowed.includes('ALL'))) {
      // Al pasar a Profesor o Tutor, asignamos aulas iniciales si estaba en ALL
      updatedAllowed = classes.slice(0, 3).map((c) => c.name);
    }

    let defaultCourse = user.course;
    if (newRole === 'Tutor' && !defaultCourse) {
      const matched = classes.find(
        (c) => c.tutorName.toLowerCase() === user.name.toLowerCase()
      );
      defaultCourse = matched ? matched.name : classes[0]?.name || '';
      if (defaultCourse && !updatedAllowed.includes(defaultCourse) && !updatedAllowed.includes('ALL')) {
        updatedAllowed.push(defaultCourse);
      }
    }

    const updatedUser: UserProfile = {
      ...user,
      role: newRole,
      course: newRole === 'Tutor' ? defaultCourse : user.course,
      allowedClasses: updatedAllowed,
    };
    onUpdateUser(updatedUser);
    showToast(`Rol de "${user.name}" asignado a ${newRole === 'Directivo' ? 'Dirección' : newRole}.`);
  };

  // Asignación rápida de aula de tutoría
  const handleQuickCourseChange = (user: UserProfile, newCourse: string) => {
    let updatedAllowed = user.allowedClasses ? [...user.allowedClasses] : [];
    if (newCourse && !updatedAllowed.includes(newCourse) && !updatedAllowed.includes('ALL')) {
      updatedAllowed.push(newCourse);
    }
    const updatedUser: UserProfile = {
      ...user,
      course: newCourse || undefined,
      allowedClasses: updatedAllowed,
    };
    onUpdateUser(updatedUser);
    showToast(`Tutoría de "${user.name}" vinculada a ${newCourse || 'ninguna'}.`);
  };

  // Reset to 1234
  const handleResetPassword = (user: UserProfile) => {
    onResetUserPassword(user.id);
    showToast(`🔑 Contraseña de "${user.name}" reseteada a la genérica: 1234.`);
  };

  // Open Permissions Modal
  const handleOpenPermissionsModal = (user: UserProfile) => {
    setPermissionsTargetUser(user);
    const isAll = user.allowedClasses?.includes('ALL') || user.role === 'Directivo' || user.role === 'Orientador';
    setPermAllowedAll(isAll);
    setPermClasses(user.allowedClasses || []);
  };

  // Save Permissions
  const handleSavePermissions = () => {
    if (!permissionsTargetUser) return;
    const resolvedAllowed = permAllowedAll ? ['ALL'] : permClasses;
    const updated: UserProfile = {
      ...permissionsTargetUser,
      allowedClasses: resolvedAllowed,
    };
    onUpdateUser(updated);
    showToast(`Permisos de aulas para "${updated.name}" actualizados.`);
    setPermissionsTargetUser(null);
  };

  // Stats
  const totalUsers = profiles.length;
  const professorsCount = profiles.filter((p) => p.role === 'Profesor').length;
  const tutorsCount = profiles.filter((p) => p.role === 'Tutor').length;
  const directivosCount = profiles.filter((p) => p.role === 'Directivo' || p.role === 'Orientador').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-purple-500/40 shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Security Policy */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-purple-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Control de Accesos y Permisos por Aula</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Gestión de Perfiles y Claves de Acceso Docente
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
              Configura los perfiles de los docentes y determina exactamente a qué aulas tiene acceso cada uno. 
              Cada profesor dispone de su <strong>clave personal</strong> para entrar en las clases autorizadas. 
              Si algún usuario la olvida, Dirección puede restablecerla en un clic a la clave genérica <code className="font-mono bg-purple-900/60 text-amber-300 px-1.5 py-0.5 rounded font-bold">1234</code>.
            </p>
          </div>

          <button
            id="btn-add-new-user"
            type="button"
            onClick={handleOpenCreateModal}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>+ Registrar Docente</span>
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="mt-5 pt-4 border-t border-purple-800/50 flex flex-wrap items-center gap-3 text-xs text-purple-200">
          <div className="bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-700/50 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-300" />
            <span><strong>{totalUsers}</strong> Usuarios Activos</span>
          </div>
          <div className="bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-700/50 flex items-center gap-2">
            <span><strong>{professorsCount}</strong> Profesores</span>
            <span className="text-purple-400">•</span>
            <span><strong>{tutorsCount}</strong> Tutores</span>
            <span className="text-purple-400">•</span>
            <span><strong>{directivosCount}</strong> Dirección/Orientación</span>
          </div>
          <div className="bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-700/50 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span><strong>{classes.length}</strong> Aulas en el Centro</span>
          </div>
          <div className="bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-700/50 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Clave de reseteo: <strong className="font-mono text-amber-300">1234</strong></span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-users"
            placeholder="Buscar docente por nombre, departamento, asignatura o tutoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(['ALL', 'Profesor', 'Tutor', 'Directivo', 'Orientador'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL' ? 'Todos' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.map((user) => {
          const isCurrentUser = user.id === currentUser.id;
          const isAllAccess =
            user.allowedClasses?.includes('ALL') ||
            user.role === 'Directivo' ||
            user.role === 'Orientador';
          const userAllowedClasses = user.allowedClasses || [];

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                isCurrentUser ? 'border-purple-300 ring-2 ring-purple-400/20' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl text-white font-bold flex items-center justify-center text-sm shadow-xs ${
                        user.avatarColor || 'bg-purple-600'
                      }`}
                    >
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {user.name}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                            Tú
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block">
                        {user.subject ? user.subject : 'Docencia General'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      user.role === 'Directivo'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : user.role === 'Tutor'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : user.role === 'Orientador'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {/* Asignación Directa de Rol desde Dirección */}
                <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      Asignar Rol:
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">Gestión de Dirección</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickRoleChange(user, 'Profesor')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        user.role === 'Profesor'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Profesor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRoleChange(user, 'Tutor')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        user.role === 'Tutor'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Tutor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRoleChange(user, 'Directivo')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        user.role === 'Directivo'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Dirección
                    </button>
                  </div>

                  {user.role === 'Tutor' && (
                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/60">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Aula de tutoría:
                      </span>
                      <select
                        value={user.course || ''}
                        onChange={(e) => handleQuickCourseChange(user, e.target.value)}
                        className="text-xs font-bold bg-white text-slate-900 border border-amber-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="">Elegir aula...</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.name}>
                            {cls.name} ({cls.room})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Tutor Course if applicable (already assigned display) */}
                {user.role === 'Tutor' && user.course && (
                  <div className="text-xs bg-amber-50 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-200/80 font-medium flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Tutoría asignada: <strong>{user.course}</strong></span>
                  </div>
                )}

                {/* Clave de Acceso Box */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Clave de Acceso:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {user.password === '1234' || !user.password ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          1234 (Genérica)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                          Personalizada
                        </span>
                      )}
                      <span className="font-mono text-xs font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {user.password === '1234' || !user.password ? '1234' : '••••'}
                      </span>
                    </div>
                  </div>

                  {/* Reset to 1234 Button */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500">¿Olvidó la clave?</span>
                    <button
                      type="button"
                      onClick={() => handleResetPassword(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-400 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Restablece la contraseña a la clave por defecto 1234"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
                      <span>Resetear a 1234</span>
                    </button>
                  </div>
                </div>

                {/* Clases Autorizadas por Dirección */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Aulas Autorizadas:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenPermissionsModal(user)}
                      className="text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                    >
                      Configurar Aulas
                    </button>
                  </div>

                  {isAllAccess ? (
                    <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Acceso a Todas las Clases (Total)</span>
                    </div>
                  ) : userAllowedClasses.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                      {userAllowedClasses.map((clsName) => (
                        <span
                          key={clsName}
                          className="text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
                        >
                          {clsName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Sin aulas autorizadas (Bloqueado)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(user)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-purple-700 bg-white hover:bg-purple-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Perfil</span>
                </button>

                {!isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Seguro que deseas eliminar el usuario de ${user.name}?`)) {
                        onDeleteUser(user.id);
                        showToast(`Usuario "${user.name}" eliminado.`);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No se encontraron docentes</h3>
          <p className="text-xs text-slate-500">
            No hay ningún perfil que coincida con la búsqueda. Puedes añadir uno nuevo o limpiar filtros.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('ALL');
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      {/* Modal: Crear o Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {modalMode === 'create' ? 'Registrar Nuevo Docente' : 'Editar Perfil de Docente'}
                  </h3>
                  <p className="text-xs text-purple-200">
                    Define identidad, rol, contraseña y permisos de aula
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUser} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Laura Sánchez Gómez"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rol en el Centro *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-semibold cursor-pointer"
                  >
                    <option value="Profesor">Profesor</option>
                    <option value="Tutor">Tutor</option>
                    <option value="Directivo">Directivo</option>
                    <option value="Orientador">Orientador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Asignatura / Dpto.
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Matemáticas, Física..."
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-medium"
                  />
                </div>
              </div>

              {formRole === 'Tutor' && (
                <div>
                  <label className="block font-bold text-amber-800 uppercase tracking-wider mb-1">
                    Aula de Tutoría Asignada
                  </label>
                  <select
                    value={formCourse}
                    onChange={(e) => setFormCourse(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                  >
                    <option value="">Selecciona aula de tutoría...</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.room})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Password field */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Clave de Acceso del Docente *
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPassword('1234')}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                    title="Poner la clave genérica 1234"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-800" />
                    <span>Usar genérica 1234</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Clave de acceso..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Clave genérica por defecto: <strong className="font-mono text-slate-800">1234</strong>. Puede restablecerse en cualquier momento si el docente la olvida.
                </p>
              </div>

              {/* Allowed Classes Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider">
                    Aulas Autorizadas por Dirección
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAllowedAll(!formAllowedAll)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                        formAllowedAll
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {formAllowedAll ? '✓ Todas las aulas' : 'Autorizar Todas'}
                    </button>
                  </div>
                </div>

                {!formAllowedAll && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {classes.map((cls) => {
                      const isChecked = formAllowedClasses.includes(cls.name);
                      return (
                        <label
                          key={cls.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormAllowedClasses([...formAllowedClasses, cls.name]);
                              } else {
                                setFormAllowedClasses(
                                  formAllowedClasses.filter((c) => c !== cls.name)
                                );
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="truncate">{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{modalMode === 'create' ? 'Crear Docente' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Permissions Editor */}
      {permissionsTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                  Permisos de Aulas
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {permissionsTargetUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPermissionsTargetUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Selecciona las clases a las que este docente tendrá autorización para acceder con su clave personal:
              </p>

              {/* Option: All classes */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/60 cursor-pointer">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-purple-950">Acceso a Todas las Clases (Total)</span>
                </div>
                <input
                  type="checkbox"
                  checked={permAllowedAll}
                  onChange={(e) => setPermAllowedAll(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
              </label>

              {!permAllowedAll && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Aulas específicas del centro:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (permClasses.length === classes.length) {
                          setPermClasses([]);
                        } else {
                          setPermClasses(classes.map((c) => c.name));
                        }
                      }}
                      className="text-purple-700 font-bold hover:underline"
                    >
                      {permClasses.length === classes.length ? 'Desmarcar todas' : 'Marcar todas'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {classes.map((cls) => {
                      const isChecked = permClasses.includes(cls.name);
                      return (
                        <label
                          key={cls.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-purple-100/70 border-purple-300 text-purple-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPermClasses([...permClasses, cls.name]);
                              } else {
                                setPermClasses(permClasses.filter((c) => c !== cls.name));
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="truncate">{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPermissionsTargetUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Permisos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
