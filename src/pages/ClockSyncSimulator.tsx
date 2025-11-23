// ============================================================================
// SIMULADOR DE SINCRONIZACIÓN DE RELOJES
// ============================================================================

/**
 * Este componente implementa simuladores visuales de algoritmos de
 * sincronización de relojes en sistemas distribuidos.
 *
 * ALGORITMOS IMPLEMENTADOS:
 * 1. Cristian: Sincronización cliente-servidor basada en RTT
 * 2. Berkeley: Sincronización por promediación con coordinador
 *
 * - Visualizar cómo los nodos sincronizan sus relojes
 * - Mostrar el papel del RTT en Cristian
 * - Demostrar el cálculo de promedio en Berkeley
 * - Ilustrar los ajustes de offset para lograr sincronización
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Panel from "../components/Panel";

// ============================================================================
// TIPOS Y ESTRUCTURAS DE DATOS
// ============================================================================

/**
 * Tipo de algoritmo de sincronización
 * - cristian: Cliente-servidor con RTT
 * - berkeley: Coordinador con promedio
 */
type ClockAlgorithm = "cristian" | "berkeley";

/**
 * Nodo de reloj en el sistema distribuido
 *
 * CAMPOS:
 * - id: Identificador único (0 = servidor/coordinador)
 * - horaLocal: Tiempo local del nodo en milisegundos desde epoch
 * - offsetInicial: Desajuste inicial aleatorio (-3000 a +3000 ms)
 * - offsetActual: Ajuste acumulado aplicado por los algoritmos
 * - failed: Indica si el nodo está caído (no implementado actualmente)
 * - highlighted: Estado visual cuando participa en un paso
 * - role: Función del nodo (server/coordinator/client)
 * - rtt: Round Trip Time (solo en Cristian)
 */
interface ClockNode {
  id: number;
  horaLocal: number;
  offsetInicial: number;
  offsetActual: number;
  failed: boolean;
  highlighted?: boolean;
  role?: "server" | "coordinator" | "client";
  rtt?: number;
}

/**
 * Mensaje intercambiado entre nodos
 *
 * TIPOS:
 * - request: Cliente solicita hora al servidor (Cristian)
 * - response: Servidor responde con su hora (Cristian/Berkeley)
 * - berkeley-poll: Coordinador solicita hora a un nodo
 * - berkeley-offset: Coordinador envía ajuste calculado
 */
interface ClockMessage {
  fromId: number;
  toId: number;
  tipo: "request" | "response" | "berkeley-poll" | "berkeley-offset";
  payload?: unknown;
}

/**
 * Acción de la simulación (un paso)
 *
 * CAMPOS:
 * - descripcion: Texto explicativo del paso
 * - highlightIds: Nodos a resaltar visualmente
 * - mensaje: Mensaje visual entre nodos (opcional)
 * - ajustes: Nuevos valores de offsetActual por nodo
 * - rttValues: Valores de RTT calculados (Cristian)
 */
interface ClockAction {
  descripcion: string;
  highlightIds?: number[];
  mensaje?: ClockMessage | null;
  ajustes?: Record<number, number>;
  rttValues?: Record<number, number>;
}

// ============================================================================
// FUNCIÓN: GENERAR RELOJES
// ============================================================================

/**
 * Genera un conjunto de nodos con relojes desincronizados
 * FUNCIONAMIENTO:
 * 1. Crea el nodo 0 como servidor (Cristian) o coordinador (Berkeley)
 * 2. Genera nodos cliente con offsets aleatorios de -3000 a +3000 ms
 * 3. Cada nodo tiene su reloj local basado en Date.now()
 */
