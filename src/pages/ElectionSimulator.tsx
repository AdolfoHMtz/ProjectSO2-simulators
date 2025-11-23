// ============================================================================
// IMPORTS - Librerías y componentes necesarios
// ============================================================================
import {
  useState,      // Hook para manejar estado local del componente
  useEffect,     // Hook para efectos secundarios (animaciones, timers, etc.)
  useCallback,   // Hook para memorizar funciones y evitar re-renders innecesarios
  useRef,        // Hook para referencias a elementos DOM y valores mutables
  type CSSProperties, // Tipo para propiedades CSS en TypeScript
} from "react";
import Panel from "../components/Panel";  // Componente contenedor para secciones de la UI
import Nodo from "../components/Nodo";    // Componente que representa un nodo visual en el canvas

// ============================================================================
// TIPOS Y INTERFACES - Definiciones de datos para TypeScript
// ============================================================================

/**
 * Algorithm: Define los dos algoritmos de elección de líder que soporta el simulador
 * - "bully": Algoritmo Bully (el nodo con mayor ID gana)
 * - "ring": Algoritmo de Anillo (los mensajes circulan en el anillo)
 */
type Algorithm = "bully" | "ring";

/**
 * NodoSim: Representa un nodo en la simulación
 * @property {number} id - Identificador único del nodo (generado aleatoriamente)
 * @property {boolean} failed - Indica si el nodo está caído/fallado
 * @property {boolean} highlighted - Indica si el nodo debe resaltarse visualmente (opcional)
 */
interface NodoSim {
  id: number;
  failed: boolean;
  highlighted?: boolean;
}

/**
 * MessageKind: Tipos de mensajes que se pueden enviar entre nodos
 * - "election": Mensaje de elección en Bully (solicita elección)
 * - "ok": Respuesta OK en Bully (indica que hay un nodo superior activo)
 * - "ring1": Mensaje de fase 1 en Ring (recopila IDs de nodos activos)
 * - "ring2": Mensaje de fase 2 en Ring (anuncia el líder elegido)
 */
type MessageKind = "election" | "ok" | "ring1" | "ring2";

/**
 * SimMensaje: Representa un mensaje entre dos nodos durante la simulación
 * @property {number} fromId - ID del nodo que envía el mensaje
 * @property {number} toId - ID del nodo que recibe el mensaje
 * @property {MessageKind} tipo - Tipo de mensaje (election, ok, ring1, ring2)
 * @property {number[]} payload - Lista de IDs (usado en Ring fase 1 para recopilar nodos)
 */
interface SimMensaje {
  fromId: number;
  toId: number;
  tipo: MessageKind;
  payload?: number[];
}

/**
 * SimAction: Representa una acción/paso en la secuencia de simulación
 * Cada acción describe qué está ocurriendo en ese momento de la elección
 * @property {string} descripcion - Texto descriptivo de lo que ocurre en este paso
 * @property {number[]} highlightIds - IDs de nodos que deben resaltarse visualmente
 * @property {number|null} leaderId - ID del nuevo líder (si aplica en este paso)
 * @property {SimMensaje|null} mensaje - Mensaje siendo enviado en este paso (si aplica)
 */
interface SimAction {
  descripcion: string;
  highlightIds?: number[];
  leaderId?: number | null;
  mensaje?: SimMensaje | null;
}

// ============================================================================
// FUNCIONES - Generación y posicionamiento de nodos
// ============================================================================

/**
 * generarNodos: Crea un array de nodos con IDs aleatorios y únicos
 * Propósito: Inicializar la simulación con nodos que tienen identificadores
 * aleatorios entre 10 y 99. Esto simula un sistema distribuido real donde
 * cada nodo tiene un ID único.
 * Funcionamiento:
 * 1. Usa un Set para garantizar que no haya IDs duplicados
 * 2. Genera números aleatorios entre 10 y 99
 * 3. Crea objetos NodoSim con estado inicial: activos (failed: false)
 */
function generarNodos(cantidad: number): NodoSim[] {
  const ids = new Set<number>(); // Set para evitar IDs duplicados

  // Generar IDs únicos hasta completar la cantidad requerida
  while (ids.size < cantidad) {
    const id = Math.floor(Math.random() * 90) + 10; // ID entre 10 y 99
    ids.add(id);
  }

  // Convertir Set a Array y crear objetos NodoSim
  return Array.from(ids).map((id) => ({
    id,
    failed: false,      // Todos los nodos inician activos
    highlighted: false, // Ninguno resaltado inicialmente
  }));
}

// ============================================================================
// ALGORITMO BULLY - Simulación del algoritmo de elección Bully
// ============================================================================

