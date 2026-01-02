import React, { useState } from 'react';
import { MapPin, Calendar, PlayCircle, Camera, X, ChevronRight, Utensils, Wine, Coffee, IceCream, MessageCircle, Sparkles, ShoppingBag, Radio, Ticket, Map } from 'lucide-react';
import { ViewState } from '../types';

interface HomeViewProps {
  setView: (view: ViewState) => void;
}

const GASTRO_ITEMS = [
  { name: 'Tlayudas', desc: 'Tortilla gigante con asiento, frijoles y quesillo', icon: Utensils },
  { name: 'Mezcal', desc: 'Destilado artesanal de agave oaxaqueño', icon: Wine },
  { name: 'Chocolate', desc: 'Bebida tradicional de cacao y canela', icon: Coffee },
  { name: 'Nieves', desc: 'Helados artesanales de sabores regionales', icon: IceCream },
];

const HomeView: React.FC<HomeViewProps> = ({ setView }) => {
  const [showGastroModal, setShowGastroModal] = useState(false);

  return (
    <div className="pb-24 md:pb-8 animate-fade-in">
      {/* Hero Header - Responsive */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-oaxaca-pink md:rounded-b-[2rem] lg:rounded-b-[3rem] overflow-hidden shadow-lg">
        <img
          src="https://picsum.photos/1200/600?grayscale&blur=2"
          alt="Guelaguetza Texture"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-oaxaca-pink/90"></div>
        <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 text-white">
          <p className="text-sm md:text-base font-semibold uppercase tracking-wider mb-1 text-oaxaca-yellow">Julio 21-28, 2025</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">Guelaguetza Connect</h1>
          <p className="text-white/90 text-sm md:text-base lg:text-lg mt-2 max-w-xl">La máxima fiesta de los Oaxaqueños en tu bolsillo.</p>
        </div>
      </div>

      {/* Main Content Grid - Responsive */}
      <div className="px-4 md:px-6 lg:px-8">
        {/* Next Event Card */}
        <div className="-mt-8 relative z-10 max-w-3xl">
          <div
            onClick={() => setView(ViewState.PROGRAM)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-5 flex items-center justify-between border-l-4 border-oaxaca-yellow cursor-pointer hover:shadow-lg transition active:scale-[0.98]"
          >
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 md:text-lg">Próximo Evento</h3>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Desfile de Delegaciones • 17:00</p>
            </div>
            <button className="bg-oaxaca-purple text-white p-2 md:p-3 rounded-full hover:bg-opacity-90 transition">
               <PlayCircle size={24} />
            </button>
          </div>
        </div>

        {/* Two Column Layout for Desktop */}
        <div className="mt-6 lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Actions Grid - Responsive */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                onClick={() => setView(ViewState.TRANSPORT)}
                className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition cursor-pointer hover:shadow-md"
              >
                <div className="bg-blue-100 dark:bg-blue-900/30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                  <MapPin size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Transporte</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Rutas seguras y ETA</p>
              </div>

              <div
                onClick={() => setView(ViewState.AR_SCANNER)}
                className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition cursor-pointer hover:shadow-md"
              >
                <div className="bg-purple-100 dark:bg-purple-900/30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                  <Camera size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Museo AR</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Descubre la magia</p>
              </div>

              <div
                onClick={() => setView(ViewState.STORIES)}
                className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition cursor-pointer hover:shadow-md"
              >
                <div className="bg-pink-100 dark:bg-pink-900/30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400 mb-3">
                  <PlayCircle size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Historias</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Momentos en vivo</p>
              </div>

              <div
                onClick={() => setView(ViewState.PROGRAM)}
                className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition cursor-pointer hover:shadow-md"
              >
                <div className="bg-yellow-100 dark:bg-yellow-900/30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-yellow-700 dark:text-yellow-400 mb-3">
                  <Calendar size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Programa</h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">Ver calendario</p>
              </div>
            </div>

            {/* Phase 6 Features - Responsive */}
            <div className="mt-6 md:mt-8">
              <h2 className="font-bold text-lg md:text-xl mb-4 text-gray-800 dark:text-gray-100">Nuevas Experiencias</h2>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-3 md:gap-4">
                <div
                  onClick={() => setView(ViewState.TIENDA)}
                  className="flex flex-col items-center p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl cursor-pointer hover:bg-amber-100 transition active:scale-95"
                >
                  <div className="bg-amber-500 p-2.5 md:p-3 rounded-full text-white mb-2">
                    <ShoppingBag size={18} className="md:w-5 md:h-5" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Tienda</span>
                </div>

                <div
                  onClick={() => setView(ViewState.STREAMS)}
                  className="flex flex-col items-center p-3 md:p-4 bg-red-50 dark:bg-red-900/20 rounded-xl cursor-pointer hover:bg-red-100 transition active:scale-95"
                >
                  <div className="bg-red-500 p-2.5 md:p-3 rounded-full text-white mb-2">
                    <Radio size={18} className="md:w-5 md:h-5" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">En Vivo</span>
                </div>

                <div
                  onClick={() => setView(ViewState.EXPERIENCES)}
                  className="flex flex-col items-center p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl cursor-pointer hover:bg-purple-100 transition active:scale-95"
                >
                  <div className="bg-purple-500 p-2.5 md:p-3 rounded-full text-white mb-2">
                    <Ticket size={18} className="md:w-5 md:h-5" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Tours</span>
                </div>

                <div
                  onClick={() => setView(ViewState.AR_MAP)}
                  className="flex flex-col items-center p-3 md:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl cursor-pointer hover:bg-emerald-100 transition active:scale-95"
                >
                  <div className="bg-emerald-500 p-2.5 md:p-3 rounded-full text-white mb-2">
                    <Map size={18} className="md:w-5 md:h-5" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Mapa</span>
                </div>
              </div>
            </div>

            {/* Featured Banner - Gastronomy - Responsive */}
            <div className="mt-8">
              <h2 className="font-bold text-lg md:text-xl mb-4 text-gray-800 dark:text-gray-100">Descubre Oaxaca</h2>
              <div
                onClick={() => setShowGastroModal(true)}
                className="relative rounded-xl overflow-hidden h-40 md:h-48 lg:h-56 shadow-md cursor-pointer hover:shadow-lg transition active:scale-[0.98]"
              >
                <img src="https://picsum.photos/800/400?grayscale" alt="Cultural" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
                  <div className="pl-6 md:pl-8">
                    <p className="text-oaxaca-yellow text-xs md:text-sm font-semibold uppercase tracking-wider">Guía culinaria</p>
                    <p className="font-bold text-2xl md:text-3xl lg:text-4xl text-white">Gastronomía</p>
                    <div className="mt-2 flex items-center gap-1 text-white/80 text-xs md:text-sm">
                      <span>Explorar</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Content (Desktop Only) */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-6">
              {/* Quick Stats Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Festival en Numeros</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Delegaciones</span>
                    <span className="font-bold text-oaxaca-pink">8 regiones</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Eventos</span>
                    <span className="font-bold text-oaxaca-purple">50+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Artesanos</span>
                    <span className="font-bold text-amber-500">200+</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Visitantes esperados</span>
                    <span className="font-bold text-emerald-500">100k+</span>
                  </div>
                </div>
              </div>

              {/* GuelaBot Card */}
              <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink rounded-xl p-5 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">GuelaBot</h3>
                    <p className="text-xs text-white/70">Tu asistente virtual</p>
                  </div>
                </div>
                <p className="text-sm text-white/90 mb-4">Preguntame sobre rutas, horarios, recomendaciones y mas.</p>
                <button
                  onClick={() => setView(ViewState.CHAT)}
                  className="w-full bg-white text-oaxaca-purple font-medium py-2 rounded-lg hover:bg-white/90 transition"
                >
                  Iniciar chat
                </button>
              </div>

              {/* Gastronomy Quick Links */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Gastronomía</h3>
                <div className="space-y-3">
                  {GASTRO_ITEMS.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                      <div className="bg-oaxaca-yellow/20 p-2 rounded-full">
                        <item.icon size={16} className="text-oaxaca-purple" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gastronomy Modal */}
      {showGastroModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="bg-oaxaca-purple p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Gastronomía Oaxaqueña</h3>
                <p className="text-xs text-white/70">Sabores que enamoran</p>
              </div>
              <button
                onClick={() => setShowGastroModal(false)}
                className="p-1 rounded-full hover:bg-white/20 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
              {GASTRO_ITEMS.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="bg-oaxaca-yellow/20 p-3 rounded-full">
                    <item.icon size={24} className="text-oaxaca-purple dark:text-oaxaca-yellow" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{item.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Visita la Feria del Mezcal en el CCCO y el Mercado 20 de Noviembre para probar estos deliciosos platillos.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowGastroModal(false);
                  setView(ViewState.CHAT);
                }}
                className="w-full py-3 bg-oaxaca-pink text-white rounded-xl font-medium hover:bg-opacity-90 transition"
              >
                Pregunta a GuelaBot por recomendaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating GuelaBot Button - Mobile Only */}
      <button
        onClick={() => setView(ViewState.CHAT)}
        className="md:hidden fixed bottom-24 right-4 bg-oaxaca-purple text-white p-4 rounded-full shadow-lg hover:bg-purple-800 transition-all hover:scale-110 active:scale-95 z-40 group"
      >
        <div className="relative">
          <MessageCircle size={24} />
          <Sparkles size={12} className="absolute -top-1 -right-1 text-oaxaca-yellow" />
        </div>
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Pregunta a GuelaBot
        </span>
      </button>
    </div>
  );
};

export default HomeView;
