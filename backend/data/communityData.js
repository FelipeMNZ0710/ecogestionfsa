const initialMessages = {
    // channelId: messages[]
    1: [ // #general
        { id: 101, user_id: 3, content: 'Hola a todos! Nueva por acá. Quería saber si alguien tiene ideas para reutilizar frascos de vidrio.', created_at: new Date(Date.now() - 1000 * 60 * 25) },
        { id: 102, user_id: 1, content: '¡Bienvenida, María! Yo los uso para guardar legumbres y especias. También como vasos o para hacer velas. 😊', reactions: {'😊': ['Carlos Giménez']}, created_at: new Date(Date.now() - 1000 * 60 * 23) },
        { id: 103, user_id: 3, content: '¡Qué buenas ideas! Gracias, Laura.', created_at: new Date(Date.now() - 1000 * 60 * 22) },
        { id: 104, user_id: 4, content: 'Che, alguien sabe si la jornada de limpieza del sábado se hace igual si llueve?', replying_to_message_id: 102, created_at: new Date(Date.now() - 1000 * 60 * 10) },
    ],
    2: [ // #dudas
        { id: 201, user_id: 2, content: 'Pregunta: ¿los tickets de supermercado van con el papel?', created_at: new Date(Date.now() - 1000 * 60 * 120) },
        { id: 202, user_id: 1, content: 'Hola Carlos! No, no van. Es papel térmico y tiene químicos que contaminan el resto del papel. Van a la basura común.', created_at: new Date(Date.now() - 1000 * 60 * 118) },
    ],
    3: [ // #anuncios
        { id: 301, user_id: 1, content: '📢 ¡Atención comunidad! Este sábado 20/07 a las 10:00 AM realizaremos una jornada de limpieza en la Plaza San Martín. ¡Los esperamos a todos con guantes y buena onda!', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    ]
};

module.exports = { initialMessages };
