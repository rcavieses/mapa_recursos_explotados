import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  DATASET, IMPERIOS, CATEGORIAS, REGIONES, YEAR_MIN, YEAR_MAX, EMPIRE_CAPITALS
} from "./src/data/colonialData.js";

// ══════════════════════════════════════════════════════════════════════════════════
// ATLAS COLONIAL INTERACTIVO — VERSIÓN PUBLICABLE 2.0
// Datos: colonial_resources_doi.csv · Mapa Leaflet + nube de partículas + fuentes
// ══════════════════════════════════════════════════════════════════════════════════

const CONFIDENCE_COLORS = {
  5: "#1e40af", 4: "#2563eb", 3: "#f59e0b", 2: "#f97316", 1: "#dc2626"
};

const CONFIDENCE_LABELS = {
  5: "★★★★★ Artículo con DOI",
  4: "★★★★☆ Libro académico (ISBN)",
  3: "★★★☆☆ Archivo / proyecto de investigación",
  2: "★★☆☆☆ Fuente web / Wikipedia",
  1: "★☆☆☆☆ Especulativo"
};

const CATEGORY_EMOJI = {
  "MINERÍA": "⛏️", "AGRICULTURA": "🌾", "FORESTAL": "🌲", "ALIMENTARIO": "🐟"
};

// ── Magnitud → densidad de la nube de partículas (escala logarítmica) ──────────
const LOG_QUANTITIES = DATASET.filter(d => d.quantity).map(d => Math.log10(d.quantity));
const LOG_MIN = Math.min(...LOG_QUANTITIES);
const LOG_MAX = Math.max(...LOG_QUANTITIES);

