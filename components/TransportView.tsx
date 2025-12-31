import React, { useState, useEffect } from 'react';
import { Bus, Clock, MapPin, Navigation as NavIcon, RefreshCw, Loader2 } from 'lucide-react';
import { fetchRoutes, BusRoute } from '../services/api';
import { ROUTES } from '../constants';

interface DisplayRoute {
  id: string;
  name: string;
  color: string;
  eta: number;
  stops: string[];
}

const TransportView: React.FC = () => {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [simulationTick, setSimulationTick] = useState(0);

  useEffect(() => {
    fetchRoutes()
      .then((data) => {
        setRoutes(data);
        if (data.length > 0) setSelectedRouteId(data[0].routeCode);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Simulate bus movement along a percentage
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulationTick((prev) => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Convert API routes to display format or use fallback
  const displayRoutes: DisplayRoute[] = error || routes.length === 0
    ? ROUTES.map(r => ({ id: r.id, name: r.name, color: r.color, eta: r.eta, stops: r.stops }))
    : routes.map(r => ({
        id: r.routeCode,
        name: r.name,
        color: r.color,
        eta: r.frequency || 10,
        stops: r.stops.map(s => s.name)
      }));

  const activeRoute = displayRoutes.find(r => r.id === selectedRouteId) || displayRoutes[0];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-oaxaca-purple" size={40} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20">
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0">
        <h2 className="text-xl font-bold text-oaxaca-purple mb-1">Rastreador BinniBus</h2>
        <p className="text-xs text-gray-500">Sistema de transporte oficial Guelaguetza</p>

        {/* Route Selector */}
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {displayRoutes.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedRouteId === route.id
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: route.color }}></div>
                {route.id}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Area (Simulated) */}
      <div className="flex-1 relative overflow-hidden bg-blue-50">
        {/* Simplified Vector Map Background */}
        <svg className="w-full h-full absolute inset-0 text-gray-200" preserveAspectRatio="none">
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Route Path Visualization */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full p-10" viewBox="0 0 300 500">
            {/* The Route Path */}
            <path
              d="M 150 50 C 50 150, 250 250, 150 450"
              fill="none"
              stroke={activeRoute.color}
              strokeWidth="6"
              strokeLinecap="round"
              className="drop-shadow-lg"
            />
            {/* Stops */}
            <circle cx="150" cy="50" r="6" fill="white" stroke={activeRoute.color} strokeWidth="3" />
            <circle cx="95" cy="155" r="6" fill="white" stroke={activeRoute.color} strokeWidth="3" />
            <circle cx="205" cy="255" r="6" fill="white" stroke={activeRoute.color} strokeWidth="3" />
            <circle cx="150" cy="450" r="6" fill="white" stroke={activeRoute.color} strokeWidth="3" />

            {/* Moving Bus Icon (Simulated via SVG animation logic) */}
            {/* Note: In a real app, this would use exact lat/lng projection */}
             <circle
                r="12"
                fill={activeRoute.color}
                className="animate-pulse"
             >
                <animateMotion
                   dur={`${activeRoute.eta * 2}s`}
                   repeatCount="indefinite"
                   path="M 150 50 C 50 150, 250 250, 150 450"
                   keyPoints="0;1"
                   keyTimes="0;1"
                   calcMode="linear"
                />
             </circle>
          </svg>
        </div>

        {/* Bus Info Card Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 border-l-4" style={{ borderColor: activeRoute.color }}>
          <div className="flex justify-between items-start">
             <div>
               <h3 className="font-bold text-gray-800">{activeRoute.name}</h3>
               <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                 <Clock size={14} />
                 <span>Próximo bus: <span className="font-bold text-oaxaca-pink">{Math.ceil(activeRoute.eta * (1 - (simulationTick/100)))} min</span></span>
               </div>
             </div>
             <button className="bg-gray-100 p-2 rounded-full hover:bg-gray-200">
               <NavIcon size={18} className="text-gray-700" />
             </button>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto text-xs text-gray-500">
            {activeRoute.stops.map((stop, i) => (
              <React.Fragment key={stop}>
                <span className="whitespace-nowrap">{stop}</span>
                {i < activeRoute.stops.length - 1 && <span>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportView;
