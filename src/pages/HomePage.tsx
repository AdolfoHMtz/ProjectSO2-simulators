// ============================================================================
// HOME PAGE
// ============================================================================

/**
 * ESTRUCTURA:
 * - Descripción general del proyecto
 * - Dos tarjetas (cards) con información de cada simulador
 * - Links de navegación hacia las rutas específicas
 */

import { Link } from "react-router-dom";

/**
 * HomePage: Componente funcional que renderiza la página de inicio
 * Es un componente sin estado (stateless) que solo presenta información
 * y proporciona enlaces de navegación a los simuladores.
 */
function HomePage() {

  return (
    <div className="home-container">
      {/* Descripción introductoria del proyecto */}
      <p className="home-description">
        Da click en alguno de los simuladores para visualizar el comportamiento
        de los algoritmos de sistemas distribuidos.
      </p>
      {/* Contenedor en grid para las tarjetas de simuladores */}
      <div className="cards-grid">
        
        {/* ===== TARJETA 1: SIMULADOR DE ELECCIÓN DE LÍDER ===== */}
        <div className="card-opcion">
          <h2>Simulador de Elección de Líder</h2>
          <p>
            Aprende cómo los procesos eligen un coordinador cuando el líder
            falla, utilizando los algoritmos <strong>Bully</strong> y {" "}
            <strong>Ring</strong>.
          </p>

          <p className="card-label">En este simulador podrás:</p>

          {/* Lista de características del simulador */}
          <ul className="card-list">
            <li>Generar nodos con identificadores</li>
            <li>Simular la caída del líder</li>
            <li>Observar el intercambio de mensajes</li>
            <li>Ver cómo se elige un nuevo líder paso a paso</li>
          </ul>

          {/* Link de navegación hacia el simulador de elección */}
          <Link to="/election" className="btn-primary">
            Entrar al simulador
          </Link>
        </div>

        {/* ===== TARJETA 2: SIMULADOR DE SINCRONIZACIÓN DE RELOJES ===== */}
        <div className="card-opcion">
          <h2>Simulador de Sincronización de Relojes</h2>
          <p>
            Explora cómo se sincronizan los relojes de distintos nodos mediante
            los algoritmos <strong>Cristian</strong> y <strong>Berkeley</strong>
            .
          </p>

          <p className="card-label">En este simulador podrás:</p>

          {/* Lista de características del simulador */}
          <ul className="card-list">
            <li>Generar nodos con relojes desincronizados</li>
            <li>Simular latencias de red</li>
            <li>Aplicar sincronización basada en una referencia</li>
            <li>Visualizar los ajustes finales en cada nodo</li>
          </ul>

          {/* Link de navegación hacia el simulador de relojes */}
          <Link to="/clocks" className="btn-secondary">
            Entrar al simulador
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