function flowWeight(flow) {
  if (flow.quantity) return (Math.log10(flow.quantity) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return null;
}
function particleCount(flow) {
  const w = flowWeight(flow);
  if (w == null) return 6 + flow.intensity * 4;
  return Math.round(14 + w * 80);
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ── Capa de partículas en canvas, sincronizada con el mapa Leaflet ────────────
function ParticleFlowLayer({ flows }) {
  const map = useMap();
  const flowsRef = useRef(flows);
  flowsRef.current = flows;

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.className = "particle-flow-canvas";
    map.getContainer().appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let dpr = window.devicePixelRatio || 1;
    function resize() {
      const size = map.getSize();
      dpr = window.devicePixelRatio || 1;
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = size.x + "px";
      canvas.style.height = size.y + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    map.on("resize", resize);

    const sets = new Map();
    function syncParticles() {
      const current = flowsRef.current;
      const ids = new Set(current.map(f => f.id));
      for (const [id, set] of sets) {
        if (!ids.has(id) && !set.dying) { set.dying = true; set.deathElapsed = 0; }
      }
      for (const flow of current) {
        const existing = sets.get(flow.id);
        if (existing) { existing.flow = flow; existing.dying = false; continue; }
        if (flow.lat == null || !flow.dest) continue;
        const count = particleCount(flow);
        const spread = 2 + Math.sqrt(count);
        const [r, g, b] = hexToRgb(CONFIDENCE_COLORS[flow.confidence]);
        const baseSpeed = 0.10 + Math.random() * 0.04;
        const travel = 1 / baseSpeed;
        const particles = Array.from({ length: count }, (_, i) => ({
          delay: (i / count) * travel,
          speed: baseSpeed * (0.9 + Math.random() * 0.2),
          off: (Math.random() - 0.5) * 2 * spread,
          wobble: Math.random() * Math.PI * 2,
          size: 0.8 + Math.random() * 1.6
        }));
        sets.set(flow.id, { flow, particles, rgb: [r, g, b], elapsed: 0 });
      }
    }
    syncParticles();

    let raf;
    let last = performance.now();
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const size = map.getSize();
      ctx.clearRect(0, 0, size.x, size.y);

      const FADE_OUT = 2.0;
      for (const set of sets.values()) {
        set.elapsed += dt;
        let lifeFade = 1;
        if (set.dying) {
          set.deathElapsed += dt;
          lifeFade = 1 - set.deathElapsed / FADE_OUT;
          if (lifeFade <= 0) { sets.delete(set.flow.id); continue; }
        }
        const a = map.latLngToContainerPoint([set.flow.lat, set.flow.lon]);
        const c = map.latLngToContainerPoint(set.flow.dest);
        const dx = c.x - a.x, dy = c.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const [r, g, b] = set.rgb;

        for (const p of set.particles) {
          const age = set.elapsed - p.delay;
          if (age < 0) continue;
          const t = (age * p.speed) % 1;
          p.wobble += dt * 2;
          const lateral = p.off + Math.sin(p.wobble) * 1.5;
          const x = a.x + dx * t + nx * lateral;
          const y = a.y + dy * t + ny * lateral;
          const fade = Math.sin(Math.PI * t);
          const alpha = (0.15 + 0.55 * fade) * lifeFade;
          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    map.__rebuildParticles = syncParticles;

    return () => {
      cancelAnimationFrame(raf);
      map.off("resize", resize);
      delete map.__rebuildParticles;
      canvas.remove();
    };
  }, [map]);

  useEffect(() => {
    if (map.__rebuildParticles) map.__rebuildParticles();
  }, [map, flows]);

  return null;
}

// ── Convierte el campo doi_isbn en fragmentos con enlaces clicables ───────────
function SourceLinks({ value }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const parts = value.split("|").map(s => s.trim());
  return (
    <span>
      {parts.map((part, i) => {
        let content;
        const doiMatch = part.match(/DOI:\s*(\S+)/i);
        const urlMatch = part.match(/https?:\/\/\S+/i);
        if (doiMatch) {
          const doi = doiMatch[1];
          content = (
            <a href={`https://doi.org/${doi}`} target="_blank" rel="noreferrer" className="text-blue-400 underline">
              {part}
            </a>
          );
        } else if (urlMatch) {
          content = (
            <a href={urlMatch[0]} target="_blank" rel="noreferrer" className="text-blue-400 underline">
              {part}
            </a>
          );
        } else {
          content = <span>{part}</span>;
        }
        return <span key={i}>{i > 0 && <span className="text-slate-500"> · </span>}{content}</span>;
      })}
    </span>
  );
}

export default function ColonialAtlas() {
  const [tab, setTab] = useState("mapa");
  const [year, setYear] = useState(1700);
  const [playing, setPlaying] = useState(false);
  const [selectedImperio, setSelectedImperio] = useState(null);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [minConfidence, setMinConfidence] = useState(2);
  const [showMethodology, setShowMethodology] = useState(false);
  const [search, setSearch] = useState("");

  const visibleFlows = useMemo(() => {
    return DATASET.filter(flow => {
      if (flow.lat == null || !flow.dest) return false;
      const inRange = year >= flow.year_start && year <= flow.year_end;
      const impMatch = !selectedImperio || flow.imperio === selectedImperio;
      const catMatch = !selectedCategoria || flow.categoria === selectedCategoria;
      const regMatch = !selectedRegion || flow.region === selectedRegion;
      const confMatch = flow.confidence >= minConfidence;
      return inRange && impMatch && catMatch && regMatch && confMatch;
    });
  }, [year, selectedImperio, selectedCategoria, selectedRegion, minConfidence]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setYear(y => (y >= YEAR_MAX ? YEAR_MIN : y + 10));
    }, 500);
    return () => clearInterval(interval);
  }, [playing]);

  const visibleCapitals = useMemo(() => {
    const set = new Set(visibleFlows.map(f => f.imperio.split("/")[0].trim()));
    return [...set]
      .map(name => ({ name, cap: EMPIRE_CAPITALS[name] }))
      .filter(c => c.cap);
  }, [visibleFlows]);

  // Datos para la pestaña de fuentes (filtrados por búsqueda)
  const sourceRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? DATASET.filter(d =>
          [d.recurso, d.imperio, d.colonia, d.pais_actual, d.source, d.doi_isbn, d.categoria]
            .join(" ").toLowerCase().includes(q))
      : DATASET;
    return rows;
  }, [search]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col">
      {/* Barra superior con pestañas */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
        <h1 className="text-xl font-bold mr-4">📊 Atlas Colonial</h1>
        {[["mapa", "🗺️ Mapa"], ["fuentes", "📚 Fuentes"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition ${
              tab === key ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{DATASET.length} registros · {IMPERIOS.length} imperios</span>
      </div>

      {tab === "mapa" ? (
        <div className="flex flex-1 gap-4 p-4 min-h-0">
          {/* Panel izquierdo */}
          <div className="w-64 bg-slate-800 rounded-lg p-4 overflow-auto shrink-0">
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="w-full bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded mb-4 text-sm"
            >
              {showMethodology ? "Ocultar" : "Mostrar"} Metodología
            </button>

            {showMethodology && (
              <div className="bg-slate-700 rounded p-3 mb-4 text-xs space-y-2">
                <p>Cada flujo va de la <strong>colonia</strong> de extracción a la <strong>metrópoli</strong> del imperio.</p>
                <p>La <strong>densidad</strong> de la nube ∝ volumen extraído (escala logarítmica; unidades mixtas).</p>
                <p>El <strong>color</strong> indica la calidad de la fuente (★). Consulta la pestaña <strong>Fuentes</strong> para los DOI/ISBN.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Año: {year}</label>
              <input type="range" min={YEAR_MIN} max={YEAR_MAX} step="10" value={year} onChange={(e) => setYear(+e.target.value)} className="w-full" />
              <button onClick={() => setPlaying(!playing)} className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded mt-2 text-sm">
                {playing ? "⏸ Pausar" : "▶ Reproducir"}
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold mb-2">Confianza mínima:</label>
              <select value={minConfidence} onChange={(e) => setMinConfidence(+e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>{CONFIDENCE_LABELS[c]}</option>)}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold mb-2">Imperio:</label>
              <select value={selectedImperio || ""} onChange={(e) => setSelectedImperio(e.target.value || null)} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                <option value="">Todos</option>
                {IMPERIOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold mb-2">Categoría:</label>
              <select value={selectedCategoria || ""} onChange={(e) => setSelectedCategoria(e.target.value || null)} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                <option value="">Todas</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c] || ""} {c}</option>)}
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold mb-2">Región:</label>
              <select value={selectedRegion || ""} onChange={(e) => setSelectedRegion(e.target.value || null)} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm">
                <option value="">Todas</option>
                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="mt-4 text-xs">
              <p className="font-bold mb-2">Flujos visibles: {visibleFlows.length} / {DATASET.length}</p>
              <p className="text-slate-400">La <strong>densidad</strong> de cada nube representa el volumen extraído; el <strong>color</strong>, la calidad de la fuente.</p>
            </div>
          </div>

          {/* Mapa central */}
          <div className="flex-1 bg-slate-700 rounded-lg overflow-hidden relative min-w-0">
            <MapContainer center={[20, 0]} zoom={2} minZoom={2} worldCopyJump className="w-full h-full" style={{ background: "#0f172a" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {visibleFlows.map(flow => (
                <Polyline
                  key={`line-${flow.id}`}
                  positions={[[flow.lat, flow.lon], flow.dest]}
                  pathOptions={{ color: CONFIDENCE_COLORS[flow.confidence], weight: 1, opacity: 0.15 }}
                />
              ))}

              <ParticleFlowLayer flows={visibleFlows} />

              {visibleFlows.map(flow => (
                <CircleMarker
                  key={`pt-${flow.id}`}
                  center={[flow.lat, flow.lon]}
                  radius={5}
                  pathOptions={{ color: "#fff", weight: 1, fillColor: CONFIDENCE_COLORS[flow.confidence], fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-xs" style={{ maxWidth: 260 }}>
                      <p className="font-bold text-sm">{CATEGORY_EMOJI[flow.categoria] || ""} {flow.recurso}</p>
                      <p style={{ color: "#b45309" }}>{flow.colonia} ({flow.pais_actual}) → {flow.capital}</p>
                      <p className="mt-1"><strong>Imperio:</strong> {flow.imperio}</p>
                      <p><strong>Período:</strong> {flow.year_start}–{flow.year_end}</p>
                      {flow.quantity != null && (
                        <p><strong>Volumen:</strong> {flow.quantity.toLocaleString()} {flow.unit}</p>
                      )}
                      {flow.valor_usd && <p><strong>Valor est.:</strong> {flow.valor_usd}</p>}
                      {flow.pct_world != null && <p><strong>% prod. mundial (pico):</strong> {flow.pct_world}%</p>}
                      <p className="mt-1"><strong>Mano de obra:</strong> {flow.labor}</p>
                      <p style={{ color: "#1d4ed8" }} className="mt-1">{CONFIDENCE_LABELS[flow.confidence]}</p>
                      {flow.notes && <p className="mt-2 italic" style={{ borderTop: "1px solid #cbd5e1", paddingTop: 4 }}>{flow.notes}</p>}
                      <p className="mt-2" style={{ color: "#475569" }}><strong>Fuente:</strong> {flow.source}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {visibleCapitals.map(c => (
                <CircleMarker
                  key={`cap-${c.name}`}
                  center={c.cap.coords}
                  radius={6}
                  pathOptions={{ color: "#fbbf24", weight: 2, fillColor: "#1e293b", fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold">{c.cap.name}</p>
                      <p style={{ color: "#475569" }}>Metrópoli — {c.name}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      ) : (
        // ── Pestaña de fuentes ──────────────────────────────────────────────
        <div className="flex-1 p-4 min-h-0 flex flex-col">
          <div className="mb-3 flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar recurso, colonia, imperio, autor…"
              className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm w-96"
            />
            <span className="text-xs text-slate-400">{sourceRows.length} de {DATASET.length} registros</span>
          </div>
          <div className="flex-1 overflow-auto rounded-lg border border-slate-700">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr className="text-left">
                  <th className="px-3 py-2 font-bold">Recurso</th>
                  <th className="px-3 py-2 font-bold">Imperio</th>
                  <th className="px-3 py-2 font-bold">Colonia</th>
                  <th className="px-3 py-2 font-bold">Período</th>
                  <th className="px-3 py-2 font-bold">Fuente principal</th>
                  <th className="px-3 py-2 font-bold">DOI / ISBN</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.map(d => (
                  <tr key={d.id} className="border-t border-slate-700 hover:bg-slate-800/60 align-top">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span title={d.confidence + "★"}>{CATEGORY_EMOJI[d.categoria] || ""} {d.recurso}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{d.imperio}</td>
                    <td className="px-3 py-2">{d.colonia}<br /><span className="text-slate-500">{d.pais_actual}</span></td>
                    <td className="px-3 py-2 whitespace-nowrap">{d.year_start}–{d.year_end}</td>
                    <td className="px-3 py-2">{d.source}</td>
                    <td className="px-3 py-2"><SourceLinks value={d.doi_isbn} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
