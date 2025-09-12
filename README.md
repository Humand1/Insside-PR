# 360° Performance Analytics Dashboard

Una aplicación web inteligente y adaptable para el análisis de evaluaciones de desempeño 360°. Procesa automáticamente archivos Excel con diferentes estructuras de evaluación y genera insights avanzados.

## 🚀 Características

- **Procesamiento Inteligente**: Detecta automáticamente la estructura de archivos Excel
- **Dashboard Interactivo**: Visualizaciones dinámicas con Chart.js
- **Análisis Adaptable**: Funciona con diferentes tipos de evaluación (ascendente, descendente, pares, autoevaluación)
- **Insights Avanzados**: Mapas de calor, rankings, métricas de completitud
- **Exportación**: Reportes en PDF y Excel
- **Responsive**: Optimizado para desktop y mobile

## 📊 Análisis Incluidos

### Métricas de Completitud
- Evaluaciones completadas vs pendientes
- Tasa de participación por área
- Timeline de progreso

### Comparación por Áreas
- Rankings por departamento
- Distribución de puntajes
- Análisis de variabilidad

### Mapa de Calor de Talento
- Identificación de top performers
- Detección de talento en riesgo
- Visualización por competencias

### Análisis de Feedback
- Upward feedback por líder
- Matriz de evaluaciones de pares
- Calidad de comentarios

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + React-Chartjs-2
- **Excel Processing**: SheetJS (xlsx)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **File Upload**: React Dropzone
- **Export**: jsPDF + html2canvas

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd web-app-pr

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── FileUpload.tsx     # Componente de carga de archivos
│   ├── Dashboard.tsx      # Dashboard principal
│   ├── Analytics/         # Componentes de análisis
│   └── Charts/           # Componentes de gráficos
├── lib/                  # Lógica de negocio
│   ├── excelParser.ts    # Parser inteligente de Excel
│   ├── dataProcessor.ts  # Procesamiento de datos
│   ├── analytics.ts      # Cálculos de métricas
│   └── types.ts         # Definiciones de tipos
└── utils/               # Utilidades
    ├── calculations.ts  # Funciones de cálculo
    └── exportUtils.ts   # Utilidades de exportación
```

## 🔧 Uso

1. **Subir Archivo**: Arrastra un archivo Excel al área de carga
2. **Procesamiento Automático**: La app detecta la estructura y procesa los datos
3. **Explorar Dashboard**: Navega por las diferentes visualizaciones
4. **Exportar Reportes**: Descarga reportes personalizados

## 📈 Tipos de Evaluación Soportados

- **Autoevaluación**: Evaluación personal del empleado
- **Evaluación Descendente**: Jefe evalúa subordinado
- **Evaluación Ascendente**: Subordinado evalúa jefe
- **Evaluación de Pares**: Evaluación entre colegas

## 🎯 Competencias Analizadas

- Compromiso
- Comunicación
- Orientación al Cliente
- Colaboración
- Iniciativa y Autonomía
- Orientación a Resultados
- Liderazgo

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Conectar con Vercel
vercel

# O usar Vercel CLI
npm i -g vercel
vercel --prod
```

### Otras Plataformas
- Netlify
- AWS Amplify
- Railway
- Render

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte y consultas, contacta a [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com)