function generarRelojes(cantidad: number, algoritmo: ClockAlgorithm): ClockNode[] {
  const now = Date.now(); // Tiempo actual como referencia
  const nodos: ClockNode[] = [];

  // ========== NODO 0: SERVIDOR/COORDINADOR ==========
  // Este nodo especial no tiene offset inicial (representa tiempo "real")
  nodos.push({
    id: 0,
    horaLocal: now,
    offsetInicial: 0,
    offsetActual: 0,
    failed: false,
    highlighted: false,
    role: algoritmo === "cristian" ? "server" : "coordinator",
  });

  // ========== NODOS CLIENTE ==========
  // Generamos nodos con relojes desincronizados aleatoriamente
  for (let i = 1; i <= cantidad; i++) {
    // Offset aleatorio: -3 segundos a +3 segundos
    const offset = Math.floor(Math.random() * 6000 - 3000);
    nodos.push({
      id: i,
      horaLocal: now + offset,
      offsetInicial: offset,
      offsetActual: 0,
      failed: false,
      highlighted: false,
      role: "client",
    });
  }

  return nodos;
}

// ============================================================================
// ALGORITMO: CRISTIAN
// ============================================================================

/**
 * Implementación del algoritmo de Cristian para sincronización de relojes
 *
 * CONCEPTO:
 * Cada cliente consulta al servidor para obtener su hora, calcula el RTT
 * (Round Trip Time) y ajusta su reloj considerando la latencia de red.
 *
 * PASOS:
 * 1. Cliente envía REQUEST al servidor (marcando T0)
 * 2. Servidor responde con su hora actual Tserver
 * 3. Cliente calcula RTT = tiempo total de ida y vuelta
 * 4. Cliente ajusta su reloj: Tserver + (RTT/2) - T0
 *
 * LIMITACIONES:
 * - Asume latencia simétrica (ida ≈ vuelta)
 * - No compensa drift (desviación del reloj)
 * - Requiere servidor siempre disponible
 */
function simularCristian(
  nodos: ClockNode[],
  latenciaMax: number
): ClockAction[] {
  const vivos = nodos.filter((n) => !n.failed); // Filtrar nodos activos
  const acciones: ClockAction[] = [];

  // ========== VALIDACIÓN ==========
  if (vivos.length === 0) {
    acciones.push({
      descripcion: "No hay nodos activos para sincronizar con Cristian.",
    });
    return acciones;
  }

  // ========== TIEMPO DE REFERENCIA ==========
  // El servidor (nodo 0) representa el "tiempo real" del sistema
  const baseReal = vivos[0].horaLocal - vivos[0].offsetInicial;

  acciones.push({
    descripcion:
      "Servidor de referencia establecido. Su reloj representa el tiempo 'real' del sistema.",
  });

  // ========== SINCRONIZACIÓN DE CADA CLIENTE ==========
  for (const nodo of vivos) {
    // ===== CALCULAR LATENCIAS ALEATORIAS =====
    // Ida y vuelta pueden ser diferentes (red asimétrica)
    const dIda = Math.max(5, Math.floor(Math.random() * latenciaMax));
    const dVuelta = Math.max(5, Math.floor(Math.random() * latenciaMax));

    // ===== CALCULAR TIEMPOS =====
    const T0 = nodo.horaLocal + nodo.offsetActual; // Tiempo cliente al enviar
    const Tserver = baseReal + dIda; // Tiempo servidor cuando llega request
    const RTT = dIda + dVuelta; // Round Trip Time total

    // ===== CALCULAR OFFSET (θ) =====
    // θ = Tserver - (T0 + RTT/2)
    // Asume que RTT/2 es el tiempo de ida
    const theta = Math.round(Tserver - (T0 + RTT / 2));

    // ===== PASO 1: REQUEST =====
    acciones.push({
      descripcion: `📤 Nodo ${nodo.id} envía REQUEST al servidor | Latencia: ida=${dIda}ms, vuelta=${dVuelta}ms`,
      highlightIds: [nodo.id],
      mensaje: { fromId: nodo.id, toId: 0, tipo: "request" },
    });

    // ===== PASO 2: RESPONSE =====
    acciones.push({
      descripcion: `📥 Servidor responde a Nodo ${nodo.id} | Hora del servidor: ${new Date(
        Tserver
      ).toLocaleTimeString("es-MX", { hour12: false })}`,
      highlightIds: [nodo.id],
      mensaje: { fromId: 0, toId: nodo.id, tipo: "response" },
    });

    // ===== PASO 3: AJUSTE =====
    acciones.push({
      descripcion: `⚙️ Nodo ${nodo.id} ajusta reloj | RTT=${RTT}ms, Offset calculado=${theta}ms`,
      highlightIds: [nodo.id],
      ajustes: { [nodo.id]: theta },
      rttValues: { [nodo.id]: RTT },
    });
  }

  // ===== FINALIZACIÓN =====
  acciones.push({
    descripcion: "Todos los nodos aplicaron sus ajustes según Cristian.",
  });

  return acciones;
}

