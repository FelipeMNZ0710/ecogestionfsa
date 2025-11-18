const locationsData = [
    {
        id: 'pv-plaza-san-martin',
        name: 'Punto Verde Plaza San Martín',
        address: 'Av. 25 de Mayo y Fontana',
        description: 'Estación de reciclaje central con contenedores para todos los materiales. Accesible las 24hs.',
        hours: 'Abierto 24hs',
        schedule: JSON.stringify([
            { days: [0, 1, 2, 3, 4, 5, 6], open: '00:00', close: '23:59' }
        ]),
        materials: JSON.stringify(['Plásticos', 'Vidrio', 'Papel/Cartón', 'Metales']),
        map_data: JSON.stringify({ id: 'pv-plaza-san-martin', name: 'Plaza San Martín', lat: -26.18489, lng: -58.17313 }),
        status: 'ok',
        check_ins: 150,
        image_urls: JSON.stringify(['https://images.unsplash.com/photo-1595278069441-2cf29d285355?q=80&w=800&auto=format&fit=crop'])
    },
    {
        id: 'pv-costanera',
        name: 'Estación Costanera',
        address: 'Av. Costanera Vuelta Fermoza',
        description: 'Punto limpio ubicado en el paseo costanero. Ideal para depositar residuos de bebidas y snacks.',
        hours: '08:00 - 22:00',
        schedule: JSON.stringify([
            { days: [0, 1, 2, 3, 4, 5, 6], open: '08:00', close: '22:00' }
        ]),
        materials: JSON.stringify(['Plásticos', 'Vidrio', 'Metales']),
        map_data: JSON.stringify({ id: 'pv-costanera', name: 'Estación Costanera', lat: -26.17854, lng: -58.16542 }),
        status: 'ok',
        check_ins: 85,
        image_urls: JSON.stringify(['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop'])
    },
    {
        id: 'pv-circuito-cinco',
        name: 'Centro Comunitario Circuito 5',
        address: 'Av. de los Constituyentes',
        description: 'Centro de recepción de reciclables y residuos electrónicos (RAEE).',
        hours: 'Lunes a Sábado 08:00 - 18:00',
        schedule: JSON.stringify([
            { days: [1, 2, 3, 4, 5, 6], open: '08:00', close: '18:00' }
        ]),
        materials: JSON.stringify(['Plásticos', 'Papel/Cartón', 'Pilas']),
        map_data: JSON.stringify({ id: 'pv-circuito-cinco', name: 'Circuito Cinco', lat: -26.15231, lng: -58.19854 }),
        status: 'maintenance',
        check_ins: 42,
        image_urls: JSON.stringify(['https://images.unsplash.com/photo-1604187351049-97201484f322?q=80&w=800&auto=format&fit=crop'])
    },
    {
        id: 'pv-la-nueva-formosa',
        name: 'EcoPunto La Nueva Formosa',
        address: 'Plaza Principal La Nueva Formosa',
        description: 'Contenedores soterrados para mayor higiene y capacidad.',
        hours: 'Abierto 24hs',
        schedule: JSON.stringify([
            { days: [0, 1, 2, 3, 4, 5, 6], open: '00:00', close: '23:59' }
        ]),
        materials: JSON.stringify(['Plásticos', 'Vidrio', 'Papel/Cartón', 'Organico']),
        map_data: JSON.stringify({ id: 'pv-la-nueva-formosa', name: 'La Nueva Formosa', lat: -26.21543, lng: -58.20431 }),
        status: 'ok',
        check_ins: 60,
        image_urls: JSON.stringify(['https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?q=80&w=800&auto=format&fit=crop'])
    },
    {
        id: 'pv-estadio-cincuentenario',
        name: 'Punto Verde Estadio Cincuentenario',
        address: 'Av. Néstor Kirchner y Antártida Argentina',
        description: 'Punto estratégico para grandes volúmenes de cartón y plástico.',
        hours: '09:00 - 20:00',
        schedule: JSON.stringify([
            { days: [1, 2, 3, 4, 5], open: '09:00', close: '20:00' }
        ]),
        materials: JSON.stringify(['Plásticos', 'Papel/Cartón']),
        map_data: JSON.stringify({ id: 'pv-estadio-cincuentenario', name: 'Estadio Cincuentenario', lat: -26.19123, lng: -58.18765 }),
        status: 'serviced',
        check_ins: 30,
        image_urls: JSON.stringify(['https://images.unsplash.com/photo-1528323273322-d81458248d40?q=80&w=800&auto=format&fit=crop'])
    }
];

module.exports = locationsData;