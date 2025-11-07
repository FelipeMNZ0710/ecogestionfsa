import type { Page } from '../types';

export interface NavInfo {
  page: Page;
  title: string;
  description: string;
}

export const navigationData: NavInfo[] = [
  { 
    page: 'home', 
    title: 'Inicio', 
    description: 'La página principal con un resumen de todo, estadísticas de impacto y preguntas frecuentes.' 
  },
  { 
    page: 'como-reciclar', 
    title: 'Cómo Reciclar', 
    description: 'Una guía detallada sobre qué materiales se pueden reciclar (papel, plástico, vidrio, metal) y cómo separarlos correctamente.' 
  },
  { 
    page: 'puntos-verdes', 
    title: 'Puntos Verdes', 
    description: 'Un mapa interactivo y un listado para encontrar los centros de reciclaje más cercanos en la ciudad.' 
  },
  { 
    page: 'juegos', 
    title: 'Juegos', 
    description: 'Juegos interactivos para aprender sobre reciclaje de forma divertida. Ideal si el usuario quiere aprender jugando.' 
  },
  { 
    page: 'noticias', 
    title: 'Noticias', 
    description: 'Las últimas noticias, eventos y novedades sobre reciclaje y sostenibilidad en Formosa.' 
  },
  { 
    page: 'comunidad', 
    title: 'Comunidad', 
    description: 'Un espacio de chat, similar a un foro o Discord, para que los usuarios hablen con otros miembros, chateen, hagan preguntas, compartan ideas y proyectos sobre reciclaje.' 
  },
  { 
    page: 'contacto', 
    title: 'Contacto', 
    description: 'Un formulario para que los usuarios puedan ponerse en contacto con el equipo de EcoGestión.' 
  },
];