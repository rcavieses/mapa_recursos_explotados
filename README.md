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

## Autores

- **Ricardo Cavieses Núñez** — Dpto. de Ing. en Pesquerías, Universidad Autónoma
  de Baja California Sur, México. [ORCID 0000-0002-8072-5583](https://orcid.org/0000-0002-8072-5583), cavieses@uabcs.mx
- **Diana Peña-Bastalla** — Department of Anthropology, University of California,
  San Diego, USA.

## How to cite

Cavieses Núñez, R., & Peña-Bastalla, D. (2026). Atlas Colonial: Mapa de recursos
explotados [Interactive visualization]. Zenodo. https://doi.org/10.5281/zenodo.20737277

```bibtex
@software{atlas_colonial_2026,
  author = {Cavieses Núñez, Ricardo and Peña-Bastalla, Diana},
  title = {Atlas Colonial: Mapa de recursos explotados},
  year = {2026},
  doi = {10.5281/zenodo.20737277},
  url = {https://github.com/rcavieses/mapa_recursos_explotados}
}
```

## 