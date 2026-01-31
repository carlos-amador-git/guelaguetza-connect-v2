import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Image,
  MessageCircle,
  Heart,
  Calendar,
  UsersRound,
  UserPlus,
  Activity,
  Loader2,
  Shield,
  FileText,
  Settings,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  Globe,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  Map,
  ShoppingBag,
  Video,
  Bus,
  Flag,
  Ban,
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronRight,
  Home,
  Bell,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats, DashboardStats } from '../../services/admin';
import StatCard from '../ui/StatCard';
import UsersManagement from './UsersManagement';
import { ViewState } from '../../types';

type AdminTab = 'overview' | 'analytics' | 'users' | 'content' | 'incidents' | 'system';

interface AdminDashboardProps {
  onBack: () => void;
  onNavigate?: (view: ViewState) => void;
  initialTab?: AdminTab;
}

// Mock data for charts and metrics
const MOCK_DAILY_USERS = [
  { day: 'Lun', users: 1250, newUsers: 45 },
  { day: 'Mar', users: 1380, newUsers: 62 },
  { day: 'Mie', users: 1520, newUsers: 78 },
  { day: 'Jue', users: 1890, newUsers: 95 },
  { day: 'Vie', users: 2340, newUsers: 156 },
  { day: 'Sab', users: 3200, newUsers: 234 },
  { day: 'Dom', users: 2890, newUsers: 189 },
];

const MOCK_FEATURE_USAGE = [
  { name: 'Historias', usage: 45, color: '#EC4899' },
  { name: 'Transporte', usage: 28, color: '#8B5CF6' },
  { name: 'Eventos', usage: 15, color: '#F59E0B' },
  { name: 'Tienda', usage: 8, color: '#10B981' },
  { name: 'Streaming', usage: 4, color: '#3B82F6' },
];

const MOCK_INCIDENTS = [
  { id: 1, type: 'spam', status: 'pending', user: 'usuario_123', description: 'Contenido spam en historias', createdAt: '2025-01-08T10:30:00Z' },
  { id: 2, type: 'abuse', status: 'reviewing', user: 'vendedor_456', description: 'Reporte de producto falso', createdAt: '2025-01-08T09:15:00Z' },
  { id: 3, type: 'bug', status: 'resolved', user: 'sistema', description: 'Error en carga de imagenes', createdAt: '2025-01-07T18:45:00Z' },
  { id: 4, type: 'complaint', status: 'pending', user: 'turista_789', description: 'Ruta de bus incorrecta', createdAt: '2025-01-08T08:00:00Z' },
];

