# Atlas Colonial — Mapa de recursos explotados

Visualización interactiva de los flujos de extracción de recursos durante la era
colonial: de la colonia de origen a la metrópoli de cada imperio.

- **Mapa Leaflet** con nube de partículas animada por flujo; la **densidad** ∝
  volumen extraído (escala logarítmica) y el **color** indica la calidad de la fuente.
- **Filtros** por año, imperio, categoría (minería, agricultura, forestal,
  alimentario), región y confianza mínima.
- **Pestaña de fuentes** consultable, con enlaces DOI/ISBN.

Datos: [`colonial_resources_doi.csv`](colonial_resources_doi.csv) (90 registros).

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo (Vite)
npm run build    # build de producción
npm run preview  # previsualizar el build
```

Stack: React 18 + Vite + Tailwind v4 + Leaflet.