// ============================================================================
// ALGORITMO: BERKELEY
// ============================================================================

/**
 * Implementación del algoritmo de Berkeley para sincronización de relojes
 *
 * CONCEPTO:
 * Un coordinador recopila las horas de todos los nodos, calcula el promedio
 * y envía a cada nodo el ajuste necesario para sincronizar al promedio.
 *
 * FASES:
 * 1. POLL: Coordinador solicita hora a cada nodo
 * 2. CÁLCULO: Coordinador calcula promedio de todas las horas
 * 3. AJUSTES: Coordinador envía a cada nodo su offset individual
 * 4. APLICACIÓN: Todos los nodos ajustan simultáneamente
 *
 * VENTAJAS:
 * - No depende de un servidor de tiempo externo
 * - Tolerante a fallos del coordinador (puede rotar)
 * - Considera todos los relojes por igual
 *
 * DESVENTAJAS:
 * - Requiere coordinador activo
 * - Más tráfico de red que Cristian
 * - Sensible a nodos con relojes muy desviados
 *
 */
function simularBerkeley(nodos: ClockNode[], latenciaMax: number): ClockAction[] {
  const vivos = nodos.filter((n) => !n.failed); // Solo nodos activos
  const acciones: ClockAction[] = [];

  // ========== VALIDACIÓN ==========
  if (vivos.length === 0) {
    acciones.push({
      descripcion: "No hay nodos activos para ejecutar Berkeley.",
    });
    return acciones;
  }

  // ========== COORDINADOR ==========
  // El primer nodo activo (generalmente id:0) es el coordinador
  const coord = vivos[0];

  acciones.push({
    descripcion: `👑 Nodo ${coord.id} actúa como coordinador del algoritmo Berkeley`,
    highlightIds: [coord.id],
  });

  // ========================================
  // FASE 1: POLL - RECOPILAR HORAS
  // ========================================
  // El coordinador solicita a cada nodo su hora actual
  const horasReportadas: Record<number, number> = {};

  for (const nodo of vivos) {
    // Saltar al coordinador (se incluye al final)
    if (nodo.id === coord.id) continue;

    // ===== LATENCIAS ALEATORIAS =====
    const dIda = Math.max(5, Math.floor(Math.random() * latenciaMax));
    const dVuelta = Math.max(5, Math.floor(Math.random() * latenciaMax));

    // ===== HORA ACTUAL DEL NODO =====
    const horaNodo = nodo.horaLocal + nodo.offsetActual;

    // ===== POLL: COORDINADOR SOLICITA HORA =====
    acciones.push({
      descripcion: `📤 Coordinador ${coord.id} envía POLL a Nodo ${nodo.id} | Latencia: ida=${dIda}ms, vuelta=${dVuelta}ms`,
      highlightIds: [coord.id, nodo.id],
      mensaje: { fromId: coord.id, toId: nodo.id, tipo: "berkeley-poll" },
    });

    // ===== RESPONSE: NODO RESPONDE CON SU HORA =====
    acciones.push({
      descripcion: `📥 Nodo ${nodo.id} responde con su hora local: ${new Date(horaNodo).toLocaleTimeString("es-MX", { hour12: false })}`,
      highlightIds: [coord.id, nodo.id],
      mensaje: { fromId: nodo.id, toId: coord.id, tipo: "response" },
    });

    // Guardar hora reportada
    horasReportadas[nodo.id] = horaNodo;
  }

  // ===== INCLUIR HORA DEL COORDINADOR =====
  horasReportadas[coord.id] = coord.horaLocal + coord.offsetActual;

  acciones.push({
    descripcion: `📊 Coordinador ${coord.id} recopila ${Object.keys(horasReportadas).length} horas de los nodos`,
    highlightIds: [coord.id],
  });

  // ========================================
  // FASE 2: CALCULAR PROMEDIO
  // ========================================
  // El promedio representa el tiempo de consenso del sistema
  const suma = Object.values(horasReportadas).reduce((a, b) => a + b, 0);
  const promedio = Math.round(suma / Object.keys(horasReportadas).length);

  acciones.push({
    descripcion: `🧮 Promedio calculado: ${new Date(
      promedio
    ).toLocaleTimeString("es-MX", { hour12: false })} | ${Object.keys(horasReportadas).length} nodos`,
    highlightIds: [coord.id],
  });

  // ========================================
  // FASE 3: ENVIAR AJUSTES INDIVIDUALES
  // ========================================
  // Cada nodo recibe el offset necesario para llegar al promedio
  const offsets: Record<number, number> = {};

  for (const nodo of vivos) {
    const horaActual = nodo.horaLocal + nodo.offsetActual;
    const diff = promedio - horaActual; // Ajuste necesario

    offsets[nodo.id] = diff;

    acciones.push({
      descripcion: `📨 Coordinador ${coord.id} envía ajuste a Nodo ${nodo.id} | Offset=${diff}ms`,
      highlightIds: [coord.id, nodo.id],
      mensaje: { fromId: coord.id, toId: nodo.id, tipo: "berkeley-offset" },
    });
  }

  // ========================================
  // FASE 4: APLICAR AJUSTES
  // ========================================
  acciones.push({
    descripcion: "✅ Nodos aplican ajustes según Berkeley",
    ajustes: offsets,
    highlightIds: vivos.map((n) => n.id),
  });

  return acciones;
}

