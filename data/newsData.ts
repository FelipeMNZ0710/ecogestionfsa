import type { NewsArticle } from '../types';

export const initialNews: NewsArticle[] = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1588562086228-4cca7308761e?q=80&w=800&auto=format&fit=crop',
        category: 'Iniciativas Locales',
        title: 'Nueva Planta de Reciclaje Abre sus Puertas en Formosa',
        date: '2024-07-15',
        excerpt: 'La ciudad da un paso gigante hacia la sostenibilidad con la inauguración de una moderna planta de clasificación de residuos sólidos urbanos.',
        content: [
            { id: 'n1-c1', type: 'text', text: 'En un evento celebrado esta mañana, autoridades locales y provinciales inauguraron la nueva Planta de Clasificación de Residuos, un proyecto clave para la estrategia de gestión ambiental de Formosa. Se espera que la planta procese hasta 50 toneladas de residuos diarios, separando plásticos, cartón, vidrio y metales para su posterior reciclaje.' },
            { id: 'n1-c2', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1599667633245-02194c7722b4?q=80&w=600&auto=format&fit=crop', mimeType: 'image/jpeg' },
            { id: 'n1-c3', type: 'text', text: 'El intendente destacó que "esta planta no solo reduce el impacto ambiental de nuestros residuos, sino que también genera nuevos puestos de trabajo y fomenta una economía circular en la región".' },
            { id: 'n1-c4', type: 'list', items: ['Capacidad de 50 toneladas/día.', 'Creación de 30 empleos directos.', 'Tecnología de clasificación óptica.', 'Punto de recepción para residuos electrónicos.'] }
        ],
        featured: true,
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1595278069441-2cf29d285355?q=80&w=800&auto=format&fit=crop',
        category: 'Consejos',
        title: '5 Consejos para Reducir el Plástico de un Solo Uso',
        date: '2024-07-10',
        excerpt: 'Pequeños cambios en tu día a día pueden tener un gran impacto en la reducción de la contaminación por plásticos. ¡Aquí te mostramos cómo empezar!',
        content: [
            { id: 'n2-c1', type: 'text', text: 'El plástico de un solo uso es uno de los mayores contaminantes de nuestro planeta. Reducir su consumo es más fácil de lo que piensas. Aquí te dejamos cinco consejos prácticos:' },
            { id: 'n2-c2', type: 'list', items: [
                'Lleva siempre una bolsa de tela reutilizable para tus compras.',
                'Usa una botella de agua recargable en lugar de comprar botellas descartables.',
                'Di "no, gracias" a los sorbetes de plástico en bares y restaurantes.',
                'Prefiere comprar productos a granel para evitar empaques innecesarios.',
                'Opta por envases de vidrio o metal, que son infinitamente reciclables.'
            ]}
        ],
        featured: false,
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1620221312301-348e3a740150?q=80&w=800&auto=format&fit=crop',
        category: 'Eventos',
        title: 'Jornada de Limpieza en la Costanera: Un Éxito Comunitario',
        date: '2024-07-05',
        excerpt: 'Más de 200 voluntarios se reunieron el pasado sábado para participar en una masiva jornada de limpieza en las orillas de la Costanera de Formosa.',
        content: [
            { id: 'n3-c1', type: 'text', text: 'Convocados por EcoGestión y otras organizaciones locales, más de 200 vecinos de todas las edades se dieron cita el sábado por la mañana para limpiar un tramo de 2 kilómetros de la Costanera. En total, se recolectaron más de 800 kg de residuos, de los cuales una gran parte fue separada para su reciclaje.' },
            { id: 'n3-c2', type: 'text', text: '"Es increíble ver lo que podemos lograr cuando trabajamos juntos", comentó una de las voluntarias. "Ver la costa limpia nos da esperanza y nos motiva a seguir cuidando lo nuestro".' }
        ],
        featured: false,
    },
    {
        id: 4,
        image: 'https://images.unsplash.com/photo-1542037104857-e93b0fe58476?q=80&w=800&auto=format&fit=crop',
        category: 'Guías',
        title: 'El Arte del Compostaje: Convierte Residuos en Vida',
        date: '2024-06-28',
        excerpt: 'Aprende a transformar tus residuos orgánicos de la cocina en un abono rico en nutrientes para tus plantas y jardín. ¡Es fácil y muy beneficioso!',
        content: [
            { id: 'n4-c1', type: 'text', text: '¿Sabías que casi el 50% de la basura que generamos en casa es orgánica? El compostaje es la solución perfecta para estos residuos. No solo reduces tu basura, sino que creas un fertilizante natural de alta calidad.' },
            { id: 'n4-c2', type: 'list', items: [
                '¿Qué compostar?: Cáscaras de frutas y verduras, yerba, café, cáscaras de huevo y hojas secas.',
                '¿Qué evitar?: Carnes, lácteos, aceites y alimentos cocinados.',
                'El secreto: Mantener un equilibrio entre materiales "húmedos" (verdes) y "secos" (marrones) y airear la mezcla regularmente.'
            ]}
        ],
        featured: false,
    },
    {
        id: 5,
        image: 'https://images.unsplash.com/photo-1566576912321-d58674a27524?q=80&w=800&auto=format&fit=crop',
        category: 'Novedades',
        title: 'EcoGestión Lanza Nuevos Juegos Educativos',
        date: '2024-06-20',
        excerpt: '¡Aprender a reciclar nunca fue tan divertido! Descubre nuestra nueva colección de juegos interactivos y gana EcoPuntos mientras pones a prueba tus conocimientos.',
        content: [
            { id: 'n5-c1', type: 'text', text: 'Con el objetivo de hacer la educación ambiental más accesible y entretenida para todas las edades, hemos lanzado una nueva serie de juegos en nuestra plataforma. Ahora puedes encontrar trivias, juegos de memoria, y desafíos de clasificación que te ayudarán a convertirte en un experto del reciclaje.' },
            { id: 'n5-c2', type: 'text', text: 'Cada juego completado te recompensa con EcoPuntos que suman a tu perfil. ¡Compite con tus amigos y demuestra quién es el mayor campeón del reciclaje en Formosa!' }
        ],
        featured: false,
    },
];