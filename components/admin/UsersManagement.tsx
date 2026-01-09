import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  User,
  Crown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getUsers,
  changeUserRole,
  banUser,
  unbanUser,
  AdminUser,
  UserRole,
} from '../../services/admin';

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Usuario',
  MODERATOR: 'Moderador',
  ADMIN: 'Administrador',
};

const ROLE_COLORS: Record<UserRole, string> = {
  USER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  MODERATOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  USER: <User size={14} />,
  MODERATOR: <Shield size={14} />,
  ADMIN: <Crown size={14} />,
};

interface UsersManagementProps {
  onBack?: () => void;
}

const UsersManagement: React.FC<UsersManagementProps> = ({ onBack }) => {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [bannedFilter, setBannedFilter] = useState<boolean | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const LIMIT = 10;
  const totalPages = Math.ceil(total / LIMIT);

  useEffect(() => {
    loadUsers();
  }, [token, page, roleFilter, bannedFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadUsers = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const data = await getUsers(token, page, LIMIT, {
        search: search || undefined,
        role: roleFilter || undefined,
        banned: bannedFilter,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    if (!token) return;

    setActionLoading(true);
    try {
      await changeUserRole(userId, newRole, token);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setShowActions(null);
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!token || !selectedUser) return;

    setActionLoading(true);
    try {
      await banUser(selectedUser.id, banReason, token);
      setUsers(users.map(u => u.id === selectedUser.id ? {
        ...u,
        bannedAt: new Date().toISOString(),
        bannedReason: banReason,
      } : u));
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error banning user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!token) return;

    setActionLoading(true);
    try {
      await unbanUser(userId, token);
      setUsers(users.map(u => u.id === userId ? {
        ...u,
        bannedAt: null,
        bannedReason: null,
      } : u));
      setShowActions(null);
    } catch (error) {
      console.error('Error unbanning user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-oaxaca-pink outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | '');
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-oaxaca-pink outline-none"
          >
            <option value="">Todos los roles</option>
            <option value="USER">Usuarios</option>
            <option value="MODERATOR">Moderadores</option>
            <option value="ADMIN">Administradores</option>
          </select>

          <select
            value={bannedFilter === undefined ? '' : bannedFilter.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setBannedFilter(val === '' ? undefined : val === 'true');
              setPage(1);
            }}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-oaxaca-pink outline-none"
          >
            <option value="">Todos</option>
            <option value="false">Activos</option>
            <option value="true">Baneados</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No se encontraron usuarios
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-4 flex items-center gap-3 ${
                  user.bannedAt ? 'bg-red-50 dark:bg-red-900/10' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.nombre}&background=random`}
                    alt={user.nombre}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {user.bannedAt && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
                      <Ban size={12} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {user.nombre} {user.apellido}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_ICONS[user.role]}
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{user.storiesCount} historias</span>
                    <span>{user.followersCount} seguidores</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>

                  {showActions === user.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowActions(null)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                        {/* Change Role */}
                        <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 px-2 mb-1">Cambiar rol</p>
                          {(['USER', 'MODERATOR', 'ADMIN'] as UserRole[]).map((role) => (
                            <button
                              key={role}
                              onClick={() => handleChangeRole(user.id, role)}
                              disabled={actionLoading || user.role === role}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                                user.role === role ? 'bg-gray-100 dark:bg-gray-700' : ''
                              }`}
                            >
                              {ROLE_ICONS[role]}
                              {ROLE_LABELS[role]}
                              {user.role === role && <CheckCircle size={14} className="ml-auto text-green-500" />}
                            </button>
                          ))}
                        </div>

                        {/* Ban/Unban */}
                        <div className="p-2">
                          {user.bannedAt ? (
                            <button
                              onClick={() => handleUnbanUser(user.id)}
                              disabled={actionLoading}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                            >
                              <CheckCircle size={16} />
                              Desbanear usuario
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBanModal(true);
                                setShowActions(null);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                              <Ban size={16} />
                              Banear usuario
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Mostrando {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">Banear usuario</h3>
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                  setBanReason('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <img
                  src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.nombre}&background=random`}
                  alt={selectedUser.nombre}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedUser.nombre}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Razon del baneo
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ingresa la razon del baneo..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowBanModal(false);
                    setSelectedUser(null);
                    setBanReason('');
                  }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={!banReason.trim() || actionLoading}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Ban size={18} />
                      Banear
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
