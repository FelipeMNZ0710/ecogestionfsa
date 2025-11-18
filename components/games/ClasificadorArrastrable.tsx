
import React, { useEffect, useRef, useState } from "react";

// Types needed for internal logic
interface Item {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  icon: string;
}

interface Bin {
  key: string;
  label: string;
  hint: string;
  icon: string;
  colorClass: string;
  borderColor: string;
}

interface ClasificadorArrastrableProps {
    onComplete: (score: number) => void;
    userHighScore: number;
}

// Using Unsplash URLs for assets to ensure immediate functionality
const TODOS: Item[] = [
  { id: 1, nombre: "Cáscara de banana", tipo: "Orgánico", descripcion: "Los restos orgánicos se descomponen y sirven para compost.", icon: "🍌" },
  { id: 2, nombre: "Botella de vidrio", tipo: "Vidrio", descripcion: "El vidrio se recicla y se deposita en el contenedor verde.", icon: "🍾" },
  { id: 3, nombre: "Botella plástica (PET)", tipo: "Plástico", descripcion: "Las botellas PET van al contenedor de envases.", icon: "🧴" },
  { id: 4, nombre: "Lata de aluminio", tipo: "Metal", descripcion: "Las latas se reciclan y recuperan metales.", icon: "🥫" },
  { id: 5, nombre: "Pila usada", tipo: "Peligroso", descripcion: "Las pilas contienen metales tóxicos y van al punto limpio.", icon: "🔋" },
  { id: 6, nombre: "Aceite de cocina usado", tipo: "Peligroso", descripcion: "El aceite contamina y debe entregarse en puntos limpios.", icon: "🛢️" },
  { id: 7, nombre: "Cartón limpio", tipo: "PapelCarton", descripcion: "El cartón limpio se recicla en el contenedor azul.", icon: "📦" },
  { id: 8, nombre: "Jeringa", tipo: "Peligroso", descripcion: "Residuos sanitarios requieren gestión especial.", icon: "💉" },
  { id: 9, nombre: "Envoltorio de snack", tipo: "Resto", descripcion: "Plásticos mezclados no reciclables van al contenedor de Resto.", icon: "🍫" }
];

const TACHOS: Bin[] = [
  { key: "Orgánico", label: "Orgánico", hint: "Biodegradables", icon: "🍂", colorClass: "bg-orange-500/20", borderColor: "border-orange-500" },
  { key: "Plástico", label: "Plástico", hint: "Envases", icon: "🥤", colorClass: "bg-yellow-500/20", borderColor: "border-yellow-500" },
  { key: "Vidrio", label: "Vidrio", hint: "Botellas/Frascos", icon: "🍷", colorClass: "bg-green-500/20", borderColor: "border-green-500" },
  { key: "PapelCarton", label: "Papel", hint: "Cartón limpio", icon: "📰", colorClass: "bg-blue-500/20", borderColor: "border-blue-500" },
  { key: "Metal", label: "Metal", hint: "Latas/Envases", icon: "🥫", colorClass: "bg-gray-500/20", borderColor: "border-gray-500" },
  { key: "Peligroso", label: "Peligrosos", hint: "Pilas/Aceites", icon: "☣️", colorClass: "bg-red-500/20", borderColor: "border-red-500" },
  { key: "Resto", label: "Resto", hint: "No reciclable", icon: "🗑️", colorClass: "bg-slate-500/20", borderColor: "border-slate-500" }
];

