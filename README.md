# Simulador de Sistemas Distribuidos

<div align="center">

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6.28.0-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

<div align="center">

### Proyecto Final - Sistemas Operativos II

### 🚀 [Ver Aplicación en Vivo](https://proyectoso-eq8-simuladores.netlify.app)

</div>

## 👥 Integrantes del Equipo

**Desarrollado por Equipo 8 - BUAP|FCC**

| Nombre                           | Matrícula |
| -------------------------------- | --------- |
| **Adolfo Huerta Martínez**       | 202262175 |
| **Daniel Hernández Garcia**      | 202261809 |
| **Hector Luis Sanchez Marín**    | 202278487 |
| **José Fernando Vargas Tecualt** | 202269605 |
| **Jarni Didier González Ortega** | 202274229 |

---

## Descripción del Proyecto

Este proyecto es una **aplicación web interactiva** que simula visualmente dos categorías fundamentales de algoritmos en sistemas distribuidos:

### 1. Algoritmos de Elección de Líder

- **Bully Algorithm**: Algoritmo agresivo donde el nodo con mayor ID se convierte en líder
- **Ring Algorithm**: Algoritmo basado en anillo donde los mensajes circulan recopilando información

### 2. Algoritmos de Sincronización de Relojes

- **Cristian Algorithm**: Sincronización cliente-servidor utilizando RTT (Round-Trip Time)
- **Berkeley Algorithm**: Sincronización por promediación coordinada de todos los relojes

La aplicación permite experimentar con diferentes configuraciones, observar el comportamiento paso a paso, y visualizar mensajes entre nodos en tiempo real.

---

## ✨ Características Principales

### Interfaz de Usuario

- ✅ **Diseño responsivo** adaptado para móvil, tablet y desktop
- ✅ **Animaciones fluidas** de mensajes entre nodos
- ✅ **Menú hamburguesa** para dispositivos móviles
- ✅ **Acordeones desplegables** en controles (móvil)

### Funcionalidades

- ✅ **Generación de nodos** con IDs aleatorios
- ✅ **Simulación paso a paso** con controles de reproducción
- ✅ **Velocidad ajustable** (0.5x, 1x, 2x)
- ✅ **Logs detallados** con timestamps
- ✅ **Estados visuales claros** (líder, caído, activo, iniciador)

### Simulador de Elección

- Selección de iniciador interactiva
- Visualización de mensajes ELECTION, OK, RING1, RING2
- Identificación clara del líder elegido
- Logs con descripción de cada paso

### Simulador de Relojes

- Servidor/Coordinador visible (ID:0)
- Display LED con efecto de brillo
- Badges de roles (server, coordinator, client)
- Colores de sincronización (verde, amarillo, rojo)
- RTT visible en algoritmo Cristian
- Valores before→after en logs

---

## Tecnologías Utilizadas

### Frontend Framework

- **React 18.3.1** - Librería de UI con hooks modernos
- **TypeScript 5.9.3** - Superset tipado de JavaScript
- **React Router DOM 6.28.0** - Enrutamiento SPA

### Build Tools

- **Vite 7.2.2** - Build tool ultra-rápido con HMR
- **SWC** - Compilador de JavaScript/TypeScript en Rust

### Deployment

- **Netlify** - Hosting con CI/CD automático

---

## Algoritmos Implementados

### 🏆 Bully Algorithm (Elección de Líder)

**Concepto**: Algoritmo "agresivo" donde el nodo con mayor ID siempre gana la elección.

**Pasos del Algoritmo**:

1. Un nodo detecta que el líder ha fallado
2. El nodo envía mensajes de **ELECTION** a todos los nodos con ID superior
3. Si recibe respuestas **OK**, se detiene (hay nodos superiores activos)
4. Si no recibe respuestas, se proclama líder
5. El nuevo líder envía mensajes **COORDINATOR** a todos

**Características**:

- Simple y eficiente
- Requiere conocimiento de todos los IDs
- El nodo con mayor ID siempre es el líder

---

### 🔄 Ring Algorithm (Elección de Líder)

**Concepto**: Los nodos están organizados en un anillo lógico, el mensaje circula recopilando información.

**Fases del Algoritmo**:

**Fase 1 - ELECCIÓN**:

