// ══════════════════════════════════════════════════════════════════════════════
// Carga y normalización del dataset colonial (colonial_resources_doi.csv)
// El CSV no trae coordenadas, así que se geocodifica por país actual / región.
// La "confianza" se deriva del tipo de fuente (DOI > ISBN > archivo > web).
// ══════════════════════════════════════════════════════════════════════════════
import csvRaw from "../../colonial_resources_doi.csv?raw";

// ── Parser CSV robusto (maneja comillas y comas internas) ─────────────────────
function parseCSV(text) {
  const rows = [];
  let field = "", row = [], inQuotes = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ── Geocodificación aproximada: colonia (país actual) → [lat, lon] ────────────
const COLONY_COORDS = {
  "México": [19.4, -99.1],
  "México/Guatemala": [17.0, -94.0],
  "Bolivia/Perú": [-19.58, -65.75],
  "Perú": [-12.0, -76.5],
  "Colombia": [4.6, -74.1],
  "Brasil": [-12.97, -38.5],
  "India": [22.0, 79.0],
  "Bangladesh": [23.7, 90.4],
  "Sri Lanka": [7.3, 80.6],
  "Myanmar": [19.5, 96.0],
  "Indonesia": [-6.2, 106.8],
  "Malasia": [3.5, 102.0],
  "Filipinas": [14.6, 121.0],
  "Vietnam": [10.0, 105.8],
  "Vietnam/Laos": [18.0, 105.0],
  "Sudáfrica": [-28.7, 24.8],
  "Dem. Rep. Congo": [-4.0, 21.8],
  "Argelia": [36.7, 3.0],
  "Senegal/Mali/Guinea": [13.5, -10.0],
  "Zambia/Zimbabwe": [-13.0, 28.0],
  "Zimbabwe": [-19.0, 29.8],
  "Nigeria": [9.0, 8.7],
  "Ghana": [6.2, -1.6],
  "Sierra Leona": [8.5, -11.8],
  "Sierra Leona/Ghana": [7.5, -9.0],
  "Mozambique/Angola": [-18.7, 35.5],
  "Angola": [-12.3, 16.9],
  "Tanzania": [-6.4, 35.0],
  "Eritrea/Libia": [15.3, 38.9],
  "África Occidental": [6.4, 2.6],
  "Cuba/Caribe": [21.5, -79.5],
  "Jamaica/Caribe": [18.1, -77.3],
  "Trinidad/Caribe": [10.5, -61.3],
  "Haití": [18.9, -72.3],
  "USA": [37.5, -77.4],
  "Canadá": [47.5, -52.7],
  "Canadá/USA": [45.0, -68.0],
  "Argentina/Uruguay": [-34.0, -58.0],
  "Argentina/Antártida": [-51.7, -59.0],
  "Australia": [-33.8, 147.0]
};

const REGION_COORDS = {
  "América Latina": [-10, -60],
  "América del Norte": [40, -100],
  "América del Sur": [-20, -60],
  "Asia": [20, 100],
  "África": [0, 20],
  "África del Norte": [28, 15],
  "Oceanía": [-25, 140]
};

// ── Capital (metrópoli) de cada imperio: destino de los flujos [lat, lon] ──────
export const EMPIRE_CAPITALS = {
  "España": { name: "Madrid", coords: [40.42, -3.70] },
  "Portugal": { name: "Lisboa", coords: [38.72, -9.14] },
  "Gran Bretaña": { name: "Londres", coords: [51.51, -0.13] },
  "Francia": { name: "París", coords: [48.86, 2.35] },
  "Holanda": { name: "Ámsterdam", coords: [52.37, 4.90] },
  "Bélgica": { name: "Bruselas", coords: [50.85, 4.35] },
  "Italia": { name: "Roma", coords: [41.90, 12.50] },
  "Alemania": { name: "Berlín", coords: [52.52, 13.40] }
};

// Imperios combinados ("Portugal/Gran Bretaña"): se usa el primero como metrópoli
export function capitalOf(imperio) {
  const first = (imperio || "").split("/")[0].trim();
  return EMPIRE_CAPITALS[first] || null;
}

// ── Confianza derivada del tipo de fuente ─────────────────────────────────────
function confidenceFrom(doiIsbn) {
  const s = (doiIsbn || "").toLowerCase();
  if (s.includes("doi:")) return 5;
  if (s.includes("isbn:")) return 4;
  if (s.includes("erc grant") || s.includes("archivo")) return 3;
  if (s.includes("wikipedia") || s.includes("http")) return 2;
  return 3;
}

function intensityFrom(pct) {
  if (pct == null) return 2;
  if (pct >= 50) return 3;
  if (pct >= 20) return 2;
  return 1;
}

function num(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s.toUpperCase() === "ND") return null;
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// ── Construcción del dataset normalizado ──────────────────────────────────────
const rows = parseCSV(csvRaw.trim());
const header = rows[0];
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
const SHIFT_FROM = idx["periodo_inicio"]; // columnas a partir de aquí se corren

export const DATASET = rows.slice(1).map(r => {
  // Algunas filas del CSV traen la columna `recurso` vacía (el nombre quedó en
  // `subcategoria`) más una coma extra al final, lo que desplaza todas las
  // columnas posteriores. Se detecta porque `recurso` contiene un año, y se
  // remapea: el nombre se toma de `subcategoria` y las columnas
  // periodo_inicio..notas se leen una posición a la izquierda (doi_isbn se queda).
  const shifted = /^\d{3,4}$/.test((r[idx["recurso"]] ?? "").trim());
  const get = (k) => {
    const j = idx[k];
    if (shifted) {
      if (k === "recurso") return (r[idx["subcategoria"]] ?? "").trim();
      if (k === "doi_isbn") return (r[j] ?? "").trim();
      if (j >= SHIFT_FROM) return (r[j - 1] ?? "").trim();
    }
    return (r[j] ?? "").trim();
  };
  const imperio = get("imperio");
  const pais = get("pais_actual");
  const region = get("region");
  const coords = COLONY_COORDS[pais] || REGION_COORDS[region] || null;
  const cap = capitalOf(imperio);
  const pct = num(get("porcentaje_produccion_mundial_pico"));
  const quantity = num(get("volumen_total"));
  return {
    id: get("id"),
    imperio,
    colonia: get("colonia"),
    pais_actual: pais,
    region,
    categoria: get("categoria"),
    subcategoria: get("subcategoria"),
    recurso: get("recurso"),
    year_start: num(get("periodo_inicio")),
    year_end: num(get("periodo_fin")),
    quantity,
    unit: get("unidad") === "ND" ? null : get("unidad"),
    valor_usd: get("valor_usd1960_estimado") === "ND" ? null : get("valor_usd1960_estimado"),
    pct_world: pct,
    labor: get("tipo_mano_obra"),
    environmental_impact: get("impacto_ambiental"),
    source: get("fuente_principal"),
    notes: get("notas"),
    doi_isbn: get("doi_isbn"),
    confidence: confidenceFrom(get("doi_isbn")),
    intensity: intensityFrom(pct),
    lat: coords ? coords[0] : null,
    lon: coords ? coords[1] : null,
    dest: cap ? cap.coords : null,
    capital: cap ? cap.name : null
  };
}).filter(d => d.year_start != null);

// ── Listas únicas para los filtros ────────────────────────────────────────────
const uniq = (arr) => [...new Set(arr)].filter(Boolean).sort();
export const IMPERIOS = uniq(DATASET.map(d => d.imperio));
export const CATEGORIAS = uniq(DATASET.map(d => d.categoria));
export const REGIONES = uniq(DATASET.map(d => d.region));

export const YEAR_MIN = Math.min(...DATASET.map(d => d.year_start));
export const YEAR_MAX = Math.max(...DATASET.map(d => d.year_end));
