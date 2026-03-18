export interface ArtesaniaItem {
  id: string;
  nombre: string;
  descripcion: string;
  region: string;
  glb: string;
}

// Sección 1: Artesanías de Alta Calidad (Sketchfab, optimizados con Draco+WebP)
export const ARTESANIAS_PREMIUM: ArtesaniaItem[] = [
  { id: 'oso-alebrije', nombre: 'Oso Alebrije', descripcion: 'Oso alebrije monumental con patrón de escamas y colores intensos', region: 'Valles Centrales', glb: '/artesanias/oso-alebrije.glb' },
  { id: 'alebrije-clasico', nombre: 'Alebrije Clásico', descripcion: 'Alebrije tradicional oaxaqueño con patrones multicolor y formas fantásticas', region: 'Valles Centrales', glb: '/artesanias/alebrije-clasico.glb' },
  { id: 'gato-alebrije', nombre: 'Gato Alebrije', descripcion: 'Gato alebrije con cuerpo estilizado y patrones vibrantes pintados a mano', region: 'Valles Centrales', glb: '/artesanias/gato-alebrije.glb' },
  { id: 'welf', nombre: 'Alebrije Dragón', descripcion: 'Dragón alebrije con rasgos fantásticos y colores vibrantes', region: 'Valles Centrales', glb: '/artesanias/welf.glb' },
  { id: 'alebrije-mistico', nombre: 'Alebrije Místico', descripcion: 'Alebrije místico con formas orgánicas y acabado artesanal policromado', region: 'Valles Centrales', glb: '/artesanias/alebrije-mistico.glb' },
  { id: 'gallina-de-barro', nombre: 'Gallina de Barro', descripcion: 'Gallina artesanal de barro policromado, tradición alfarera oaxaqueña', region: 'Valles Centrales', glb: '/artesanias/gallina-de-barro.glb' },
  { id: 'gato-de-barro', nombre: 'Gato de Barro', descripcion: 'Gato decorativo de barro negro, técnica ancestral de San Bartolo Coyotepec', region: 'Valles Centrales', glb: '/artesanias/gato-de-barro.glb' },
  { id: 'petate-tradicional', nombre: 'Petate Tradicional', descripcion: 'Petate tejido a mano con fibra de palma, artesanía textil de la Sierra Sur', region: 'Sierra Sur', glb: '/artesanias/petate-tradicional.glb' },
  { id: 'sol-y-luna', nombre: 'Sol y Luna', descripcion: 'Decoración mural de sol y luna en cerámica pintada, ícono del arte popular oaxaqueño', region: 'Costa Oaxaqueña', glb: '/artesanias/sol-y-luna.glb' },
  { id: 'urna-zapoteca', nombre: 'Urna Funeraria Zapoteca', descripcion: 'Urna funeraria zapoteca del periodo 600-900 d.C., pieza arqueológica representativa de Monte Albán', region: 'Valles Centrales', glb: '/artesanias/urna-zapoteca.glb' },
  { id: 'lagartija-alebrije', nombre: 'Lagartija Alebrije', descripcion: 'Lagartija alebrije con cuerpo alargado y patrones geométricos policromados', region: 'Valles Centrales', glb: '/artesanias/lagartija-alebrije.glb' },
  { id: 'mascota-alebrije', nombre: 'Mascota Alebrije', descripcion: 'Alebrije mascota animado con movimiento y patrones coloridos', region: 'Valles Centrales', glb: '/artesanias/mascota-alebrije.glb' },
];

// Sección 2: Vitrina de Alebrijes (generados con TRELLIS IA)
export const VITRINA_TRELLIS: ArtesaniaItem[] = [
  { id: 'conejo-guelaguetza', nombre: 'Conejo Guelaguetza', descripcion: 'Conejo alebrije con patrones geométricos neon, inspirado en la Guelaguetza oaxaqueña', region: 'Valles Centrales', glb: '/artesanias/conejo-guelaguetza.glb' },
  { id: 'jaguar', nombre: 'Jaguar', descripcion: 'Jaguar alebrije con patrones geométricos turquesa y magenta', region: 'Valles Centrales', glb: '/artesanias/jaguar.glb' },
  { id: 'mascara-de-danza', nombre: 'Máscara de Danza', descripcion: 'Máscara ceremonial oaxaqueña tallada en madera con patrones zapotecas', region: 'Sierra Norte', glb: '/artesanias/mascara-de-danza.glb' },
  { id: 'alebrije-2', nombre: 'Alebrije Híbrido', descripcion: 'Colibrí híbrido alebrije con alas extendidas y patrones vibrantes', region: 'Valles Centrales', glb: '/artesanias/alebrije-2.glb' },
  { id: 'ajolote', nombre: 'Ajolote', descripcion: 'Axolotl alebrije con branquias y patrones neon', region: 'Valles Centrales', glb: '/artesanias/ajolote.glb' },
  { id: 'colibri', nombre: 'Colibrí', descripcion: 'Colibrí alebrije con alas desplegadas y patrones esmeralda', region: 'Valles Centrales', glb: '/artesanias/colibri.glb' },
  { id: 'mezcal-oaxaca', nombre: 'Mezcal Oaxaca', descripcion: 'Botella artesanal de mezcal con etiqueta de alebrije', region: 'Valles Centrales', glb: '/artesanias/mezcal-oaxaca.glb' },
  { id: 'pina', nombre: 'Piña Guelaguetza', descripcion: 'Piña decorativa con patrones de la Guelaguetza oaxaqueña', region: 'Valles Centrales', glb: '/artesanias/pina.glb' },
  { id: 'pan-y-chocolate', nombre: 'Pan y Chocolate', descripcion: 'Pan artesanal oaxaqueño con chocolate de mesa', region: 'Valles Centrales', glb: '/artesanias/pan-y-chocolate.glb' },
];

// Exportar todo combinado (para compatibilidad)
export const ARTESANIAS: ArtesaniaItem[] = [...ARTESANIAS_PREMIUM, ...VITRINA_TRELLIS];