1. Nodo iniciador detecta falla del líder
2. Crea mensaje con su ID y lo envía al siguiente nodo
3. Cada nodo agrega su ID al mensaje
4. El mensaje circula por todo el anillo
5. Cuando regresa al iniciador, contiene todos los IDs activos

**Fase 2 - ANUNCIO**:

1. El iniciador determina el líder (ID más alto)
2. Envía mensaje de anuncio con el ID del líder
3. El mensaje circula informando a todos
4. Cada nodo actualiza su conocimiento del líder

**Características**:

- No requiere broadcast
- Tolera múltiples iniciadores simultáneos
- Requiere estructura de anillo

---

### 🕒 Cristian Algorithm (Sincronización de Relojes)

**Concepto**: Sincronización cliente-servidor basada en Round-Trip Time (RTT).

**Pasos del Algoritmo**:

1. Cliente registra tiempo local `T1`
2. Cliente envía **REQUEST** al servidor
3. Servidor responde con su hora `Ts`
4. Cliente recibe respuesta en tiempo `T2`
5. Cliente calcula RTT = `T2 - T1`
6. Cliente estima tiempo de transmisión = `RTT / 2`
7. Cliente ajusta su reloj: `Ts + (RTT / 2)`

**Fórmula de Ajuste**:

```
offsetCliente = (Ts + RTT/2) - horaLocal
```

**Características**:

- Simple y eficiente
- Asume latencias simétricas
- Servidor no se ajusta (es la referencia)
- Clientes realizan ajustes independientes

---

### ⚖️ Berkeley Algorithm (Sincronización de Relojes)

**Concepto**: Sincronización cooperativa por promediación coordinada.

**Pasos del Algoritmo**:

**Fase 1 - POLL (Recopilación)**:

1. Coordinador solicita hora a cada nodo
2. Cada nodo responde con su hora local

**Fase 2 - CÁLCULO**:

1. Coordinador calcula promedio de todas las horas
2. Coordinador calcula ajuste para cada nodo:
   ```
   ajuste = promedio - horaNodo
   ```

**Fase 3 - DISTRIBUCIÓN**:

1. Coordinador envía ajuste a cada nodo
2. Cada nodo aplica su ajuste específico

**Fase 4 - APLICACIÓN**:

1. Todos los nodos ajustan simultáneamente
2. Sistema queda sincronizado al promedio

**Características**:

- Democrático (considera todos los relojes)
- Coordinador también se ajusta
- Elimina valores atípicos
- Más robusto que Cristian

---

## Instalación y Configuración

### Prerrequisitos

Asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 o **pnpm** >= 8.0.0

### Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/AdolfoHMtz/ProjectSO2-simulators.git

# Navegar al directorio
cd proyectoSO
```

### Instalar Dependencias

```bash
# Con npm
npm install

# O con pnpm (más rápido)
pnpm install
```

### Ejecutar en Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en:
# http://localhost:5173
```

### Compilar para Producción

```bash
# Compilar proyecto
npm run build

# Vista previa de la build
npm run preview
```

---

## 📂 Estructura del Proyecto

```
proyectoSO/
├── public/
│   └── _redirects              # Configuración de Netlify
├── src/
│   ├── assets/                 # Recursos estáticos
│   ├── components/             # Componentes reutilizables
│   │   ├── Layout.tsx          # Header + navegación
│   │   ├── Nodo.tsx            # Nodo visual
│   │   └── Panel.tsx           # Contenedor de secciones
│   ├── pages/                  # Páginas principales
│   │   ├── HomePage.tsx        # Página inicial
│   │   ├── ElectionSimulator.tsx    # Simulador Bully/Ring
│   │   └── ClockSyncSimulator.tsx   # Simulador Cristian/Berkeley
│   ├── styles/                 # CSS modular
│   │   ├── base.css            # Variables y reset
│   │   ├── header.css          # Navegación
│   │   ├── buttons.css         # Botones
│   │   ├── panels.css          # Paneles y canvas
│   │   ├── forms.css           # Inputs y acordeones
│   │   ├── home.css            # Homepage
│   │   ├── canvas.css          # Área de simulación
│   │   ├── nodes.css           # Estilos de nodos
│   │   ├── clocks.css          # Relojes
│   │   ├── messages.css        # Líneas de mensajes
│   │   ├── logs.css            # Registro de eventos
│   │   └── helpers.css         # Utilidades
│   ├── App.tsx                 # Routing principal
│   ├── main.tsx                # Punto de entrada
│   └── index.css               # Importación de estilos
├── eslint.config.js            # Configuración ESLint
├── tsconfig.json               # Configuración TypeScript
├── vite.config.ts              # Configuración Vite
└── package.json                # Dependencias y scripts
```