/**
 * simularBully: Genera la secuencia completa de pasos del algoritmo Bully
 * 
 * CONCEPTO DEL ALGORITMO BULLY:
 * - Cuando un nodo detecta que el líder ha fallado, inicia una elección
 * - El nodo iniciador envía mensajes de ELECCIÓN a todos los nodos con ID mayor
 * - Si recibe respuestas OK, significa que hay nodos superiores activos
 * - El nodo con el ID más alto que esté activo se convierte en el líder
 * - Se llama "Bully" porque el nodo con mayor ID siempre "intimida" a los demás
 * 
 * PASOS DEL ALGORITMO:
 * 1. Validar que el iniciador esté activo
 * 2. Buscar todos los nodos con ID superior al iniciador
 * 3. Si no hay superiores, el iniciador se convierte en líder
 * 4. Si hay superiores, enviar mensajes de ELECCIÓN a cada uno
 * 5. Cada superior responde con OK
 * 6. El nodo con mayor ID activo se proclama líder
 */
function simularBully(nodos: NodoSim[], iniciadorId: number): SimAction[] {
  // Filtrar solo nodos activos (no fallados)
  const vivos = nodos.filter((n) => !n.failed);
  const acciones: SimAction[] = []; // Array para almacenar cada paso

  // Validar que el nodo iniciador esté activo
  const iniciador = vivos.find((n) => n.id === iniciadorId);
  if (!iniciador) {
    acciones.push({
      descripcion: `El nodo iniciador ${iniciadorId} está caído. No puede iniciar.`,
    });
    return acciones; // Terminar si el iniciador está caído
  }

  // Buscar nodos con ID superior (candidatos a líder)
  const superiores = vivos.filter((n) => n.id > iniciador.id);
  
  // Determinar el nodo con mayor ID (será el líder final)
  const nuevoLider = vivos.reduce(
    (max, n) => (n.id > max.id ? n : max),
    iniciador
  );

  // PASO 1: Iniciar la elección
  acciones.push({
    descripcion: `Nodo ${iniciador.id} detecta la caída del líder e inicia la elección (Bully).`,
    highlightIds: [iniciador.id],
  });

  // CASO ESPECIAL: Si no hay nodos superiores, el iniciador es el líder
  if (superiores.length === 0) {
    acciones.push({
      descripcion: `Nodo ${iniciador.id} no encuentra nodos con ID superior. Se convierte en líder.`,
      leaderId: iniciador.id,
      highlightIds: [iniciador.id],
    });
    return acciones;
  }

  // PASO 2: Enviar mensajes de ELECCIÓN a nodos superiores y recibir respuestas OK
  for (const s of superiores) {
    // Enviar mensaje de elección
    acciones.push({
      descripcion: `Nodo ${iniciador.id} envía mensaje de ELECCIÓN al nodo ${s.id}.`,
      highlightIds: [iniciador.id, s.id],
      mensaje: {
        fromId: iniciador.id,
        toId: s.id,
        tipo: "election",
      },
    });

    // Recibir respuesta OK del nodo superior
    acciones.push({
      descripcion: `Nodo ${s.id} responde OK al nodo ${iniciador.id}.`,
      highlightIds: [s.id, iniciador.id],
      mensaje: {
        fromId: s.id,
        toId: iniciador.id,
        tipo: "ok",
      },
    });
  }

  // PASO 3: Proclamar al líder (el nodo con mayor ID)
  acciones.push({
    descripcion: `El nodo con mayor ID activo es ${nuevoLider.id}. Se convierte en el nuevo líder.`,
    leaderId: nuevoLider.id,
    highlightIds: [nuevoLider.id],
  });

  return acciones;
}

// ============================================================================
// ALGORITMO RING - Simulación del algoritmo de elección en anillo
// ============================================================================

/**
 * CONCEPTO DEL ALGORITMO RING:
 * - Los nodos están organizados lógicamente en un anillo (cada nodo conoce al siguiente)
 * - Cuando se detecta falla del líder, un nodo inicia enviando un mensaje por el anillo
 * - El mensaje circula acumulando los IDs de todos los nodos activos
 * - Cuando el mensaje regresa al iniciador, se determina el líder (ID más alto)
 * - Se envía un segundo mensaje anunciando quién es el nuevo líder
 *
 * FASE 1 - ELECCIÓN (Recopilación de IDs):
 * 1. El iniciador crea un mensaje con su ID
 * 2. Cada nodo añade su ID al mensaje y lo pasa al siguiente
 * 3. El mensaje circula por todo el anillo hasta regresar al iniciador
 * 4. Se selecciona el ID más alto como líder
 *
 * FASE 2 - ANUNCIO:
 * 1. El líder electo envía un mensaje de anuncio
 * 2. El mensaje circula por el anillo informando a todos
 * 3. Cada nodo actualiza su conocimiento del líder actual
 */