const ClasificadorArrastrable: React.FC<ClasificadorArrastrableProps> = ({ onComplete, userHighScore }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [placements, setPlacements] = useState<Record<number, string>>({}); // { id: tachoKey }
  const [tachoFeedback, setTachoFeedback] = useState<Record<string, 'correct' | 'wrong' | undefined>>({}); // { tachoKey: 'correct'|'wrong' }
  const [mensaje, setMensaje] = useState<{titulo: string; texto: string; tipo: 'success' | 'danger'} | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Para soporte táctil: seleccionar elemento y luego tacho
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // timeouts ref para limpiar
  const feedbackTimeouts = useRef<Record<string, number>>({});
  const messageTimeoutRef = useRef<number | null>(null);

  // Inicializar juego
  const initializeGame = () => {
    const shuffled = [...TODOS].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setPlacements({});
    setTachoFeedback({});
    setMensaje(null);
    setDraggingId(null);
    setSelectedId(null);
    setScore(0);
    setIsFinished(false);

    // limpiar timeouts previos
    Object.values(feedbackTimeouts.current).forEach((t) => clearTimeout(t as number));
    feedbackTimeouts.current = {};
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = null;
  };

  useEffect(() => {
    initializeGame();
    return () => {
        Object.values(feedbackTimeouts.current).forEach((t) => clearTimeout(t as number));
        if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler drag start (desktop)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    try {
      e.dataTransfer.setData("text/plain", String(id));
      e.dataTransfer.effectAllowed = "move";
    } catch (err) {
      // algunos navegadores en móviles no permiten dataTransfer: fallback con state
    }
    setDraggingId(id);
    setSelectedId(id); // también marca seleccionado
  };
  const handleDragEnd = () => {
    setDraggingId(null);
  };
  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Drop en tacho (desktop)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, tachoKey: string) => {
    e.preventDefault();
    // Leer id: si no está en dataTransfer (móvil), usar selectedId
    const idStr = e.dataTransfer?.getData("text/plain");
    const id = idStr ? Number(idStr) : selectedId;
    if (!id) return;
    processPlacement(id, tachoKey);
    setDraggingId(null);
    setSelectedId(null);
  };

  // Click / touch: seleccionar tarjeta
  const handleSelectItem = (id: number) => {
    // si ya está colocado, no puede seleccionarse
    if (placements[id]) return;
    setSelectedId((prev) => (prev === id ? null : id));
  };

  // Click on bin for touch users: si hay selectedId, colocar
  const handleBinClick = (tachoKey: string) => {
    if (!selectedId) return;
    processPlacement(selectedId, tachoKey);
    setSelectedId(null);
  };

  // lógica de colocar y comprobar
  const processPlacement = (id: number, tachoKey: string) => {
    // evitar recolocar un id ya colocado (raro pero seguro)
    if (placements[id]) return;

    const item = items.find((it) => it.id === Number(id));
    if (!item) return;

    const correcto = item.tipo === tachoKey;

    // guardar colocación (inmutable)
    setPlacements((prev) => ({ ...prev, [id]: tachoKey }));

    // puntaje (solo sumar una vez)
    if (correcto) {
        setScore((s) => s + 1);
    }

    // feedback en tacho
    setTachoFeedback((prev) => ({ ...prev, [tachoKey]: correcto ? "correct" : "wrong" }));

    // mensaje explicativo
    const tLabel = TACHOS.find((t) => t.key === tachoKey)?.label ?? tachoKey;
    const titulo = correcto ? "✅ ¡Correcto!" : "❌ ¡Incorrecto!";
    const texto = correcto
      ? `${item.nombre} va en ${tLabel}. ${item.descripcion}`
      : `${item.nombre} NO va en ${tLabel}. Corresponde a ${item.tipo}.`;

    setMensaje({ titulo, texto, tipo: correcto ? "success" : "danger" });

    // limpiar mensaje en 3s
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    messageTimeoutRef.current = window.setTimeout(() => setMensaje(null), 3000);

    // limpiar feedback en 2.5s y evitar duplicados de timeout
    if (feedbackTimeouts.current[tachoKey]) {
      clearTimeout(feedbackTimeouts.current[tachoKey]);
    }
    feedbackTimeouts.current[tachoKey] = window.setTimeout(() => {
      setTachoFeedback((prev) => ({ ...prev, [tachoKey]: undefined }));
       // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete feedbackTimeouts.current[tachoKey];
    }, 2500);
  };
  
  const itemsPendientes = items.filter((it) => !placements[it.id]);
  
  useEffect(() => {
      if (items.length > 0 && itemsPendientes.length === 0 && !isFinished) {
          setIsFinished(true);
          // Give user a moment to see the final placement but trigger faster
          setTimeout(() => {
             onComplete(Math.round((score / items.length) * 100)); // Normalize score to ~100
          }, 1500);
      }
  }, [itemsPendientes.length, items.length, onComplete, score, isFinished]);

  return (
    <div className="flex flex-col h-full text-text-main animate-fade-in-up">
      <div className="flex justify-between items-center mb-4 px-4 py-2 bg-surface rounded-xl border border-white/10 shadow-sm">
        <button className="px-3 py-1 text-sm border border-white/20 rounded-lg hover:bg-white/10 transition-colors" onClick={initializeGame} aria-label="Reiniciar juego">🔄 Reiniciar</button>
        <div className="text-sm text-text-secondary text-center hidden sm:block">Arrastrá o tocá un residuo y colócalo en el tacho correcto.</div>
        <div className="text-primary font-bold text-lg">Puntaje: <span className="text-2xl">{score}</span> / {items.length}</div>
      </div>

      {mensaje && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-lg p-4 rounded-xl shadow-2xl border-l-4 flex flex-col sm:flex-row gap-2 items-center text-center sm:text-left animate-scale-in
            ${mensaje.tipo === "success" ? "bg-white text-emerald-900 border-emerald-500" : "bg-white text-red-900 border-red-500"}`}
            role="status" aria-live="assertive"
        >
          <strong className="text-lg">{mensaje.titulo}</strong>
          <span className="text-sm">{mensaje.texto}</span>
        </div>
      )}

      <section className={`p-4 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 min-h-[160px] mb-6 transition-all duration-500 ${itemsPendientes.length === 0 ? "opacity-50 grayscale" : ""}`} aria-live="polite">
        <div className="flex flex-wrap gap-3 justify-center" role="list">
          {itemsPendientes.map((it) => {
            const isSelected = selectedId === it.id;
            return (
              <div
                key={it.id}
                role="listitem"
                tabIndex={0}
                aria-grabbed={isSelected}
                className={`
                    w-36 p-3 rounded-xl bg-surface border border-white/10 shadow-md cursor-grab transition-all duration-200 flex flex-col items-center gap-2
                    ${draggingId === it.id ? "opacity-50 scale-95" : "hover:-translate-y-1 hover:shadow-lg"}
                    ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background -translate-y-1 shadow-xl" : ""}
                `}
                draggable
                onDragStart={(e) => handleDragStart(e, it.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSelectItem(it.id)}
                title="Arrástrame o tócame y luego toca un tacho"
              >
                <div className="text-4xl select-none">{it.icon}</div>
                <div className="text-center">
                  <div className="font-bold text-sm text-text-main leading-tight">{it.nombre}</div>
                  {/* Hinting type in dev/easy mode, maybe hide in production? Keeping for now as per design */}
                  {/* <div className="text-xs text-text-secondary mt-1">{it.tipo}</div> */}
                </div>
              </div>
            );
          })}

          {itemsPendientes.length === 0 && (
            <div className="text-center py-8 animate-game-pop-in">
              <div className="text-6xl mb-2">🎉</div>
              <h3 className="text-2xl font-bold text-text-main">¡Juego Terminado!</h3>
              <p className="text-text-secondary">Tu puntaje final es: <strong>{score} / {items.length}</strong></p>
              <p className="text-xs text-text-secondary mt-2">Redirigiendo...</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-4" role="list">
        {TACHOS.map((t) => {
          const feedback = tachoFeedback[t.key];
          const residuosColocados = Object.entries(placements)
            .filter(([id, placed]) => placed === t.key)
            .map(([id]) => items.find((x) => x.id === Number(id)))
            .filter((x): x is Item => !!x);

          return (
            <div key={t.key} className="flex flex-col" role="listitem">
              <div
                className={`
                    flex flex-col items-center p-4 rounded-xl border-2 bg-surface transition-all duration-300 h-full min-h-[180px]
                    ${t.borderColor}
                    ${feedback === "correct" ? "bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105" : 
                      feedback === "wrong" ? "bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-game-shake" : 
                      "hover:bg-white/5"}
                    ${selectedId ? "cursor-pointer ring-2 ring-primary/50 ring-offset-1 ring-offset-background animate-pulse" : ""}
                `}
                onDrop={(e) => handleDrop(e, t.key)}
                onDragOver={allowDrop}
                onClick={() => handleBinClick(t.key)}
                role="button"
                tabIndex={0}
                aria-label={`Tacho ${t.label}. ${t.hint}. Click para colocar si seleccionaste un residuo.`}
              >
                <div className="text-5xl mb-2 select-none">{t.icon}</div>
                <div className="text-center mb-4">
                  <div className="font-bold text-text-main">{t.label}</div>
                  <div className="text-xs text-text-secondary">{t.hint}</div>
                </div>

                <div className="flex flex-wrap gap-1 justify-center mt-auto w-full">
                  {residuosColocados.map((it) => (
                    <div key={it.id} className={`text-xs px-2 py-1 rounded-full text-white ${it.tipo === t.key ? "bg-emerald-600" : "bg-red-500"}`}>
                      {it.nombre}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default ClasificadorArrastrable;