---

## Guía de Uso

### Simulador de Elección de Líder

1. **Seleccionar Algoritmo**: Elige entre Bully o Ring
2. **Generar Nodos**: Especifica cantidad (3-12) y genera
3. **Seleccionar Iniciador**: Haz clic en "Seleccionar iniciador" y elige un nodo
4. **Iniciar Elección**: Presiona "Iniciar elección"
5. **Controlar Simulación**: Usa Play ▶️, Pause ⏸️, o Paso ⏭️
6. **Ajustar Velocidad**: Cambia entre 0.5x, 1x, 2x
7. **Fallar Nodos**: Haz clic en nodos activos para marcarlos como caídos

### Simulador de Sincronización de Relojes

1. **Seleccionar Algoritmo**: Elige entre Cristian o Berkeley
2. **Configurar Parámetros**:
   - Nodos: 2-12 (siempre incluye servidor/coordinador)
   - Latencia: 10-1000 ms
3. **Generar Relojes**: Los nodos tendrán offsets aleatorios (-3000 a +3000 ms)
4. **Iniciar Sincronización**: Presiona "Iniciar sincronización"
5. **Observar Proceso**: Sigue los pasos en logs y animaciones
6. **Verificar Sincronización**: Colores indican estado (verde = sincronizado)

---

## 🎨 Paleta de Colores

| Color             | Uso                | Hex       |
| ----------------- | ------------------ | --------- |
| 🔵 Azul Principal | Bordes, highlights | `#3c4fe0` |
| 🟣 Morado         | Gradientes, líder  | `#8c4dff` |
| ⚫ Fondo Oscuro   | Background         | `#050816` |
| ⚪ Texto Claro    | Texto principal    | `#f6f7fb` |
| 🟢 Verde          | Sincronizado, OK   | `#1aa34a` |
| 🔴 Rojo           | Desincronizado     | `#e74c3c` |
| 🟡 Amarillo       | Iniciador, parcial | `#e1b12c` |

---

## 🌐 Deployment

La aplicación está desplegada en **Netlify** con las siguientes configuraciones:

### Configuración de Build

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 📚 Documentación del Código

### Componentes Principales

#### `App.tsx`

- Configuración de rutas con React Router
- 3 rutas: `/` (home), `/election`, `/clocks`
- Layout común envuelve todas las rutas

#### `Layout.tsx`

- Header con información del proyecto
- Navegación con links activos
- Menú hamburguesa responsivo (móvil)

#### `ElectionSimulator.tsx`

- **1202 líneas** completamente documentadas
- Implementa algoritmos Bully y Ring
- Estados: nodos, acciones, pasoIndex, isPlaying, mensajeActual
- Funciones clave: `simularBully()`, `simularRingCompleto()`, `avanzarPaso()`

#### `ClockSyncSimulator.tsx`

- **996 líneas** completamente documentadas
- Implementa algoritmos Cristian y Berkeley
- Estados: nodos, acciones, pasoIndex, isPlaying, messageLineData
- Funciones clave: `simularCristian()`, `simularBerkeley()`, `generarRelojes()`

#### `Nodo.tsx`

- Componente visual de nodo
- Props: id, isLeader, isFailed, isHighlighted, isInitiator
- Estados visuales dinámicos
- Iconos: 💀 (caído), 👑 (líder)

#### `Panel.tsx`

- Contenedor reutilizable
- Props: title, children, className
- Renderizado condicional de título

### Arquitectura CSS

El proyecto utiliza **13 archivos CSS modulares**:

1. **base.css**: Variables, reset, responsive base
2. **header.css**: Navegación y menú hamburguesa
3. **buttons.css**: Estilos de botones con estados
4. **panels.css**: Paneles y canvas con scroll
5. **forms.css**: Inputs, selects, acordeones
6. **home.css**: Homepage y cards
7. **canvas.css**: Área de simulación
8. **nodes.css**: Nodos con animaciones
9. **clocks.css**: Display LED y badges de roles
10. **messages.css**: Líneas animadas de mensajes
11. **logs.css**: Registro de eventos
12. **helpers.css**: Utilidades varias

### Gracias
