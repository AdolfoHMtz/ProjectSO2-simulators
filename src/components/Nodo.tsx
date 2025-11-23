// ============================================================================
// NODO COMPONENT - Representación visual de un nodo en el sistema distribuido
// ============================================================================

/**
 * Este componente renderiza un nodo individual en las simulaciones.
 * 
 * PROPÓSITO:
 * - Mostrar visualmente un nodo/proceso del sistema distribuido
 * - Representar diferentes estados (activo, fallado, líder, etc.)
 * - Proporcionar feedback visual mediante colores y estilos
 * - Permitir interacción mediante clicks
 * ESTADOS VISUALES DEL NODO:
 * - Activo: Estado normal (color base)
 * - Caído: Nodo que ha fallado (gris, con emoji 💀)
 * - Líder: Nodo coordinador actual (dorado, con emoji 👑)
 * - Iniciador: Nodo que inicia una elección (borde especial)
 * - Resaltado: Nodo involucrado en una acción actual (brillo/glow)
 * - Recién proclamado líder: Animación de "coronación"
 */

import type { CSSProperties } from "react"; // Tipo para estilos CSS inline

/**
 * NodoProps: Interface que define todas las propiedades del componente Nodo
 */
interface NodoProps {
  id: number;                    // REQUERIDO: ID único
  isLeader?: boolean;            // Opcional: ¿es líder?
  isFailed?: boolean;            // Opcional: ¿está fallado?
  isHighlighted?: boolean;       // Opcional: ¿debe resaltarse?
  isInitiator?: boolean;         // Opcional: ¿es iniciador?
  justBecameLeader?: boolean;    // Opcional: ¿acaba de ser líder? (animación)
  style?: CSSProperties;         // Opcional: estilos de posición
  onClick?: () => void;          // Opcional: manejador de click
}

/**
 * Nodo: Componente funcional que renderiza un nodo con su estado visual
 * 
 * LÓGICA DE ESTADOS:
 * 1. Calcula el texto de estado según las props (prioridad: Caído > Líder > Iniciador > Activo)
 * 2. Construye dinámicamente las clases CSS según el estado
 * 3. Renderiza iconos apropiados (💀 para caído, 👑 para líder)
 * 4. Aplica estilos de posición mediante la prop style
 */
function Nodo({
  id,
  isLeader,
  isFailed,
  isHighlighted,
  isInitiator,
  justBecameLeader,
  style,
  onClick,
}: NodoProps) {
  // ========== DETERMINACIÓN DEL ESTADO TEXTUAL ==========
  
  /**
   * Determina qué texto mostrar según la prioridad de estados
   */
  let estado = "Activo";

  if (isFailed) {
    estado = "Caído";        // Máxima prioridad: nodo inoperativo
  } else if (isLeader) {
    estado = "Líder";        // Segunda prioridad: coordinador
  } else if (isInitiator) {
    estado = "Iniciador";    // Tercera prioridad: iniciador de elección
  }

  // ========== RENDERIZADO DEL NODO ==========

  return (
    <div
      // ID único en el DOM para referencias (usado en cálculo de líneas)
      id={`node-${id}`}
      
      // Construcción dinámica de clases CSS según estado
      className={[
        "node",                                                // Clase base
        isLeader ? "node-leader" : "",                        // Si es líder
        justBecameLeader ? "node-leader-new" : "",            // Si acaba de ser líder (animación)
        isFailed ? "node-failed" : "",                        // Si está caído
        isHighlighted ? "node-highlighted" : "",              // Si debe resaltarse
        isInitiator && !isLeader && !isFailed ? "node-initiator" : "", // Si es iniciador (no líder ni caído)
      ]
        .join(" ")   // Unir clases con espacios
        .trim()}     // Eliminar espacios extra
      
      style={style}     // Estilos inline (posicionamiento)
      onClick={onClick} // Manejador de click
    >
      {/* ===== FILA DE ICONOS ===== */}
      <div className="node-icon-row">
        {/* Emoji de calavera si el nodo está caído */}
        {isFailed && <span className="node-icon">💀</span>}
        
        {/* Emoji de corona si el nodo es líder y no está caído */}
        {!isFailed && isLeader && <span className="node-icon">👑</span>}
      </div>

      {/* ===== ETIQUETA CON EL ID ===== */}
      <div className="node-label">#{id}</div>
      
      {/* ===== TEXTO DE ESTADO ===== */}
      <div className="node-sub">{estado}</div>
    </div>
  );
}

export default Nodo;
