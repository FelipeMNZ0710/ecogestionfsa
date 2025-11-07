import type { Material } from '../types';

export const sabiasQueData: Record<Material, string[]> = {
    papel: [
        "Reciclar una tonelada de papel salva aproximadamente 17 árboles y 26,500 litros de agua.",
        "Fabricar papel a partir de material reciclado consume un 50% menos de agua y un 60% menos de energía que hacerlo desde cero.",
        "El cartón corrugado tiene una de las tasas de reciclaje más altas, superando el 90% en muchos países."
    ],
    plastico: [
        "Una sola botella de plástico puede tardar entre 100 y 1,000 años en descomponerse en la naturaleza.",
        "A nivel mundial, solo alrededor del 9% de todos los residuos plásticos generados han sido reciclados.",
        "Con 25 botellas de plástico (PET) recicladas se puede fabricar una remera de talle adulto."
    ],
    vidrio: [
        "El vidrio es 100% reciclable y puede ser reciclado infinitas veces sin perder calidad ni pureza.",
        "Reciclar una botella de vidrio ahorra suficiente energía como para mantener encendida una bombilla de 100 vatios durante 4 horas.",
        "El vidrio reciclado se funde a una temperatura más baja que la materia prima virgen, lo que reduce el consumo de energía en un 40%."
    ],
    metales: [
        "El aluminio puede reciclarse indefinidamente. Se estima que el 75% de todo el aluminio producido en la historia todavía está en uso hoy.",
        "Reciclar una sola lata de aluminio ahorra el 95% de la energía necesaria para producir una nueva desde cero.",
        "El acero es el material más reciclado del planeta, principalmente porque sus propiedades magnéticas facilitan su separación de otros residuos."
    ],
    organico: [
        "Casi el 50% de la basura que generamos en nuestros hogares es materia orgánica que podría ser compostada.",
        "El compostaje reduce significativamente la emisión de metano, un gas de efecto invernadero 25 veces más potente que el dióxido de carbono.",
        "El abono resultante del compost mejora la estructura del suelo, ayuda a retener la humedad y reduce la necesidad de fertilizantes químicos."
    ]
};