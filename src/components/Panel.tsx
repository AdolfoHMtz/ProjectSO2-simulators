// ============================================================================
// PANEL COMPONENT - Componente contenedor reutilizable
// ============================================================================

/**
 * Este componente proporciona un contenedor estilizado y consistente
 * para diferentes secciones de la interfaz.
 * 
 * PROPÓSITO:
 * - Crear una estructura visual uniforme en toda la aplicación
 * - Encapsular el estilo de "paneles" o "tarjetas"
 * - Proporcionar título opcional para cada sección
 * - Permitir personalización mediante className adicionales
 */

import type { ReactNode } from "react"; // Tipo para elementos hijos de React

/**
 * PanelProps: Define las propiedades que acepta el componente Panel
 */
interface PanelProps {
  title?: string;       // Opcional: título del panel
  children: ReactNode;  // Requerido: contenido interno
  className?: string;   // Opcional: clases CSS adicionales
}

/**
 * Panel: Componente funcional que renderiza un contenedor estilizado
 * 
 * FUNCIONAMIENTO:
 * 1. Recibe props con título, contenido y clases opcionales
 * 2. Aplica la clase base "panel-container" siempre
 * 3. Agrega clases adicionales si se proporcionan
 * 4. Renderiza el título solo si existe
 * 5. Renderiza el contenido (children) siempre
 */
function Panel({ title, children, className }: PanelProps) {
  return (
    <section className={`panel-container ${className ?? ""}`}>
      {/* Renderizado condicional: título solo si existe */}
      {title && <h2 className="panel-title">{title}</h2>}
      
      {/* Contenido interno del panel */}
      {children}
    </section>
  );
}

export default Panel;
