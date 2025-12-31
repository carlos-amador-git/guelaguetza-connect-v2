import React from 'react';
import { MapPin, Calendar, Info, PlayCircle, Camera } from 'lucide-react';
import { ViewState } from '../types';

interface HomeViewProps {
  setView: (view: ViewState) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ setView }) => {
  return (
    <div className="pb-24 animate-fade-in">
      {/* Hero Header */}
      <div className="relative h-64 bg-oaxaca-pink rounded-b-[2rem] overflow-hidden shadow-lg">
        <img 
          src="https://picsum.photos/800/600?grayscale&blur=2" 
          alt="Guelaguetza Texture" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-oaxaca-pink/90"></div>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wider mb-1 text-oaxaca-yellow">Julio 21-28, 2025</p>
          <h1 className="text-3xl font-bold leading-tight">Guelaguetza Connect</h1>
          <p className="text-white/90 text-sm mt-2">La máxima fiesta de los Oaxaqueños en tu bolsillo.</p>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between border-l-4 border-oaxaca-yellow">
          <div>
            <h3 className="font-bold text-gray-800">Próximo Evento</h3>
            <p className="text-sm text-gray-500">Desfile de Delegaciones • 17:00</p>
          </div>
          <button className="bg-oaxaca-purple text-white p-2 rounded-full hover:bg-opacity-90 transition">
             <PlayCircle size={24} />
          </button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 px-6 mt-6">
        <div 
          onClick={() => setView(ViewState.TRANSPORT)}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
        >
          <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-3">
            <MapPin size={20} />
          </div>
          <h3 className="font-bold text-gray-800">Transporte</h3>
          <p className="text-xs text-gray-500 mt-1">Rutas seguras y ETA</p>
        </div>

        <div 
          onClick={() => setView(ViewState.AR_SCANNER)}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
        >
          <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 mb-3">
            <Camera size={20} />
          </div>
          <h3 className="font-bold text-gray-800">Modo AR</h3>
          <p className="text-xs text-gray-500 mt-1">Descubre la magia</p>
        </div>

        <div 
          onClick={() => setView(ViewState.STORIES)}
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
        >
          <div className="bg-pink-100 w-10 h-10 rounded-full flex items-center justify-center text-pink-600 mb-3">
            <PlayCircle size={20} />
          </div>
          <h3 className="font-bold text-gray-800">Historias</h3>
          <p className="text-xs text-gray-500 mt-1">Momentos en vivo</p>
        </div>

        <div 
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer"
        >
          <div className="bg-yellow-100 w-10 h-10 rounded-full flex items-center justify-center text-yellow-700 mb-3">
            <Calendar size={20} />
          </div>
          <h3 className="font-bold text-gray-800">Programa</h3>
          <p className="text-xs text-gray-500 mt-1">Ver calendario</p>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="px-6 mt-8">
        <h2 className="font-bold text-lg mb-4 text-gray-800">Descubre Oaxaca</h2>
        <div className="relative rounded-xl overflow-hidden h-40 shadow-md">
          <img src="https://picsum.photos/600/300?grayscale" alt="Cultural" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="font-bold text-xl">Gastronomía</p>
              <button className="mt-2 px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs border border-white/50">
                Ver Guía
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;