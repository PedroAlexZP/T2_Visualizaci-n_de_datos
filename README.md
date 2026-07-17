# TA2 - Visualización de Datos: Ventas SRI Ecuador 2023-2024

Scrollytelling interactivo con scroll horizontal que presenta hallazgos sobre ventas del SRI de Ecuador, comparando 2023 vs 2024.

## Estructura del proyecto

```
├── index.html              ← Página principal con scroll horizontal
├── README.md
├── assets/
│   ├── css/
│   │   └── styles.css      ← Estilos globales y responsive
│   ├── js/
│   │   ├── main.js         ← Lógica del scroll, navegación, utilidades y boot
│   │   └── charts/
│   │       ├── hallazgo1_linechart_estacionalidad.js
│   │       ├── hallazgo2_lollipop_variacion_positiva.js
│   │       ├── hallazgo3_lollipop_variacion_negativa.js
│   │       └── hallazgo4_treemap_provincias.js
│   └── img/
├── data/
│   ├── sri_ventas_2023.csv
│   ├── sri_ventas_2024.csv
│   ├── sri_ventas_story.json
│   ├── sri_ventas_monthly_sectors.json
│   └── sri_ventas_province_sectors.json
└── scripts/
    ├── preprocess_sri.py
    ├── generate_monthly_sectors.py
    └── generate_province_sectors.py
```

## Tecnologías

- **HTML5 / CSS3 / JavaScript ES6+**
- **Plotly.js** — gráficos interactivos (líneas, lollipops, treemap)
- **GSAP + ScrollTrigger** — animaciones y scroll horizontal
- **Python / pandas** — preprocesamiento de datos del SRI

## Hallazgos

1. **Estacionalidad** — Diciembre concentra el mayor volumen; febrero es el piso.
2. **Crecimiento sectorial** — Mayor subida porcentual en un segmento pequeño.
3. **Caída sectorial** — La peor caída también en un segmento pequeño, pero el golpe absoluto pesa en sectores mayores.
4. **Concentración provincial** — Pichincha y Guayas concentran ~80% del total nacional.

## Ejecución

```bash
# Preprocesar datos (requiere Python 3.12+ y pandas)
python scripts/preprocess_sri.py
python scripts/generate_monthly_sectors.py
python scripts/generate_province_sectors.py

# Servir localmente
python -m http.server 8000
# Abrir http://localhost:8000
```

## Integrantes

- Alay Pedro
- Casanova Diego
- Delgado Jostin
- Zambrano Pedro

**Docente:** Ing. Anthony Legarda Albiño
**Carrera:** Software