const MOCK_REGIONS = [
  { name: 'Oaxaca Centro', users: 4520, percentage: 35 },
  { name: 'Valles Centrales', users: 2890, percentage: 22 },
  { name: 'Costa', users: 1560, percentage: 12 },
  { name: 'Mixteca', users: 1200, percentage: 9 },
  { name: 'Sierra Norte', users: 980, percentage: 8 },
  { name: 'Otros', users: 1850, percentage: 14 },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  onNavigate,
  initialTab = 'overview',
}) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats(token || '');
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setTimeout(() => setRefreshing(false), 500);
  };

  const tabs = [
    { id: 'overview' as const, label: 'General', icon: BarChart3 },
    { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
    { id: 'users' as const, label: 'Usuarios', icon: Users },
    { id: 'content' as const, label: 'Contenido', icon: FileText },
    { id: 'incidents' as const, label: 'Incidencias', icon: AlertTriangle },
    { id: 'system' as const, label: 'Sistema', icon: Server },
  ];

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-oaxaca-yellow-light text-oaxaca-yellow dark:bg-oaxaca-yellow/20 dark:text-oaxaca-yellow';
      case 'reviewing': return 'bg-oaxaca-sky-light text-oaxaca-sky dark:bg-oaxaca-sky/20 dark:text-oaxaca-sky';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case 'spam': return <MessageCircle size={16} />;
      case 'abuse': return <Flag size={16} />;
      case 'bug': return <AlertTriangle size={16} />;
      case 'complaint': return <FileText size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-950 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-oaxaca-yellow to-oaxaca-yellow rounded-lg">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">Panel de Administracion</h1>
                  <p className="text-xs text-white/60">Guelaguetza Connect - Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className={`p-2 hover:bg-white/10 rounded-full transition ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={18} />
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate(ViewState.HOME)}
                  className="p-2 hover:bg-white/10 rounded-full transition"
                >
                  <Home size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{stats?.totalUsers?.toLocaleString() || '12,847'}</div>
              <div className="text-[10px] text-white/60">Usuarios</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-green-400">+{stats?.newUsersToday || 156}</div>
              <div className="text-[10px] text-white/60">Hoy</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-oaxaca-yellow">{stats?.activeUsersToday || 3420}</div>
              <div className="text-[10px] text-white/60">Activos</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-oaxaca-pink">{stats?.totalStories || 8934}</div>
              <div className="text-[10px] text-white/60">Historias</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-oaxaca-pink" size={40} />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {activeTab === 'overview' && (
              <>
                {/* Real-time Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Activity size={18} className="text-green-500" />
                      Actividad en Tiempo Real
                    </h3>
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      En vivo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                      <Eye size={20} className="mx-auto text-oaxaca-sky mb-1" />
                      <div className="text-xl font-bold text-gray-900 dark:text-white">847</div>
                      <div className="text-xs text-gray-500">Usuarios online</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                      <Image size={20} className="mx-auto text-oaxaca-pink mb-1" />
                      <div className="text-xl font-bold text-gray-900 dark:text-white">23</div>
                      <div className="text-xs text-gray-500">Historias/hora</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                      <MessageCircle size={20} className="mx-auto text-oaxaca-purple mb-1" />
                      <div className="text-xl font-bold text-gray-900 dark:text-white">156</div>
                      <div className="text-xs text-gray-500">Mensajes/hora</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                      <ShoppingBag size={20} className="mx-auto text-green-500 mb-1" />
                      <div className="text-xl font-bold text-gray-900 dark:text-white">$12.4k</div>
                      <div className="text-xs text-gray-500">Ventas hoy</div>
                    </div>
                  </div>
                </div>

                {/* Weekly Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp size={18} className="text-oaxaca-pink" />
                    Usuarios esta Semana
                  </h3>
                  <div className="h-40 flex items-end justify-between gap-2">
                    {MOCK_DAILY_USERS.map((data, index) => (
                      <div key={data.day} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative" style={{ height: `${(data.users / 3500) * 100}%` }}>
                          <div
                            className="absolute bottom-0 w-full bg-gradient-to-t from-oaxaca-purple to-oaxaca-pink rounded-t-lg transition-all"
                            style={{ height: `${(data.users / 3500) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{data.day}</span>
                        <span className="text-[10px] text-green-500">+{data.newUsers}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Usage */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <PieChart size={18} className="text-oaxaca-sky" />
                    Uso por Funcionalidad
                  </h3>
                  <div className="space-y-3">
                    {MOCK_FEATURE_USAGE.map((feature) => (
                      <div key={feature.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">{feature.name}</span>
                          <span className="text-gray-500">{feature.usage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${feature.usage}%`, backgroundColor: feature.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geographic Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Map size={18} className="text-green-500" />
                    Distribucion Geografica
                  </h3>
                  <div className="space-y-2">
                    {MOCK_REGIONS.map((region) => (
                      <div key={region.name} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-gray-700 dark:text-gray-300 truncate">{region.name}</div>
                        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                            style={{ width: `${region.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 w-16 text-right">{region.users.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'analytics' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Tasa de Retencion</span>
                      <TrendingUp size={16} className="text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">78.5%</div>
                    <div className="text-xs text-green-500">+2.3% vs semana anterior</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Tiempo Promedio</span>
                      <Clock size={16} className="text-oaxaca-sky" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">12.4 min</div>
                    <div className="text-xs text-green-500">+1.2 min vs promedio</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Conversion</span>
                      <Zap size={16} className="text-oaxaca-yellow" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">4.2%</div>
                    <div className="text-xs text-red-500">-0.3% vs mes anterior</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">NPS Score</span>
                      <Heart size={16} className="text-oaxaca-pink" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">72</div>
                    <div className="text-xs text-green-500">Excelente</div>
                  </div>
                </div>

                {/* Top Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Contenido Popular</h3>
                  <div className="space-y-3">
                    {[
                      { title: 'Desfile de Delegaciones 2025', views: 15420, type: 'historia' },
                      { title: 'Tutorial: Mole Negro', views: 12890, type: 'historia' },
                      { title: 'Ruta al Auditorio', views: 9870, type: 'transporte' },
                      { title: 'Mezcal El Cortijo', views: 8540, type: 'producto' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.views.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">vistas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Options */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Exportar Reportes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                      <Download size={16} />
                      <span className="text-sm">Usuarios (CSV)</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                      <Download size={16} />
                      <span className="text-sm">Metricas (PDF)</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <UsersManagement />
            )}

            {activeTab === 'content' && (
              <>
                {/* Content Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Historias" value={stats?.totalStories || 8934} icon={<Image size={20} />} color="pink" />
                  <StatCard label="Comentarios" value={stats?.totalComments || 23456} icon={<MessageCircle size={20} />} color="blue" />
                  <StatCard label="Productos" value={1247} icon={<ShoppingBag size={20} />} color="green" />
                  <StatCard label="Streams" value={89} icon={<Video size={20} />} color="red" />
                </div>

                {/* Pending Review */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Eye size={18} className="text-oaxaca-yellow" />
                    Pendiente de Revision
                  </h3>
                  <div className="space-y-2">
                    {[
                      { type: 'Historia', title: 'Foto en el zocalo', user: '@turista123', time: '5 min' },
                      { type: 'Producto', title: 'Mezcal artesanal', user: '@vendedor456', time: '15 min' },
                      { type: 'Comentario', title: 'Contenido reportado', user: '@usuario789', time: '1 hora' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <span className="text-xs px-2 py-0.5 bg-oaxaca-yellow-light dark:bg-oaxaca-yellow/20 text-oaxaca-yellow dark:text-oaxaca-yellow rounded-full">{item.type}</span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.user} - hace {item.time}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg hover:bg-green-200 transition">
                            <CheckCircle size={16} />
                          </button>
                          <button className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 transition">
                            <XCircle size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'incidents' && (
              <>
                {/* Incident Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-oaxaca-yellow-light dark:bg-oaxaca-yellow/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-oaxaca-yellow">12</div>
                    <div className="text-xs text-oaxaca-yellow dark:text-oaxaca-yellow">Pendientes</div>
                  </div>
                  <div className="bg-oaxaca-sky-light dark:bg-oaxaca-sky/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-oaxaca-sky">5</div>
                    <div className="text-xs text-oaxaca-sky dark:text-oaxaca-sky">En revision</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">234</div>
                    <div className="text-xs text-green-700 dark:text-green-400">Resueltos</div>
                  </div>
                </div>

                {/* Incident List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Incidencias Recientes</h3>
                    <button className="text-sm text-oaxaca-pink flex items-center gap-1">
                      <Filter size={14} />
                      Filtrar
                    </button>
                  </div>
                  <div className="divide-y dark:divide-gray-700">
                    {MOCK_INCIDENTS.map((incident) => (
                      <div key={incident.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              incident.type === 'spam' ? 'bg-oaxaca-yellow-light text-oaxaca-yellow' :
                              incident.type === 'abuse' ? 'bg-red-100 text-red-600' :
                              incident.type === 'bug' ? 'bg-oaxaca-purple-light text-oaxaca-purple' :
                              'bg-oaxaca-sky-light text-oaxaca-sky'
                            }`}>
                              {getIncidentTypeIcon(incident.type)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{incident.description}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Reportado por {incident.user} - {new Date(incident.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getIncidentStatusColor(incident.status)}`}>
                            {incident.status === 'pending' ? 'Pendiente' : incident.status === 'reviewing' ? 'Revisando' : 'Resuelto'}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3 ml-11">
                          <button className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                            Ver detalles
                          </button>
                          {incident.status !== 'resolved' && (
                            <>
                              <button className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 transition">
                                Resolver
                              </button>
                              <button className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 transition">
                                <Ban size={12} className="inline mr-1" />
                                Banear usuario
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'system' && (
              <>
                {/* System Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Server size={18} className="text-green-500" />
                      Estado del Sistema
                    </h3>
                    <span className="flex items-center gap-1.5 text-xs text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      <CheckCircle size={12} />
                      Operativo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Cpu size={14} /> CPU
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">23%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-full w-[23%] bg-green-500 rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <HardDrive size={14} /> Memoria
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">67%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-full w-[67%] bg-oaxaca-yellow rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Database size={14} /> Base de datos
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">45%</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-full w-[45%] bg-oaxaca-sky rounded-full" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          <Wifi size={14} /> Red
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">12ms</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-full w-[15%] bg-green-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Servicios</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'API Principal', status: 'online', latency: '45ms' },
                      { name: 'Base de datos', status: 'online', latency: '12ms' },
                      { name: 'Almacenamiento', status: 'online', latency: '89ms' },
                      { name: 'CDN Imagenes', status: 'online', latency: '23ms' },
                      { name: 'Streaming', status: 'online', latency: '156ms' },
                      { name: 'Notificaciones', status: 'degraded', latency: '234ms' },
                    ].map((service) => (
                      <div key={service.name} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            service.status === 'online' ? 'bg-green-500' :
                            service.status === 'degraded' ? 'bg-oaxaca-yellow' : 'bg-red-500'
                          }`} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{service.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{service.latency}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Logs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Logs Recientes</h3>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 max-h-48 overflow-y-auto">
                    <p>[2025-01-08 14:23:45] INFO: User login successful - user_id: 12847</p>
                    <p>[2025-01-08 14:23:44] INFO: Story uploaded - story_id: 89234</p>
                    <p>[2025-01-08 14:23:42] WARN: High latency detected on CDN node 3</p>
                    <p>[2025-01-08 14:23:40] INFO: Payment processed - order_id: 4521</p>
                    <p>[2025-01-08 14:23:38] INFO: New user registration - email: ***@gmail.com</p>
                    <p>[2025-01-08 14:23:35] INFO: Cache invalidated - key: user_stats</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
