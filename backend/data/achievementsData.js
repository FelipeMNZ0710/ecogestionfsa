

const allAchievements = [
    // --- ECOPUNTOS ---
    { id: '1', name: 'Eco-Aprendiz', description: 'Gana tus primeros 100 EcoPuntos.', icon: '🎓', unlockCondition: { type: 'points', value: 100 } },
    { id: '2', name: 'Guardián del Plástico', description: 'Alcanza 500 EcoPuntos.', icon: '🧴', unlockCondition: { type: 'points', value: 500 } },
    { id: '3', name: 'Campeón del Reciclaje', description: 'Alcanza 1,000 EcoPuntos.', icon: '🏆', unlockCondition: { type: 'points', value: 1000 } },
    { id: '4', name: 'Héroe de la Sostenibilidad', description: 'Alcanza 2,500 EcoPuntos.', icon: '🦸', unlockCondition: { type: 'points', value: 2500 } },
    { id: '5', name: 'Maestro del Medio Ambiente', description: 'Alcanza 5,000 EcoPuntos.', icon: '🌳', unlockCondition: { type: 'points', value: 5000 } },
    { id: '6', name: 'Leyenda Ecológica', description: 'Alcanza 10,000 EcoPuntos.', icon: '🌟', unlockCondition: { type: 'points', value: 10000 } },

    // --- PUNTOS VERDES ---
    { id: '7', name: 'Primeros Pasos', description: 'Visita tu primer Punto Verde.', icon: '👣', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 1 } },
    { id: '8', name: 'Explorador Urbano', description: 'Visita 3 Puntos Verdes diferentes.', icon: '🗺️', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 3 } },
    { id: '9', name: 'Conocedor de la Ciudad', description: 'Visita 5 Puntos Verdes diferentes.', icon: '🏙️', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 5 } },
    { id: '10', name: 'Turista del Reciclaje', description: 'Visita 10 Puntos Verdes diferentes.', icon: '🎒', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 10 } },
    { id: '11', name: 'Ojo de Águila', description: 'Haz tu primer reporte de un Punto Verde.', icon: '👀', unlockCondition: { type: 'stat', stat: 'reportsMade', value: 1 } },
    { id: '12', name: 'Colaborador Constante', description: 'Haz 5 reportes de Puntos Verdes.', icon: '🛠️', unlockCondition: { type: 'stat', stat: 'reportsMade', value: 5 } },
    { id: '13', name: 'Vigilante Cívico', description: 'Haz 10 reportes de Puntos Verdes.', icon: '🧐', unlockCondition: { type: 'stat', stat: 'reportsMade', value: 10 } },
    { id: '14', name: 'Guardián de los Puntos', description: 'Haz 25 reportes de Puntos Verdes.', icon: '🛡️', unlockCondition: { type: 'stat', stat: 'reportsMade', value: 25 } },

    // --- COMUNIDAD ---
    { id: '15', name: 'Voz de la Comunidad', description: 'Envía tu primer mensaje.', icon: '🗣️', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 1 } },
    { id: '16', name: 'Miembro Activo', description: 'Envía 10 mensajes en la comunidad.', icon: '💬', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 10 } },
    { id: '17', name: 'Pilar de la Comunidad', description: 'Envía 50 mensajes en la comunidad.', icon: '🏛️', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 50 } },
    { id: '18', name: 'Influencer Local', description: 'Envía 100 mensajes en la comunidad.', icon: '📣', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 100 } },
    { id: '19', name: 'Comunicador Nato', description: 'Envía 250 mensajes en la comunidad.', icon: '🎙️', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 250 } },
    { id: '20', name: 'Alma del Chat', description: 'Envía 500 mensajes en la comunidad.', icon: '💖', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 500 } },

    // --- LOGIN ---
    { id: '21', name: 'Bienvenida', description: 'Inicia sesión por primera vez.', icon: '👋', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 1 } },
    { id: '22', name: 'Compromiso Diario', description: 'Inicia sesión 3 días seguidos.', icon: '🗓️', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 3 } },
    { id: '23', name: 'Maestro Compostador', description: 'Inicia sesión 5 días seguidos.', icon: '🌱', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 5 } },
    { id: '24', name: 'Hábito Verde', description: 'Inicia sesión durante una semana (7 días).', icon: '📅', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 7 } },
    { id: '25', name: 'Constancia Ecológica', description: 'Inicia sesión durante 15 días.', icon: '📆', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 15 } },
    { id: '26', name: 'Rutina Sostenible', description: 'Inicia sesión durante 30 días.', icon: '🔄', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 30 } },
    { id: '27', name: 'Parte del Paisaje', description: 'Inicia sesión durante 60 días.', icon: '🏞️', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 60 } },
    { id: '28', name: 'Veterano de EcoGestión', description: 'Inicia sesión durante 100 días.', icon: '🎖️', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 100 } },

    // --- QUIZZES (CÓMO RECICLAR) ---
    { id: '29', name: 'Eco-Estudiante', description: 'Completa tu primer cuestionario.', icon: '🧠', unlockCondition: { type: 'stat', stat: 'quizzesCompleted', value: 1 } },
    { id: '30', name: 'Dúo Dinámico', description: 'Completa 2 cuestionarios.', icon: '✌️', unlockCondition: { type: 'stat', stat: 'quizzesCompleted', value: 2 } },
    { id: '31', name: 'Sabelotodo del Reciclaje', description: 'Completa todos los cuestionarios de la guía.', icon: '🧑‍🏫', unlockCondition: { type: 'stat', stat: 'quizzesCompleted', value: 4 } },

    // --- JUEGOS ---
    { id: '32', name: '¡A Jugar!', description: 'Juega tu primer juego.', icon: '🎮', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 1 } },
    { id: '33', name: 'Jugador Casual', description: 'Juega 5 juegos.', icon: '🕹️', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 5 } },
    { id: '34', name: 'Gamer Ecológico', description: 'Juega 10 juegos.', icon: '👾', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 10 } },
    { id: '35', name: 'Aficionado a los Juegos', description: 'Juega 25 juegos.', icon: '🎲', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 25 } },
    { id: '36', name: 'Maestro de los Juegos', description: 'Juega 50 juegos.', icon: '👑', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 50 } },
    { id: '37', name: 'Leyenda Lúdica', description: 'Juega 100 juegos.', icon: '🏅', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 100 } },

    // --- TIERS DE PUNTOS (adicionales) ---
    { id: '38', name: 'Punto de Partida', description: 'Alcanza 250 EcoPuntos.', icon: '📈', unlockCondition: { type: 'points', value: 250 } },
    { id: '39', name: 'Acumulador', description: 'Alcanza 750 EcoPuntos.', icon: '💰', unlockCondition: { type: 'points', value: 750 } },
    { id: '40', name: 'Impulso Verde', description: 'Alcanza 1500 EcoPuntos.', icon: '🚀', unlockCondition: { type: 'points', value: 1500 } },
    { id: '41', name: 'Fuerza de la Naturaleza', description: 'Alcanza 3500 EcoPuntos.', icon: '🌪️', unlockCondition: { type: 'points', value: 3500 } },
    { id: '42', name: 'Corazón Verde', description: 'Alcanza 7500 EcoPuntos.', icon: '💚', unlockCondition: { type: 'points', value: 7500 } },

    // --- TIERS DE PUNTOS VERDES (adicionales) ---
    { id: '43', name: 'Aventurero', description: 'Visita 15 Puntos Verdes.', icon: '🧭', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 15 } },
    { id: '44', name: 'Cartógrafo Cívico', description: 'Visita 25 Puntos Verdes.', icon: '📜', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 25 } },
    { id: '45', name: 'Rey de la Ruta', description: 'Visita 50 Puntos Verdes.', icon: '🚚', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 50 } },

    // --- TIERS DE REPORTES (adicionales) ---
    { id: '46', name: 'Inspector Dedicado', description: 'Haz 50 reportes.', icon: '🕵️', unlockCondition: { type: 'stat', stat: 'reportsMade', value: 50 } },
    { id: '47', name: 'Centinela de la Ciudad', description: 'Haz 100 reportes.', icon: '🏯', unlockCondition: { type: 'stat', stat: 'reportsMade', value: 100 } },
    
    // --- TIERS DE MENSAJES (adicionales) ---
    { id: '48', name: 'Orador Persistente', description: 'Envía 750 mensajes.', icon: '🪧', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 750 } },
    { id: '49', name: 'Cronista de la Comunidad', description: 'Envía 1000 mensajes.', icon: '✒️', unlockCondition: { type: 'stat', stat: 'messagesSent', value: 1000 } },

    // --- TIERS DE LOGIN (adicionales) ---
    { id: '50', name: 'Siempre Presente', description: 'Inicia sesión durante 150 días.', icon: '🗿', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 150 } },
    { id: '51', name: 'Icono de EcoGestión', description: 'Inicia sesión durante 200 días.', icon: '🏆', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 200 } },
    { id: '52', name: 'Parte de la Familia', description: 'Inicia sesión durante 365 días.', icon: '👨‍👩‍👧‍👦', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 365 } },
    
    // --- TIERS DE JUEGOS (adicionales) ---
    { id: '53', name: 'Virtuoso de los Juegos', description: 'Juega 200 juegos.', icon: '🎻', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 200 } },
    { id: '54', name: 'Gran Maestro Lúdico', description: 'Juega 500 juegos.', icon: '♟️', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 500 } },

    // --- COMBINACIONES / HITOS ---
    { id: '55', name: 'Triple Amenaza', description: 'Visita un Punto Verde, envía un mensaje y juega un juego.', icon: '♻️', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 1 } }, // Se podría mejorar la condición
    { id: '56', name: 'Participante Completo', description: 'Completa un cuestionario y haz un reporte.', icon: '✅', unlockCondition: { type: 'stat', stat: 'quizzesCompleted', value: 1 } }, // Se podría mejorar
    { id: '57', name: 'Semana Perfecta', description: 'Inicia sesión 7 días y envía 7 mensajes.', icon: '💯', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 7 } },
    { id: '58', name: 'Estudiante y Jugador', description: 'Completa un quiz y juega 3 juegos.', icon: '👨‍🎓', unlockCondition: { type: 'stat', stat: 'quizzesCompleted', value: 1 } },
    { id: '59', name: 'Guardián del Saber', description: 'Completa todos los quizzes y envía 20 mensajes.', icon: '🦉', unlockCondition: { type: 'stat', stat: 'quizzesCompleted', value: 4 } },
    { id: '60', name: 'Compromiso Total', description: 'Visita 10 puntos, haz 10 reportes y envía 100 mensajes.', icon: '🤝', unlockCondition: { type: 'stat', stat: 'pointsVisited', value: 10 } },

    // --- NIVELES DE PUNTOS ADICIONALES ---
    { id: '61', name: 'Élite Ecológica', description: 'Alcanza 15,000 EcoPuntos.', icon: '💎', unlockCondition: { type: 'points', value: 15000 } },
    { id: '62', name: 'Semidiós del Reciclaje', description: 'Alcanza 20,000 EcoPuntos.', icon: '🔱', unlockCondition: { type: 'points', value: 20000 } },
    { id: '63', name: 'Titán de la Tierra', description: 'Alcanza 25,000 EcoPuntos.', icon: '🌍', unlockCondition: { type: 'points', value: 25000 } },
    { id: '64', name: 'Guardián Galáctico', description: 'Alcanza 50,000 EcoPuntos.', icon: '🌌', unlockCondition: { type: 'points', value: 50000 } },

    // --- MAS LOGROS DE INTERACCIÓN ---
    { id: '65', name: 'Especialista en Papel', description: 'Completa el cuestionario de Papel/Cartón.', icon: '📜', unlockCondition: { type: 'stat', stat: 'completedQuizzes', value: 1 } },
    { id: '66', name: 'Experto en Plásticos', description: 'Completa el cuestionario de Plásticos.', icon: '🥤', unlockCondition: { type: 'stat', stat: 'completedQuizzes', value: 1 } },
    { id: '67', name: 'Maestro del Vidrio', description: 'Completa el cuestionario de Vidrios.', icon: '🍾', unlockCondition: { type: 'stat', stat: 'completedQuizzes', value: 1 } },
    { id: '68', name: 'Profesional de Metales', description: 'Completa el cuestionario de Metales.', icon: '🥫', unlockCondition: { type: 'stat', stat: 'completedQuizzes', value: 1 } },
    
    // --- LOGROS DE JUEGOS ESPECÍFICOS (conceptuales, la lógica no lo soporta aún)
    { id: '69', name: 'Cerebrito', description: 'Gana una partida de Trivia sin errores.', icon: '🤓', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 2 } }, // Simulado
    { id: '70', name: 'Memoria de Elefante', description: 'Completa un juego de Memoria en menos de 10 intentos.', icon: '🐘', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 4 } }, // Simulado
    { id: '71', name: 'Clasificador Veloz', description: 'Clasifica 10 ítems correctamente en el juego de Clasificar.', icon: '⚡', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 6 } }, // Simulado
    { id: '72', name: 'Maestro Lingüista', description: 'Gana 3 partidas de Ahorcado.', icon: '✍️', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 8 } }, // Simulado
    { id: '73', name: 'Manos Rápidas', description: 'Alcanza un combo de x5 en la Cadena de Reciclaje.', icon: '🖐️', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 12 } }, // Simulado
    { id: '74', name: 'Atrapador Experto', description: 'Consigue 200 puntos en Atrapa el Reciclable.', icon: '🎯', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 15 } }, // Simulado
    { id: '75', name: 'Manitas', description: 'Repara 5 objetos seguidos en ¡Repáralo!.', icon: '🔧', unlockCondition: { type: 'stat', stat: 'gamesPlayed', value: 18 } }, // Simulado

    // --- MAS LOGROS DE INTERACCIÓN GENERAL
    { id: '76', name: 'Madrugador', description: 'Inicia sesión 3 veces antes de las 8 AM.', icon: '🌅', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 4 } }, // Simulado
    { id: '77', name: 'Noctámbulo', description: 'Inicia sesión 3 veces después de medianoche.', icon: '🦉', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 6 } }, // Simulado
    { id: '78', name: 'Fin de Semana Verde', description: 'Inicia sesión un Sábado y un Domingo.', icon: '🏞️', unlockCondition: { type: 'stat', stat: 'dailyLogins', value: 2 } },
    { id: '79', name: 'Curioso', description: 'Usa el identificador de IA por primera vez.', icon: '📸', unlockCondition: { type: 'stat', stat: 'objectsIdentified', value: 1 } },
    { id: '80', name: 'Fotógrafo Ecológico', description: 'Usa el identificador de IA 5 veces.', icon: '📷', unlockCondition: { type: 'stat', stat: 'objectsIdentified', value: 5 } },
    { id: '81', name: 'Detective de Residuos', description: 'Usa el identificador de IA 10 veces.', icon: '🕵️‍♀️', unlockCondition: { type: 'stat', stat: 'objectsIdentified', value: 10 } },

    // --- LOGROS DE PUNTOS (MAS NIVELES INTERMEDIOS)
    { id: '82', name: 'Bronce I', description: 'Alcanza 125 puntos.', icon: '🥉', unlockCondition: { type: 'points', value: 125 } },
    { id: '83', name: 'Bronce II', description: 'Alcanza 250 puntos.', icon: '🥉', unlockCondition: { type: 'points', value: 250 } },
    { id: '84', name: 'Bronce III', description: 'Alcanza 375 puntos.', icon: '🥉', unlockCondition: { type: 'points', value: 375 } },
    { id: '85', name: 'Plata I', description: 'Alcanza 625 puntos.', icon: '🥈', unlockCondition: { type: 'points', value: 625 } },
    { id: '86', name: 'Plata II', description: 'Alcanza 750 puntos.', icon: '🥈', unlockCondition: { type: 'points', value: 750 } },
    { id: '87', name: 'Plata III', description: 'Alcanza 875 puntos.', icon: '🥈', unlockCondition: { type: 'points', value: 875 } },
    { id: '88', name: 'Oro I', description: 'Alcanza 1250 puntos.', icon: '🥇', unlockCondition: { type: 'points', value: 1250 } },
    { id: '89', name: 'Oro II', description: 'Alcanza 1500 puntos.', icon: '🥇', unlockCondition: { type: 'points', value: 1500 } },
    { id: '90', name: 'Oro III', description: 'Alcanza 1750 puntos.', icon: '🥇', unlockCondition: { type: 'points', value: 1750 } },
    { id: '91', name: 'Platino I', description: 'Alcanza 3000 puntos.', icon: '💠', unlockCondition: { type: 'points', value: 3000 } },
    { id: '92', name: 'Platino II', description: 'Alcanza 4000 puntos.', icon: '💠', unlockCondition: { type: 'points', value: 4000 } },
    { id: '93', name: 'Platino III', description: 'Alcanza 5000 puntos.', icon: '💠', unlockCondition: { type: 'points', value: 5000 } },
    { id: '94', name: 'Diamante I', description: 'Alcanza 8000 puntos.', icon: '💎', unlockCondition: { type: 'points', value: 8000 } },
    { id: '95', name: 'Diamante II', description: 'Alcanza 12000 puntos.', icon: '💎', unlockCondition: { type: 'points', value: 12000 } },
    { id: '96', name: 'Diamante III', description: 'Alcanza 16000 puntos.', icon: '💎', unlockCondition: { type: 'points', value: 16000 } },
    { id: '97', name: 'Maestro I', description: 'Alcanza 30000 puntos.', icon: '🏆', unlockCondition: { type: 'points', value: 30000 } },
    { id: '98', name: 'Maestro II', description: 'Alcanza 40000 puntos.', icon: '🏆', unlockCondition: { type: 'points', value: 40000 } },
    { id: '99', name: 'Maestro III', description: 'Alcanza 50000 puntos.', icon: '🏆', unlockCondition: { type: 'points', value: 50000 } },
    { id: '100', name: 'Aspirante a Leyenda', description: 'Alcanza 75000 puntos.', icon: '✨', unlockCondition: { type: 'points', value: 75000 } }
];

module.exports = { allAchievements };