function simularRingCompleto(
  nodos: NodoSim[],
  iniciadorId: number
): SimAction[] {
  // Filtrar solo nodos activos
  const vivos = nodos.filter((n) => !n.failed);
  const acciones: SimAction[] = [];

  // Validar que haya nodos activos
  if (vivos.length === 0) {
    acciones.push({ descripcion: "No hay nodos activos en el anillo." });
    return acciones;
  }

  // Validar que el iniciador esté activo
  const iniciador = vivos.find((n) => n.id === iniciadorId);
  if (!iniciador) {
    acciones.push({
      descripcion: `El nodo iniciador ${iniciadorId} está caído. No puede iniciar.`,
    });
    return acciones;
  }

  // Reorganizar el anillo para que empiece desde el nodo iniciador
  // Esto simula la estructura circular donde cada nodo conoce al siguiente
  const idxInicio = vivos.indexOf(iniciador);
  const anillo = [...vivos.slice(idxInicio), ...vivos.slice(0, idxInicio)];

  // ===== FASE 1: ELECCIÓN (recopila IDs) =====
  const idsEnMensaje: number[] = [iniciador.id]; // Lista que acumula IDs de nodos activos

  acciones.push({
    descripcion: `Nodo ${iniciador.id} inicia la elección (Ring). Mensaje inicial contiene [${idsEnMensaje.join(
      ", "
    )}].`,
    highlightIds: [iniciador.id],
  });

  // Hacer circular el mensaje por todo el anillo
  for (let i = 1; i <= anillo.length; i++) {
    const from = anillo[i - 1]; // Nodo que envía
    const to = anillo[i % anillo.length]; // Nodo que recibe (módulo para cerrar el anillo)

    // Registrar el paso del mensaje entre nodos
    acciones.push({
      descripcion: `Mensaje de ELECCIÓN pasa de nodo ${from.id} a nodo ${to.id} con IDs [${idsEnMensaje.join(
        ", "
      )}].`,
      highlightIds: [from.id, to.id],
      mensaje: {
        fromId: from.id,
        toId: to.id,
        tipo: "ring1",
        payload: [...idsEnMensaje],
      },
    });

    // Si el nodo destino no está en la lista, agregarlo
    if (!idsEnMensaje.includes(to.id)) {
      idsEnMensaje.push(to.id);
    }
  }

  // Determinar el líder: el nodo con ID más alto
  const idLeader = Math.max(...idsEnMensaje);

  acciones.push({
    descripcion: `El mensaje regresa al nodo iniciador ${iniciador.id} con la lista completa [${idsEnMensaje.join(
      ", "
    )}]. Líder elegido: nodo ${idLeader}.`,
    highlightIds: [iniciador.id, idLeader],
  });

  // ===== FASE 2: ANUNCIO DEL LÍDER =====
  const nodoLider = anillo.find((n) => n.id === idLeader) ?? iniciador;
  const idxLider = anillo.indexOf(nodoLider);

  acciones.push({
    descripcion: `Nodo ${nodoLider.id} inicia la fase de ANUNCIO del líder en el anillo.`,
    highlightIds: [nodoLider.id],
  });

  // Hacer circular el mensaje de anuncio por todo el anillo
  for (let i = 1; i <= anillo.length; i++) {
    const from = anillo[(idxLider + i - 1) % anillo.length];
    const to = anillo[(idxLider + i) % anillo.length];

    acciones.push({
      descripcion: `Mensaje de ANUNCIO del líder (${idLeader}) pasa de nodo ${from.id} a nodo ${to.id}.`,
      highlightIds: [from.id, to.id],
      mensaje: {
        fromId: from.id,
        toId: to.id,
        tipo: "ring2", // Tipo de mensaje de anuncio
      },
    });
  }

  // Todos los nodos actualizan su conocimiento del líder
  acciones.push({
    descripcion: `Todos los nodos actualizan al líder ${idLeader}.`,
    highlightIds: anillo.map((n) => n.id),
    leaderId: idLeader,
  });

  return acciones;
}

/**
 * getPosicionNodo: Calcula la posición visual de un nodo en el canvas
 * 
 * Propósito: Determinar dónde dibujar cada nodo según el algoritmo activo
 * - Ring: Distribuye los nodos en círculo (simula un anillo físico)
 * - Bully: Distribuye los nodos en línea horizontal
 */