// ============================================================================
// COMPONENTE PRINCIPAL: CLOCK SYNC SIMULATOR
// ============================================================================

/**
 * SECCIONES:
 * 1. Panel de controles: Configuración y botones
 * 2. Canvas: Visualización de relojes con estados
 * 3. Panel de logs: Registro detallado de eventos
 *
 * CARACTERÍSTICAS:
 * - Responsive con acordeones en móvil
 * - Instrucciones desplegables
 * - Animaciones de mensajes entre nodos
 * - Control de velocidad de reproducción
 * - Logs con formato antes→después
 */
function ClockSyncSimulator() {
  const [numNodos, setNumNodos] = useState(4);
  const [algoritmoActivo, setAlgoritmoActivo] =
    useState<ClockAlgorithm>("cristian");
  const [latenciaMax, setLatenciaMax] = useState(200);

  const [nodos, setNodos] = useState<ClockNode[]>([]);
  const [acciones, setAcciones] = useState<ClockAction[]>([]);
  const [pasoIndex, setPasoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mensajeActual, setMensajeActual] = useState<ClockMessage | null>(null);

  const [speed, setSpeed] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Estados para UI de instrucciones y acordeones
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [configOpen, setConfigOpen] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(true);

  // Estado para línea de mensaje animada
  const [messageLineData, setMessageLineData] = useState<{
    line: React.ReactNode;
  } | null>(null);

  const pushLog = (msg: string) =>
    setLogs((prev) => [...prev, `[t=${prev.length}] ${msg}`]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Calcular líneas de mensaje animadas
  useEffect(() => {
    // Validar condiciones necesarias
    if (!mensajeActual || nodos.length === 0 || !canvasRef.current) {
      if (messageLineData !== null) {
        setMessageLineData(null);
      }
      return;
    }

    const canvas = canvasRef.current;
    // Buscar elementos DOM de los nodos involucrados
    const fromEl = document.getElementById(`clock-node-${mensajeActual.fromId}`);
    const toEl = document.getElementById(`clock-node-${mensajeActual.toId}`);

    if (!fromEl || !toEl) {
      setMessageLineData(null);
      return;
    }

    // Usar requestAnimationFrame para sincronizar con el render
    const requestId = requestAnimationFrame(() => {
      // Obtener rectángulos delimitadores (posiciones absolutas)
      const cRect = canvas.getBoundingClientRect();
      const fRect = fromEl.getBoundingClientRect();
      const tRect = toEl.getBoundingClientRect();

      // Calcular centros de los nodos (relativo al canvas)
      const fcx = fRect.left - cRect.left + fRect.width / 2;  // Centro X del origen
      const fcy = fRect.top - cRect.top + fRect.height / 2;   // Centro Y del origen
      const tcx = tRect.left - cRect.left + tRect.width / 2;  // Centro X del destino
      const tcy = tRect.top - cRect.top + tRect.height / 2;   // Centro Y del destino

      // Calcular vector y geometría
      const dx = tcx - fcx; // Diferencia en X
      const dy = tcy - fcy; // Diferencia en Y
      const dist = Math.sqrt(dx * dx + dy * dy); // Distancia euclidiana
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // Ángulo en grados

      // Punto medio entre nodos (donde se dibujará la línea)
      const midX = (fcx + tcx) / 2;
      const midY = (fcy + tcy) / 2;

      // Determinar clase CSS según tipo de mensaje
      let lineClass = "message-line";
      if (mensajeActual.tipo === "response" || mensajeActual.tipo === "berkeley-offset") {
        lineClass += " message-line-ok"; // Respuestas/offsets en color especial
      }

      // Estilos inline para posicionar y rotar la línea
      const style: React.CSSProperties = {
        left: midX,
        top: midY,
        width: dist,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      };

      // Crear elemento JSX de la línea
      const line = (
        <div className={lineClass} style={style}>
          <div className="message-dot" /> {/* Punto animado que viaja */}
        </div>
      );

      // Guardar elementos calculados
      setMessageLineData({ line });
    });

    // Cleanup: cancelar animationFrame si el efecto se re-ejecuta
    return () => cancelAnimationFrame(requestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensajeActual, nodos.length]);

  // Relojes avanzan
  useEffect(() => {
    if (nodos.length === 0) return;
    const id = setInterval(() => {
      setNodos((prev) =>
        prev.map((n) => ({
          ...n,
          horaLocal: n.horaLocal + 1000,
        }))
      );
    }, 1000);
    return () => clearInterval(id);
  }, [nodos.length]);

  /** Generar relojes */
  const handleGenerarRelojes = () => {
    // Validar numNodos
    if (numNodos < 2 || numNodos > 12) {
      alert("Ingresa un número de nodos entre 2 y 12");
      setNumNodos(4); // Valor por defecto
      return;
    }

    // Validar latenciaMax
    if (latenciaMax < 10 || latenciaMax > 1000) {
      alert("Ingresa una latencia entre 10 y 1000 ms");
      setLatenciaMax(100); // Valor por defecto
      return;
    }

    setNodos(generarRelojes(numNodos, algoritmoActivo));
    setAcciones([]);
    setPasoIndex(0);
    setIsPlaying(false);
    setMensajeActual(null);

    setLogs([
      "[t=0] Relojes generados con offsets aleatorios.",
      `[t=1] Nodo 0 actúa como ${algoritmoActivo === "cristian" ? "servidor" : "coordinador"}.`,
      "[t=2] Presiona 'Sincronizar' para iniciar el algoritmo.",
    ]);
  };

  /** Ejecutar sincronización */
  const handleSincronizar = () => {
    if (nodos.length === 0) {
      pushLog("Primero genera relojes.");
      return;
    }

    setNodos((prev) => prev.map((n) => ({ ...n, highlighted: false })));
    setMensajeActual(null);

    let accionesSim: ClockAction[] = [];

    if (algoritmoActivo === "cristian") {
      pushLog("Ejecutando algoritmo Cristian...");
      accionesSim = simularCristian(nodos, latenciaMax);
    } else {
      pushLog("Ejecutando algoritmo Berkeley...");
      accionesSim = simularBerkeley(nodos, latenciaMax);
    }

    setAcciones(accionesSim);
    setPasoIndex(0);
    setIsPlaying(true);
  };

  /**
   * Limpia todos los mensajes del registro de eventos
   */
  const handleClearLogs = () => setLogs([]);

  /** Avanzar paso */
  const avanzarPaso = useCallback(() => {
    if (pasoIndex >= acciones.length) {
      setIsPlaying(false);
      return;
    }

    const acc = acciones[pasoIndex];
    
    // Si hay ajustes, agregar información de antes→después
    if (acc.ajustes) {
      Object.entries(acc.ajustes).forEach(([nodeIdStr, newOffset]) => {
        const nodeId = Number(nodeIdStr);
        const nodo = nodos.find(n => n.id === nodeId);
        if (nodo) {
          const before = nodo.offsetActual;
          const delta = newOffset - before;
          const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
          pushLog(
            `${acc.descripcion} | Nodo ${nodeId}: offset ${before}ms → ${newOffset}ms (${deltaStr}ms)`
          );
        }
      });
    } else {
      pushLog(acc.descripcion);
    }

    // highlight
    if (acc.highlightIds) {
      setNodos((prev) =>
        prev.map((n) => ({
          ...n,
          highlighted: acc.highlightIds!.includes(n.id),
        }))
      );
    } else {
      setNodos((prev) => prev.map((n) => ({ ...n, highlighted: false })));
    }

    // mensaje
    setMensajeActual(acc.mensaje ?? null);

    // ajustes y RTT
    if (acc.ajustes || acc.rttValues) {
      setNodos((prev) =>
        prev.map((n) => ({
          ...n,
          offsetActual:
            acc.ajustes?.[n.id] !== undefined
              ? acc.ajustes[n.id]
              : n.offsetActual,
          rtt:
            acc.rttValues?.[n.id] !== undefined
              ? acc.rttValues[n.id]
              : n.rtt,
        }))
      );
    }

    setPasoIndex((i) => i + 1);
  }, [acciones, pasoIndex, nodos]);

  // Play automático
  useEffect(() => {
    if (!isPlaying) return;
    if (pasoIndex >= acciones.length) {
      // No detener aquí, dejamos que el usuario lo pause manualmente
      return;
    }

    const delay = 900 / speed;
    const t = setTimeout(() => avanzarPaso(), delay);
    return () => clearTimeout(t);
  }, [isPlaying, pasoIndex, avanzarPaso, acciones.length, speed]);

  // Extraer línea de mensaje para renderizado
  const messageLine = messageLineData?.line || null;

  // Mensaje overlay
  let overlay: React.JSX.Element | null = null;
  if (mensajeActual) {
    const tipo =
      mensajeActual.tipo === "request"
        ? "REQUEST"
        : mensajeActual.tipo === "response"
        ? "RESPONSE"
        : mensajeActual.tipo === "berkeley-poll"
        ? "POLL"
        : "OFFSET";

    const origen =
      mensajeActual.fromId === 0 ? "Servidor" : `Nodo ${mensajeActual.fromId}`;
    const destino =
      mensajeActual.toId === 0 ? "Servidor" : `Nodo ${mensajeActual.toId}`;

    overlay = (
      <div className="message-overlay">
        {tipo}: {origen} → {destino}
      </div>
    );
  }

  return (
    <div className="simulation-container">
      {/* Panel de controles */}
      <Panel title="Controles" className="panel-controles">
        
        {/* ===== INSTRUCCIONES DESPLEGABLES ===== */}
        <div className="instructions-box">
          <button 
            className="instructions-header"
            onClick={() => setInstructionsOpen(!instructionsOpen)}
          >
            <span className="instructions-title">
              Cómo usar el simulador
            </span>
            <span className={`toggle-icon ${instructionsOpen ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          
          {instructionsOpen && (
            <ul className="instructions-list">
              <li>
                <strong>1. Generar relojes:</strong> Crea los nodos con offsets aleatorios
              </li>
              <li>
                <strong>2. Sincronizar:</strong> Ejecuta el algoritmo seleccionado
              </li>
              <li>
                <strong>Cristian:</strong> Cada nodo consulta al servidor y calcula RTT
              </li>
              <li>
                <strong>Berkeley:</strong> El coordinador recopila horas y envía ajustes
              </li>
            </ul>
          )}
        </div>

        <div className="separator"></div>

        {/* ===== ACORDEÓN 1: CONFIGURACIÓN ===== */}
        <div className="control-accordion">
          <button 
            className="accordion-header"
            onClick={() => setConfigOpen(!configOpen)}
          >
            <span className="accordion-title">
              Configuración
              {!configOpen && (
                <span className="accordion-summary">
                  {numNodos} nodos, {algoritmoActivo === "cristian" ? "Cristian" : "Berkeley"}
                </span>
              )}
            </span>
            <span className={`toggle-icon ${configOpen ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          
          <div className={`accordion-content ${configOpen ? 'is-open' : 'is-closed'}`}>
            <div className="field-row">
              <label className="field field-inline">
                <span>Nodos:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={numNodos === 0 ? "" : numNodos}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setNumNodos(0);
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num >= 0 && num <= 99) {
                        setNumNodos(num);
                      }
                    }
                  }}
                  placeholder="Num Nodos"
                />
              </label>

              <label className="field field-inline">
                <span>Algoritmo:</span>
                <select
                  value={algoritmoActivo}
                  onChange={(e) =>
                    setAlgoritmoActivo(e.target.value as ClockAlgorithm)
                  }
                >
                  <option value="cristian">Cristian</option>
                  <option value="berkeley">Berkeley</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Latencia máxima (ms):</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={latenciaMax === 0 ? "" : latenciaMax}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setLatenciaMax(0);
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 0 && num <= 9999) {
                      setLatenciaMax(num);
                    }
                  }
                }}
                placeholder="Latencia (ms)"
              />
            </label>

            <label className="field">
              <span>Velocidad:</span>
              <div className="btn-row">
                <button
                  className={`btn-ghost small ${
                    speed === 0.5 ? "speed-active" : ""
                  }`}
                  onClick={() => setSpeed(0.5)}
                >
                  0.5x
                </button>
                <button
                  className={`btn-ghost small ${
                    speed === 1 ? "speed-active" : ""
                  }`}
                  onClick={() => setSpeed(1)}
                >
                  1x
                </button>
                <button
                  className={`btn-ghost small ${
                    speed === 2 ? "speed-active" : ""
                  }`}
                  onClick={() => setSpeed(2)}
                >
                  2x
                </button>
              </div>
            </label>

            <button className="btn-primary" onClick={handleGenerarRelojes}>
              Generar Relojes
            </button>
          </div>
        </div>

        {/* ===== ACORDEÓN 2: CONTROLES DE SIMULACIÓN ===== */}
        <div className="control-accordion">
          <button 
            className="accordion-header"
            onClick={() => setControlsOpen(!controlsOpen)}
          >
            <span className="accordion-title">
              Controles de Simulación
            </span>
            <span className={`toggle-icon ${controlsOpen ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          
          <div className={`accordion-content ${controlsOpen ? 'is-open' : 'is-closed'}`}>
            <button className="btn-secondary" onClick={handleSincronizar}>
              Sincronizar
            </button>

            <div className="btn-row">
              <button className="btn-ghost small" onClick={() => setIsPlaying(true)}>
                ▶ Play
              </button>
              <button className="btn-ghost small" onClick={() => setIsPlaying(false)}>
                ⏸ Pause
              </button>
              <button className="btn-ghost small" onClick={avanzarPaso}>
                ⏭ Paso
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Panel de simulación */}
      <Panel
        title={`Simulación – ${
          algoritmoActivo === "cristian" ? "Cristian" : "Berkeley"
        }`}
        className="simulation-canvas"
      >
        <div className="canvas-area" ref={canvasRef}>
          {nodos.length === 0 ? (
            <div className="canvas-placeholder">
              <p>¿Aquí se mostrarán los relojes y la sincronización.</p>
              <p className="info-hint">
                Genera relojes para comenzar la simulación.
              </p>
            </div>
          ) : (
            <>
              {overlay}
              {messageLine}

              <div className="clock-grid">
            {nodos.map((n) => {
              const tiempo = n.horaLocal + n.offsetActual;
              const offsetTotal = n.offsetInicial + n.offsetActual;
              const absOffset = Math.abs(offsetTotal);
              
              // Determinar estado de sincronización
              let syncStatus: "synced" | "partial" | "desynced" = "synced";
              let statusText = "✅ Sincronizado";
              
              if (absOffset > 3000) {
                syncStatus = "desynced";
                statusText = "❌ Muy desincronizado";
              } else if (absOffset > 1000) {
                syncStatus = "partial";
                statusText = "⚠️ Desincronizado";
              }

              // Clases CSS
              const classes = [
                "clock-node",
                syncStatus,
                n.role === "server" ? "clock-server" : "",
                n.role === "coordinator" ? "clock-coordinator" : "",
                n.failed ? "clock-failed" : "",
                n.highlighted ? "clock-highlight" : "",
              ].filter(Boolean).join(" ");

              return (
                <div key={n.id} id={`clock-node-${n.id}`} className={classes}>
                  <div className="clock-title">
                    <span>
                      {n.role === "server" ? "🖥️ Servidor" : 
                       n.role === "coordinator" ? "👑 Coordinador" : 
                       `Nodo ${n.id}`}
                    </span>
                    <span className={`clock-role-badge ${n.role || "client"}`}>
                      {n.role === "server" ? "Server" : 
                       n.role === "coordinator" ? "Coord" : 
                       "Client"}
                    </span>
                  </div>

                  <div className="clock-display">
                    <div className="clock-time">
                      {new Date(tiempo).toLocaleTimeString("es-MX", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}.{String(tiempo % 1000).padStart(3, "0").substring(0, 2)}
                    </div>
                  </div>

                  <div className="clock-info">
                    <div className="clock-offset">
                      <span>Offset:</span>
                      <span>
                        {offsetTotal >= 0 ? "+" : ""}
                        {(offsetTotal / 1000).toFixed(2)}s
                      </span>
                    </div>
                    
                    {n.rtt !== undefined && (
                      <div className="clock-rtt">
                        RTT: {n.rtt}ms
                      </div>
                    )}
                    
                    <div className={`clock-status ${syncStatus}`}>
                      {statusText}
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* Panel de logs */}
      <Panel title="Registros" className="panel-log">
        {/* Botón para limpiar el historial */}
        <div className="btn-row">
          <button className="btn-ghost small" onClick={handleClearLogs}>
            Limpiar logs
          </button>
        </div>

        {/* Lista de mensajes de log con auto-scroll */}
        <div className="log-list" ref={logRef}>
          {logs.map((log, i) => (
            <div key={i} className="log-item">
              {log}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default ClockSyncSimulator;
