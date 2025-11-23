// ============================================================================
// PROYECTO SO - Simulador de Algoritmos de Elección de Líder y Sincronización de Relojes
// Integrantes:
// - Adolfo Huerta Martínez - 202262175
// - Daniel Hernández Garcia - 202261809
// - Hector Luis Sanchez Marín - 202278487
// - José Fernando Vargas Tecualt - 202269605
// - Jarni Didier González Ortega - 202274229
// ============================================================================


import React from "react";                    // Librería principal de React
import ReactDOM from "react-dom/client";       // API para montar React en el DOM
import { BrowserRouter } from "react-router-dom"; // Router para navegación SPA
import App from "./App";                       // Componente raíz de nuestra app
import "./index.css";                          // Estilos globales de la aplicación

/**
 * MONTAJE DE LA APLICACIÓN:
 * 
 * 1. document.getElementById("root"):
 *    Busca el elemento <div id="root"> en index.html
 * 
 * 2. ReactDOM.createRoot(...):
 *    Crea un "root" de React 18 (nuevo API de rendering concurrente)
 * 
 * 3. .render(...):
 *    Renderiza la jerarquía de componentes dentro del root
 * 
 * JERARQUÍA DE COMPONENTES:
 * <React.StrictMode>              ← Modo estricto (solo desarrollo)
 *   <BrowserRouter>               ← Proveedor de routing
 *     <App />                     ← Componente raíz
 *       <Layout>                  ← Estructura común
 *         <Routes>                ← Configuración de rutas
 *           <Route ... />         ← Rutas individuales
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // StrictMode: Activa verificaciones adicionales en desarrollo
  // (no afecta producción, ayuda a encontrar bugs)
  <React.StrictMode>
    {/* BrowserRouter: Habilita navegación con URLs del navegador */}
    <BrowserRouter>
      {/* App: Nuestra aplicación completa */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