function getPosicionNodo(index: number, total: number, algoritmo: Algorithm) {
  if (algoritmo === "ring") {
    // Cálculo circular usando trigonometría
    const ang = (index / total) * 2 * Math.PI - Math.PI / 2; // Ángulo en radianes
    const r = 38; // Radio del círculo en %
    return {
      left: `${50 + r * Math.cos(ang)}%`,  // Coordenada X (coseno)
      top: `${50 + r * Math.sin(ang)}%`,    // Coordenada Y (seno)
    };
  }

  // Cálculo lineal horizontal
  const espacio = 100 / (total + 1); // Dividir ancho en segmentos
  return { left: `${espacio * (index + 1)}%`, top: "50%" };
}

// ============================================================================
// COMPONENTE PRINCIPAL - ElectionSimulator
// ============================================================================

/**
 * ElectionSimulator: Componente principal que maneja toda la simulación
 * de algoritmos de elección de líder distribuidos (Bully y Ring)
 * 
 * Este componente gestiona:
 * - Generación y visualización de nodos
 * - Ejecución paso a paso de algoritmos
 * - Animaciones de mensajes entre nodos
 * - Registro de eventos (logs)
 * - Controles de simulación (play, pause, velocidad)
 */
function ElectionSimulator() {
  // ========== ESTADOS DE CONFIGURACIÓN ==========
  
  /**
   * numNodos: Número de nodos a generar en la simulación (3-15)
   */
  const [numNodos, setNumNodos] = useState(5);
  
  /**
   * algoritmoActivo: Algoritmo actualmente seleccionado ("bully" o "ring")
   */
  const [algoritmoActivo, setAlgoritmoActivo] = useState<Algorithm>("bully");

  // ========== ESTADOS DE NODOS Y LÍDER ==========
  
  /**
   * nodos: Array con todos los nodos de la simulación
   * Cada nodo tiene: id, estado (failed), y highlight visual
   */
  const [nodos, setNodos] = useState<NodoSim[]>([]);
  
  /**
   * leaderId: ID del nodo que actualmente es el líder
   * null = no hay líder actual
   */
  const [leaderId, setLeaderId] = useState<number | null>(null);
  
  /**
   * recentLeaderId: ID del nodo que acaba de convertirse en líder
   * Se usa para mostrar animación de "coronación" temporal
   */
  const [recentLeaderId, setRecentLeaderId] = useState<number | null>(null);

  // ========== ESTADOS DE LOGS Y REFERENCIAS DOM ==========
  
  /**
   * logs: Array de mensajes de registro de eventos
   * Muestra cada paso de la simulación con timestamp
   */
  const [logs, setLogs] = useState<string[]>([]);
  
  /**
   * logRef: Referencia al contenedor de logs para auto-scroll
   */
  const logRef = useRef<HTMLDivElement | null>(null);

  // ========== ESTADOS DE SELECCIÓN DE INICIADOR ==========
  
  /**
   * modoIniciador: Indica si estamos en modo de selección de nodo iniciador
   * true = el próximo clic en un nodo lo seleccionará como iniciador
   */
  const [modoIniciador, setModoIniciador] = useState(false);
  
  /**
   * nodoIniciador: ID del nodo seleccionado para iniciar la elección
   * null = aún no se ha seleccionado iniciador
   */
  const [nodoIniciador, setNodoIniciador] = useState<number | null>(null);

  // ========== ESTADOS DE SIMULACIÓN Y REPRODUCCIÓN ==========
  
  /**
   * acciones: Secuencia completa de pasos generados por el algoritmo
   * Cada acción describe un evento en la elección
   */
  const [acciones, setAcciones] = useState<SimAction[]>([]);
  
  /**
   * pasoIndex: Índice del paso actual en la secuencia de acciones
   * Se incrementa mientras la simulación avanza
   */
  const [pasoIndex, setPasoIndex] = useState(0);
  
  /**
   * isPlaying: Indica si la simulación está reproduciéndose automáticamente
   * true = avanza pasos automáticamente con timer
   */
  const [isPlaying, setIsPlaying] = useState(false);

  // ========== ESTADOS DE MENSAJES Y ANIMACIONES ==========
  
  /**
   * mensajeActual: Mensaje que se está visualizando en este momento
   * null = no hay mensaje en tránsito
   * Contiene: origen, destino, tipo, y payload (para Ring)
   */
  const [mensajeActual, setMensajeActual] = useState<SimMensaje | null>(null);

  /**
   * speed: Velocidad de reproducción (0.5x, 1x, 2x)
   * Afecta el delay entre pasos automáticos
   */
  const [speed, setSpeed] = useState(1);

  /**
   * instructionsOpen: Controla si el panel de instrucciones está desplegado
   * Por defecto está abierto (true) para que el usuario las vea al inicio
   */
  const [instructionsOpen, setInstructionsOpen] = useState(true);

  /**
   * configOpen: Controla si el acordeón de configuración está expandido (solo móvil)
   * Por defecto abierto para que el usuario vea los controles inmediatamente
   */
  const [configOpen, setConfigOpen] = useState(true);

  /**
   * controlsOpen: Controla si el acordeón de controles de simulación está expandido (solo móvil)
   * Por defecto abierto (true) porque son los controles principales durante la ejecución
   */
  const [controlsOpen, setControlsOpen] = useState(true);

  // ========== REFERENCIAS DOM ==========
  
  /**
   * canvasRef: Referencia al contenedor del canvas de simulación
   * Usado para calcular posiciones de líneas de mensajes
   */
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // ========== FUNCIONES DE UTILIDAD ==========
  
  /**
   * pushLog: Agrega un nuevo mensaje al registro de eventos
   * Añade automáticamente un timestamp [t=X] al inicio del mensaje
   * 
   * @param {string} msg - Mensaje a registrar
   */
  const pushLog = (msg: string) =>
    setLogs((prev) => [...prev, `[t=${prev.length}] ${msg}`]);

  // ========== EFECTOS (SIDE EFFECTS) ==========
  
  /**
   * EFECTO 1: Auto-scroll de logs
   * Mantiene el scroll de logs siempre en la parte inferior
   * Se ejecuta cada vez que se agrega un nuevo log
   */
  useEffect(() => {
    if (logRef.current) {
      const el = logRef.current;
      el.scrollTop = el.scrollHeight; // Scroll hasta el final
    }
  }, [logs]);

  /**
   * EFECTO 2: Animación de coronación temporal
   * Cuando un nodo se convierte en líder, se muestra una animación especial
   * Después de 800ms, la animación se desactiva
   */
  useEffect(() => {
    if (recentLeaderId == null) return;
    const t = setTimeout(() => setRecentLeaderId(null), 800);
    return () => clearTimeout(t); // Limpieza del timer
  }, [recentLeaderId]);

  // ========== HANDLERS DE EVENTOS ==========

  /**
   * Funcionamiento:
   * 1. Llama a generarNodos() para crear nodos con IDs aleatorios
   * 2. Resetea TODOS los estados a valores iniciales
   * 3. Inicializa los logs con instrucciones para el usuario
   */
  const handleGenerarNodos = () => {
    // Validar que numNodos esté en el rango válido
    if (numNodos < 3 || numNodos > 15) {
      alert("Por favor, ingresa un número de nodos entre 3 y 15.");
      setNumNodos(5); // Valor por defecto
      return;
    }

    const nuevos = generarNodos(numNodos);

    // Establecer los nuevos nodos
    setNodos(nuevos);
    
    // Resetear estados de líder
    setLeaderId(null);
    setRecentLeaderId(null);
    
    // Resetear selección de iniciador
    setNodoIniciador(null);
    setModoIniciador(false);
    
    // Resetear estados de simulación
    setAcciones([]);
    setPasoIndex(0);
    setIsPlaying(false);
    setMensajeActual(null);

    // Inicializar logs con instrucciones
    setLogs([
      "[t=0] Nodos generados (todos activos, sin líder inicial).",
      "[t=1] Selecciona un iniciador y luego pulsa 'Iniciar elección'.",
    ]);
  };

  /**
   * toggleFallarNodo: Alterna el estado de un nodo entre activo y fallado
   * Propósito: Simular fallos de nodos durante la simulación
   * Permite al usuario experimentar con diferentes escenarios de falla
   *
   */
  const toggleFallarNodo = (id: number) => {
    // Verificar estado actual del nodo
    const estabaFallado = nodos.find((n) => n.id === id)?.failed ?? false;

    // Actualizar el estado del nodo
    setNodos((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, failed: !n.failed, highlighted: false } : n
      )
    );

    // Registrar evento en logs
    pushLog(
      `Nodo ${id} ${estabaFallado ? "revivido" : "marcado como caído"}.`
    );

    // Si el líder falla, eliminar el liderazgo
    if (leaderId === id && !estabaFallado) {
      setLeaderId(null);
      pushLog(`El líder ${id} ha fallado. Ya no hay líder actual.`);
    }
  };

  /**
   * seleccionarIniciador: Marca un nodo como el iniciador de la elección
   *
   * Propósito: Permitir al usuario elegir qué nodo detecta primero
   * la falla del líder e inicia el proceso de elección
   */
  const seleccionarIniciador = (id: number) => {
    // Solo funciona en modo de selección
    if (!modoIniciador) return;

    // Validar que el nodo exista y esté activo
    const nodo = nodos.find((n) => n.id === id);
    if (!nodo || nodo.failed) {
      pushLog(
        `No se puede seleccionar el nodo ${id} como iniciador (está caído).`
      );
      return;
    }

    // Guardar el iniciador seleccionado
    setNodoIniciador(id);

    // Resaltar visualmente el nodo iniciador
    setNodos((prev) =>
      prev.map((n) => ({
        ...n,
        highlighted: n.id === id,
      }))
    );

    // Desactivar modo de selección
    setModoIniciador(false);
    pushLog(`Nodo ${id} seleccionado como iniciador de la elección.`);
  };

  /**
   * handleIniciarEleccion: Genera la secuencia de elección y arranca la simulación
   * 
   * Flujo completo:
   * 1. Valida que haya un iniciador seleccionado
   * 2. Valida que haya nodos generados
   * 3. Llama al algoritmo correspondiente (Bully o Ring)
   * 4. Guarda la secuencia de acciones generada
   * 5. Inicia automáticamente la reproducción
   */
  const handleIniciarEleccion = () => {
    // Validar que se haya seleccionado un iniciador
    if (!nodoIniciador) {
      pushLog(
        "Selecciona primero un nodo iniciador (botón 'Seleccionar iniciador')."
      );
      return;
    }

    // Validar que haya nodos generados
    if (nodos.length === 0) {
      pushLog("Primero genera los nodos.");
      return;
    }

    // Generar la secuencia de acciones según el algoritmo activo
    const accionesSim =
      algoritmoActivo === "bully"
        ? simularBully(nodos, nodoIniciador)
        : simularRingCompleto(nodos, nodoIniciador);

    // Guardar acciones y resetear el índice de pasos
    setAcciones(accionesSim);
    setPasoIndex(0);
    setMensajeActual(null);

    // Resaltar el nodo iniciador
    setNodos((prev) =>
      prev.map((n) => ({
        ...n,
        highlighted: n.id === nodoIniciador,
      }))
    );

    // Registrar inicio y arrancar reproducción automática
    pushLog(
      "Secuencia de elección generada. La simulación se está ejecutando automáticamente."
    );
    setIsPlaying(true); // Inicia la reproducción automática
  };

  /**
   * handlePlay: Inicia/reanuda la reproducción automática de la simulación
   * Valida que exista una secuencia de acciones antes de iniciar
   */
  const handlePlay = () => {
    if (acciones.length === 0) {
      pushLog("Primero genera una elección con 'Iniciar elección'.");
      return;
    }
    setIsPlaying(true);
  };

  /**
   * handlePause: Pausa la reproducción automática
   * El usuario puede reanudar con Play o avanzar manualmente con Paso
   */
  const handlePause = () => {
    setIsPlaying(false);
  };

  /**
   * handlePaso: Avanza manualmente un solo paso en la simulación
   * Útil para analizar el algoritmo detalladamente
   * Valida que exista una secuencia antes de avanzar
   */
  const handlePaso = () => {
    if (acciones.length === 0) {
      pushLog("Primero genera una elección con 'Iniciar elección'.");
      return;
    }
    avanzarPaso();
  };

  /**
   * handleClearLogs: Limpia todos los mensajes del registro de eventos
   */
  const handleClearLogs = () => setLogs([]);

  /**
   * avanzarPaso: Ejecuta un paso de la simulación
   * Propósito: Procesar una acción de la secuencia y actualizar el estado visuall
   */
  const avanzarPaso = useCallback(() => {
    setPasoIndex((currentIndex) => {
      // Si ya terminamos la secuencia, detener reproducción
      if (currentIndex >= acciones.length) {
        setIsPlaying(false);
        return currentIndex; // No incrementar más
      }

      // Obtener la acción actual
      const acc = acciones[currentIndex];
      // Registrar lo que está ocurriendo
      pushLog(acc.descripcion);

      // Actualizar líder si esta acción define uno
      if (acc.leaderId !== undefined) {
        setLeaderId(acc.leaderId ?? null);
        setRecentLeaderId(acc.leaderId ?? null); // Activa animación de coronación
      }

      // Mostrar mensaje visual si existe
      if (acc.mensaje) {
        setMensajeActual(acc.mensaje);
      } else {
        setMensajeActual(null);
      }

      // Resaltar nodos involucrados en este paso
      if (acc.highlightIds && acc.highlightIds.length > 0) {
        setNodos((prev) =>
          prev.map((n) => ({
            ...n,
            highlighted: acc.highlightIds?.includes(n.id) ?? false,
          }))
        );
      } else {
        // Si no hay nodos específicos, quitar todos los highlights
        setNodos((prev) => prev.map((n) => ({ ...n, highlighted: false })));
      }

      // Avanzar al siguiente paso
      return currentIndex + 1;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acciones.length]);

  /**
   * EFECTO 3: Reproducción automática con velocidad ajustable
   * Avanza pasos automáticamente cuando isPlaying = true
   */
  useEffect(() => {
    // Salir si no está reproduciendo o ya terminó
    if (!isPlaying || pasoIndex >= acciones.length) return;

    // Calcular delay según velocidad
    const baseMs = 900; // Velocidad base (1x)
    const delay = baseMs / (speed || 1); // Dividir para acelerar

    // Programar el próximo paso
    const t = setTimeout(() => avanzarPaso(), delay);
    
    // Cleanup: limpiar timer si el efecto se vuelve a ejecutar
    return () => clearTimeout(t);
  }, [isPlaying, pasoIndex, avanzarPaso, acciones.length, speed]);

  // ========== VISUALIZACIÓN DE MENSAJES ==========
  
  /**
   * messageLineData: Datos calculados para renderizar la línea de mensaje
   * Incluye:
   * - line: Elemento visual de la línea conectando dos nodos
   * - payload: Datos adicionales (usado en Ring para mostrar lista de IDs)
   */
  const [messageLineData, setMessageLineData] = useState<{
    line: React.ReactNode;
    payload: React.ReactNode;
  } | null>(null);

  /**
   * EFECTO 4: Cálculo dinámico de líneas de mensaje
   *
   * Propósito: Dibujar una línea animada entre dos nodos cuando hay un mensaje activo
   */
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
    const fromEl = document.getElementById(`node-${mensajeActual.fromId}`);
    const toEl = document.getElementById(`node-${mensajeActual.toId}`);

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
      const dist = Math.sqrt(dx * dx + dy * dy); // Distancia euclidiana (Pitágoras)
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // Ángulo en grados

      // Punto medio entre nodos (donde se dibujará la línea)
      const midX = (fcx + tcx) / 2;
      const midY = (fcy + tcy) / 2;

      // Determinar clase CSS según tipo de mensaje
      let lineClass = "message-line";
      if (mensajeActual.tipo === "ok") {
        lineClass += " message-line-ok"; // Estilo para respuestas OK (Bully)
      } else if (mensajeActual.tipo === "ring2") {
        lineClass += " message-line-ring2"; // Estilo para anuncios (Ring fase 2)
      }

      // Estilos inline para posicionar y rotar la línea
      const style: CSSProperties = {
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

      // Para Ring fase 1: mostrar lista de IDs acumulados
      let payload = null;
      if (mensajeActual.tipo === "ring1" && mensajeActual.payload?.length) {
        payload = (
          <div
            className="message-payload"
            style={{ left: midX, top: midY - 18 }}
          >
            [{mensajeActual.payload.join(", ")}]
          </div>
        );
      }

      // Guardar elementos calculados
      setMessageLineData({ line, payload });
    });

    // Cleanup: cancelar animationFrame si el efecto se re-ejecuta
    return () => cancelAnimationFrame(requestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensajeActual, nodos.length]);

  // Extraer elementos para renderizado
  const messageLine = messageLineData?.line || null;
  const messagePayload = messageLineData?.payload || null;

  // ========== RENDERIZADO DEL COMPONENTE ==========
  
  /**
   * ESTRUCTURA DE LA UI:
   *
   * La interfaz se divide en 3 paneles principales:
   * 1. Panel de Controles (izquierda): Configuración y botones de control
   * 2. Canvas de Simulación (centro): Visualización de nodos y mensajes
   * 3. Panel de Logs (derecha): Registro de eventos cronológico
   */
  return (
    <div className="simulation-container">
      {/* ===== PANEL 1: CONTROLES ===== */}
      <Panel title="Controles" className="panel-controles">
        
        {/* ===== INSTRUCCIONES DESPLEGABLES (AL INICIO) ===== */}
        <div className="instructions-box">
          <button 
            className="instructions-header"
            onClick={() => setInstructionsOpen(!instructionsOpen)}
            aria-expanded={instructionsOpen ? "true" : "false"}
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
                <strong>1. Generar nodos:</strong> Crea los nodos del sistema distribuido
              </li>
              <li>
                <strong>2. Seleccionar iniciador:</strong> Elige el nodo que detecta la falla del líder
              </li>
              <li>
                <strong>3. Iniciar elección:</strong> Ejecuta el algoritmo automáticamente
              </li>
              <li>
                <strong>Tip:</strong> Haz clic en los nodos para simular fallos
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
            aria-expanded={configOpen ? "true" : "false"}
          >
            <span className="accordion-title">
              Configuración
              {!configOpen && (
                <span className="accordion-summary">
                  {numNodos} nodos, {algoritmoActivo === "bully" ? "Bully" : "Ring"}
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
                    onChange={(e) => setAlgoritmoActivo(e.target.value as Algorithm)}
                  >
                    <option value="bully">Bully</option>
                    <option value="ring">Ring</option>
                  </select>
                </label>
              </div>

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

              <button className="btn-primary" onClick={handleGenerarNodos}>
                Generar Nodos
              </button>
            </div>
        </div>

        {/* ===== ACORDEÓN 2: CONTROLES DE SIMULACIÓN ===== */}
        <div className="control-accordion">
          <button 
            className="accordion-header"
            onClick={() => setControlsOpen(!controlsOpen)}
            aria-expanded={controlsOpen ? "true" : "false"}
          >
            <span className="accordion-title">
              Controles de Simulación
            </span>
            <span className={`toggle-icon ${controlsOpen ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          
          <div className={`accordion-content ${controlsOpen ? 'is-open' : 'is-closed'}`}>
              <button
                className="btn-secondary"
                onClick={() => setModoIniciador(true)}
              >
                Seleccionar Iniciador
              </button>

              <div className="btn-row">
                <button className="btn-primary" onClick={handleIniciarEleccion}>
                  Iniciar Elección
                </button>

                <button
                  className="btn-ghost small"
                  onClick={() => {
                    setNodos([]);
                    setLeaderId(null);
                    setRecentLeaderId(null);
                    setNodoIniciador(null);
                    setAcciones([]);
                    setPasoIndex(0);
                    setIsPlaying(false);
                    setMensajeActual(null);
                    setLogs([
                      "[t=0] Simulador reiniciado.",
                      "[t=1] Genera nodos para comenzar de nuevo.",
                    ]);
                  }}
                >
                  🔄
                </button>
              </div>

              <div className="btn-row">
                <button className="btn-ghost small" onClick={handlePlay}>
                  ▶ Play
                </button>
                <button className="btn-ghost small" onClick={handlePause}>
                  ⏸ Pause
                </button>
                <button className="btn-ghost small" onClick={handlePaso}>
                  ⏭ Paso
                </button>
              </div>
            </div>
        </div>
      </Panel>

      {/* ===== PANEL 2: CANVAS DE SIMULACIÓN ===== */}
      <Panel
        title={`Simulación – ${
          algoritmoActivo === "bully" ? "Bully" : "Ring"
        }`}
        className="simulation-canvas"
      >
        {/* Mostrar placeholder si no hay nodos generados */}
        {nodos.length === 0 ? (
          <div className="canvas-placeholder">
            <p>Aquí se mostrarán los nodos y los mensajes.</p>
            <p className="info-hint">
              Genera nodos y selecciona un iniciador para comenzar.
            </p>
          </div>
        ) : (
          // Canvas activo con nodos y mensajes
          <div className="canvas-area" ref={canvasRef}>
            <div className="canvas-nodes">
              {/* Línea animada que conecta nodos durante mensajes */}
              {messageLine}
              
              {/* Lista de IDs acumulados (solo en Ring fase 1) */}
              {messagePayload}

              {/* Overlay de texto superior mostrando tipo y dirección del mensaje */}
              {mensajeActual && (
                <div className="message-overlay">
                  {mensajeActual.tipo === "election" && "ELECCIÓN:"}{" "}
                  {mensajeActual.tipo === "ok" && "OK:"}{" "}
                  {mensajeActual.tipo === "ring1" && "RING – Fase 1:"}{" "}
                  {mensajeActual.tipo === "ring2" && "RING – Anuncio:"}{" "}
                  {mensajeActual.fromId} → {mensajeActual.toId}
                </div>
              )}

              {/* Renderizar cada nodo con su posición calculada y propiedades */}
              {nodos.map((n, i) => {
                // Calcular posición visual según el algoritmo
                const pos = getPosicionNodo(
                  i,
                  nodos.length,
                  algoritmoActivo
                );

                return (
                  <Nodo
                    key={n.id}
                    id={n.id}
                    isLeader={leaderId === n.id}              // ¿Es el líder actual?
                    isFailed={n.failed}                       // ¿Está fallado?
                    isHighlighted={n.highlighted}             // ¿Debe resaltarse?
                    isInitiator={nodoIniciador === n.id}      // ¿Es el iniciador?
                    justBecameLeader={recentLeaderId === n.id} // ¿Acaba de ser líder? (animación)
                    style={pos}                               // Posición CSS
                    onClick={() => {
                      // Comportamiento del clic según el modo:
                      if (modoIniciador) {
                        // Modo selección: marcar como iniciador
                        seleccionarIniciador(n.id);
                      } else {
                        // Modo normal: fallar/revivir nodo
                        toggleFallarNodo(n.id);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </Panel>

      {/* ===== PANEL 3: REGISTRO DE EVENTOS (LOGS) ===== */}
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
            <div className="log-item" key={i}>
              {log}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default ElectionSimulator;
