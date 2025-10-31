# Mapa Ecológico - Frontend

Aplicación web desarrollada con Vite + React para la gestión de puntos ecológicos en un mapa interactivo.

## Características

- **Autenticación**: Login y registro de usuarios
- **Mapa Interactivo**: Visualización de puntos ecológicos en un mapa con múltiples capas
- **Filtros y Búsqueda**: Filtrar puntos por tipo o buscar por nombre
- **Gestión de Puntos**: Agregar, editar y eliminar puntos ecológicos
- **Análisis**: Calcular rutas y crear buffers alrededor de puntos
- **Reportes**: Estadísticas de puntos agrupadas por tipo o estado

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Producción

```bash
npm run build
```

Los archivos de producción se generarán en la carpeta `dist`

## Configuración

Crea un archivo `.env` en la raíz del proyecto con:

```
VITE_API_URL=http://localhost:3000/api
```

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── contexts/       # Contextos de React (Auth)
│   ├── pages/          # Páginas principales
│   ├── services/       # Servicios API
│   └── App.jsx         # Componente principal
├── public/             # Archivos públicos
└── package.json
```

## Tecnologías

- React 18
- Vite
- React Router DOM
- Leaflet / React-Leaflet
- Axios
- Turf.js

