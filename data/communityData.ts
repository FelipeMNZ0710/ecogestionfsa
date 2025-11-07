
import type { CommunityMessage } from '../types';

interface Channel {
    id: number;
    name: string;
    description: string;
    admin_only_write?: boolean;
}
interface Member {
    id: string;
    name: string;
    profile_picture_url: string | null;
    is_admin: boolean;
}

export const initialChannels: Channel[] = [
    { id: 1, name: 'general', description: 'Charlas generales' },
    { id: 2, name: 'dudas', description: 'Preguntas sobre reciclaje' },
    { id: 3, name: 'anuncios', description: 'Anuncios importantes', admin_only_write: true },
];

export const initialMembers: Member[] = [
    { id: '1', name: 'Laura Fernández', profile_picture_url: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=200&auto=format&fit=crop', is_admin: true },
    { id: '2', name: 'Carlos Giménez', profile_picture_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop', is_admin: false },
    { id: '3', name: 'María Rodriguez', profile_picture_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', is_admin: false },
    { id: '4', name: 'Javier Sosa', profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', is_admin: false },
];

const userColors = ['bg-red-200 text-red-800', 'bg-orange-200 text-orange-800', 'bg-amber-200 text-amber-800', 'bg-yellow-200 text-yellow-800', 'bg-lime-200 text-lime-800', 'bg-green-200 text-green-800', 'bg-emerald-200 text-emerald-800', 'bg-teal-200 text-teal-800', 'bg-cyan-200 text-cyan-800', 'bg-sky-200 text-sky-800', 'bg-blue-200 text-blue-800', 'bg-indigo-200 text-indigo-800', 'bg-violet-200 text-violet-800', 'bg-purple-200 text-purple-800', 'bg-fuchsia-200 text-fuchsia-800', 'bg-pink-200 text-pink-800', 'bg-rose-200 text-rose-800'];
const colorCache: Record<string, string> = {};
const getConsistentColor = (name: string) => {
    if (colorCache[name]) return colorCache[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = userColors[Math.abs(hash % userColors.length)];
    colorCache[name] = color;
    return color;
};
const getUserInitials = (name: string): string => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

export const initialMessages: Record<number, CommunityMessage[]> = {
    1: [ // general
        { id: 101, user_id: '3', user: 'María Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', avatarInitials: getUserInitials('María Rodriguez'), avatarColor: getConsistentColor('María Rodriguez'), timestamp: new Date(Date.now() - 1000 * 60 * 25), text: 'Hola a todos! Nueva por acá. Quería saber si alguien tiene ideas para reutilizar frascos de vidrio.' },
        { id: 102, user_id: '1', user: 'Laura Fernández', avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=200&auto=format&fit=crop', avatarInitials: getUserInitials('Laura Fernández'), avatarColor: getConsistentColor('Laura Fernández'), timestamp: new Date(Date.now() - 1000 * 60 * 23), text: '¡Bienvenida, María! Yo los uso para guardar legumbres y especias. También como vasos o para hacer velas. 😊', reactions: {'😊': ['Carlos Giménez']} },
        { id: 103, user_id: '3', user: 'María Rodriguez', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', avatarInitials: getUserInitials('María Rodriguez'), avatarColor: getConsistentColor('María Rodriguez'), timestamp: new Date(Date.now() - 1000 * 60 * 22), text: '¡Qué buenas ideas! Gracias, Laura.' },
        { id: 104, user_id: '4', user: 'Javier Sosa', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', avatarInitials: getUserInitials('Javier Sosa'), avatarColor: getConsistentColor('Javier Sosa'), timestamp: new Date(Date.now() - 1000 * 60 * 10), text: 'Che, alguien sabe si la jornada de limpieza del sábado se hace igual si llueve?', replyingTo: { messageId: 102, user: 'Laura Fernández', text: '¡Bienvenida, María! Yo los uso para guardar legumbres y especias...' }},
    ],
    2: [ // dudas
        { id: 201, user_id: '2', user: 'Carlos Giménez', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop', avatarInitials: getUserInitials('Carlos Giménez'), avatarColor: getConsistentColor('Carlos Giménez'), timestamp: new Date(Date.now() - 1000 * 60 * 120), text: 'Pregunta: ¿los tickets de supermercado van con el papel?' },
        { id: 202, user_id: '1', user: 'Laura Fernández', avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=200&auto=format&fit=crop', avatarInitials: getUserInitials('Laura Fernández'), avatarColor: getConsistentColor('Laura Fernández'), timestamp: new Date(Date.now() - 1000 * 60 * 118), text: 'Hola Carlos! No, no van. Es papel térmico y tiene químicos que contaminan el resto del papel. Van a la basura común.' },
    ],
    3: [ // anuncios
        { id: 301, user_id: '1', user: 'Laura Fernández', avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=200&auto=format&fit=crop', avatarInitials: getUserInitials('Laura Fernández'), avatarColor: getConsistentColor('Laura Fernández'), timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), text: '📢 ¡Atención comunidad! Este sábado 20/07 a las 10:00 AM realizaremos una jornada de limpieza en la Plaza San Martín. ¡Los esperamos a todos con guantes y buena onda!' },
    ]
};
