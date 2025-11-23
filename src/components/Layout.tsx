// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

/**
 * Este componente define el layout (estructura) general de toda la aplicación.
 *
 * PROPÓSITO:
 * - Proporcionar una estructura consistente en todas las páginas
 * - Incluir el header con información del proyecto y navegación
 * - Envolver el contenido de cada página en un contenedor principal
 *
 * PATRÓN DE DISEÑO:
 * - Layout Component: Envuelve todas las páginas con estructura común
 * - Composition Pattern: Usa {children} para inyectar contenido de páginas
 */

import { useState, type ReactNode } from "react";  // Hooks y tipos
import { Link } from "react-router-dom"; // Componente de navegación SPA

/**
 * LayoutProps: Define las propiedades que acepta el componente Layout
 */
interface LayoutProps {
  children: ReactNode; // Contenido que cambia según la ruta activa
}

/**
 * Layout: Componente funcional que renderiza la estructura base de la app
 * 
 * SECCIONES:
 * 1. Header:
 *    - Información del proyecto (título y descripción)
 *    - Navegación con enlaces a todas las páginas
 *    - Menú hamburguesa en móvil
 * 
 * 2. Main:
 *    - Contenedor para el contenido específico de cada página
 *    - Recibe el contenido mediante la prop {children}
 * 
 * NAVEGACIÓN:
 * Utiliza el componente Link de react-router-dom para navegación SPA
 * En móvil, el menú se despliega/oculta con un botón hamburguesa
 */
function Layout({ children }: LayoutProps) {
  // Estado para controlar si el menú móvil está abierto
  const [menuOpen, setMenuOpen] = useState(false);

  // Función para cerrar el menú al hacer clic en un link
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-container">
      
      {/* ===== HEADER: INFORMACIÓN Y NAVEGACIÓN ===== */}
      <header className="app-header">
        
        {/* Información del proyecto */}
        <div className="header-info">
          <h1>
            <span className="header-title-line1">Proyecto Sistemas Operativos 2 |</span>
            <span className="header-title-line2"> Equipo 8</span>
          </h1>
          <p className="header-subtitle">
            Simuladores de Sistemas Distribuidos: <br/>
            Elección de Líder & Sincronización de Relojes
          </p>
        </div>

        {/* Botón hamburguesa (solo visible en móvil) */}
        <button 
          className={`menu-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Barra de navegación con enlaces a todas las páginas */}
        <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          {/* Link a la página de inicio */}
          <Link to="/" onClick={closeMenu}>Inicio</Link>
          
          {/* Link al simulador de elección de líder */}
          <Link to="/election" onClick={closeMenu}>Elección de Líder</Link>
          
          {/* Link al simulador de sincronización de relojes */}
          <Link to="/clocks" onClick={closeMenu}>Sincronización de Relojes</Link>
        </nav>
      </header>

      {/* ===== MAIN: CONTENIDO DINÁMICO DE CADA PÁGINA ===== */}
      {/* 
        El contenido de {children} cambia según la ruta activa:
        - "/" → HomePage
        - "/election" → ElectionSimulator
        - "/clocks" → ClockSyncSimulator
      */}
      <main className="main-container">{children}</main>
    </div>
  );
}

export default Layout;
