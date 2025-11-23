// ============================================================================
// APP.TSX
// ============================================================================

/**
 * Este es el componente principal de la aplicación React.
 *
 * PROPÓSITO:
 * - Definir todas las rutas (páginas) de la aplicación
 * - Envolver la aplicación en el Layout común
 * - Actuar como punto de entrada de la jerarquía de componentes
 *
 * ARQUITECTURA DE RUTAS:
 * La aplicación usa React Router v6 para navegación SPA (Single Page Application)
 * Esto significa que no hay recargas de página, solo cambios de contenido.
 *
 * RUTAS DEFINIDAS:
 * - "/" → HomePage (página de inicio con las dos opciones)
 * - "/election" → ElectionSimulator (simulador de elección de líder)
 * - "/clocks" → ClockSyncSimulator (simulador de sincronización de relojes)
 */

import { Routes, Route } from "react-router-dom"; // Componentes de routing

// ===== IMPORTACIÓN DE PÁGINAS =====
import HomePage from "./pages/HomePage";                   // Página de inicio
import ElectionSimulator from "./pages/ElectionSimulator"; // Simulador Bully/Ring
import ClockSyncSimulator from "./pages/ClockSyncSimulator"; // Simulador Cristian/Berkeley

// ===== IMPORTACIÓN DE LAYOUT =====
import Layout from "./components/Layout"; // Estructura común (header + nav)

/**
 * App: Componente principal de la aplicación
 *
 * ESTRUCTURA:
 * <Layout> (header + navegación)
 *   <Routes> (contenedor de rutas)
 *     <Route> (cada ruta individual)
 *
 * NOTA IMPORTANTE:
 * El Layout envuelve TODAS las rutas, por lo que el header
 * y la navegación están presentes en todas las páginas.
 */
function App() {
  return (
    <Layout>
      {/* Contenedor de todas las rutas */}
      <Routes>
        {/* Ruta raíz: Página de inicio */}
        <Route path="/" element={<HomePage />} />
        {/* Ruta /election: Simulador de elección de líder */}
        <Route path="/election" element={<ElectionSimulator />} />
        {/* Ruta /clocks: Simulador de sincronización de relojes */}
        <Route path="/clocks" element={<ClockSyncSimulator />} />
      </Routes>
    </Layout>
  );
}

export default App;
