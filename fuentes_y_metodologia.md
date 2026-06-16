# Atlas de Flujos de Recursos Coloniales
## Investigación de fuentes y arquitectura de datos para una versión publicable

*Documento de trabajo — Junio 2026*

---

## 1. Hallazgo central

**No existe una única base de datos cuantitativa que integre todos los flujos de recursos coloniales a lo largo de todo el período (c. 1440–1960).** La evidencia disponible es un mosaico de fuentes con granularidad, cobertura temporal y nivel de confianza muy desiguales.

Esto tiene una consecuencia metodológica directa: un producto publicable **no puede presentar todas las cifras con el mismo grado de autoridad**. La solución profesional es una **arquitectura de datos por niveles de confianza**, donde cada flujo declara explícitamente su fuente y su grado de certeza. Esta es, de hecho, la práctica estándar en las mejores bases históricas (RICardo, por ejemplo, construye toda su semiología visual alrededor de representar la incertidumbre del dato).

---

## 2. Las tres bases de datos "columna vertebral"

De toda la investigación, tres recursos destacan por su rigor, su carácter abierto y su uso establecido en la literatura revisada por pares. Deberían ser los pilares del proyecto.

### 2.1 SlaveVoyages — Tráfico transatlántico de personas esclavizadas

- **Qué es:** la base de referencia mundial sobre la trata. Datos de ~35.000 viajes esclavistas entre 1501 y 1867, ~66–80 % de todas las expediciones.
- **Totales por potencia (personas embarcadas):** Portugal 5.848.266 · Gran Bretaña 3.259.441 · Francia 1.381.404 · España 1.061.524 · Países Bajos 554.336 · EE.UU. 305.326 · Dinamarca 111.040.
- **Estimación global:** ~12,5 millones embarcados, ~10,7 millones desembarcados; ~1,8 millones de muertes en la travesía (Middle Passage).
- **Acceso:** abierto, slavevoyages.org. Descarga de datos y API.
- **Cita:** Eltis, D. & Richardson, D. (2010). *Atlas of the Transatlantic Slave Trade*. Yale University Press. + la base online (consorcio Universidad de California).
- **Confianza:** ★★★★★ (alta; cifras bien establecidas en la literatura).
- **Corrección al mapa actual:** la cifra de Gran Bretaña debe ajustarse de "3,1" a **3,26 millones**.

### 2.2 TePaske & Brown (2010) — Oro y plata de la América colonial

- **Qué es:** contabilidad distrito por distrito, año por año, del oro y la plata oficialmente refinados y acuñados en la América española y portuguesa, a partir de registros fiscales (cajas reales) y de acuñación (casas de moneda). Incluye discusión del contrabando.
- **Cobertura:** principales distritos mineros — Potosí, Zacatecas, Guanajuato, Huancavelica, Oruro, etc.
- **Cita:** TePaske, J. J. (2010). *A New World of Gold and Silver* (K. W. Brown, Ed.). The Atlantic World, vol. 21. Brill/Leiden. ISBN 9789004188914.
- **Complemento clásico:** Hamilton, E. J. (1934). *American Treasure and the Price Revolution in Spain, 1501–1650*. Harvard University Press.
- **Confianza:** ★★★★★ (es la serie cuantitativa de referencia para metales).
- **Nota:** la cifra de "45.000 toneladas de plata de Potosí" del mapa es una estimación de divulgación; TePaske permite sustituirla por series oficiales registradas, distinguiendo producción registrada de contrabando estimado.

### 2.3 RICardo — Comercio internacional bilateral (siglo XIX)

- **Qué es:** base abierta de flujos comerciales bilaterales de todos los países del mundo, c. 1787–1938. Proyecto Sciences Po (médialab + Centre d'histoire).
- **Granularidad:** valores comerciales bilaterales agregados (no volúmenes físicos por mercancía).
- **Acceso:** abierto bajo Open Database License (ODbL). Repositorio en GitHub (medialab/ricardo_data) y dataset versionado en Zenodo.
- **Cita:** Dedinger, B. & Girard, P. (2017). "Exploring trade globalization in the long run: The RICardo project". *Historical Methods*, 50(1), 30–48. DOI: 10.1080/01615440.2016.1220269. Dataset: Zenodo DOI 10.5281/zenodo.1119592.
- **Confianza:** ★★★★☆ (excelente para el XIX, pero no cubre el período colonial temprano ni desglosa por mercancía física).
- **Uso recomendado:** columna vertebral para la fase tardía (rutas del té, opio, caucho, algodón del s. XIX) en términos de valor comercial.

---

## 3. Fuentes por mercancía (segundo nivel)

Para los recursos sin una base integrada, estas son las mejores referencias revisadas por pares identificadas hasta ahora:

### Azúcar (Brasil y Caribe)
- Hacia 1630, ~350 *engenhos* en Brasil producían ~10.000–15.000 t/año; hacia 1689, ~528 *engenhos* producían ~18.500 t (Antonil/Andreoni).
- Las plantaciones caribeñas llegaron a producir el 80–90 % del azúcar consumido en Europa Occidental.
- **Citas:** Schwartz, S. B. (2005). Artículo en *Revista de Indias*, LXV(233), 79–116. · Bosma, U. (2023). *The World of Sugar*. Harvard University Press. · Britannica, *History of Latin America: The Sugar Age*.
- **Confianza:** ★★★★☆ (cifras puntuales bien documentadas; series continuas más fragmentarias).

### Especias (VOC, Molucas, Java)
- **Fuente primaria:** archivos de la VOC, Nationaal Archief (La Haya). Obra de referencia: Gaastra, F. S. *The Dutch East India Company*.
- **Confianza:** ★★★★☆ para la VOC; ★★★☆☆ para el período portugués previo.

### Opio (Bengala → China) y Té (Assam)
- Anclar en registros de la East India Company y en RICardo para la fase de valor comercial del s. XIX.
- **Confianza:** ★★★☆☆ (pendiente de localizar series cuantitativas revisadas).

### Caucho y marfil — Estado Libre del Congo
- **Cifra de mortalidad: genuinamente disputada.** Las estimaciones modernas del descenso de población van de **1,2 a 10 millones**. La cifra de 10 millones (Hochschild, *King Leopold's Ghost*, 1998) es muy citada pero impugnada; estimaciones más conservadoras se basan en datos censales tardíos (primer censo territorial ~1924, ~10 millones de población).
- **Tratamiento publicable obligatorio:** presentar como **rango con la controversia explícita**, nunca como dato cerrado. Citar el debate (Casement 1904; Vansina; Hochschild 1998; y las críticas demográficas).
- **Confianza:** ★★☆☆☆ (rango amplio, alta carga ética → máxima cautela).

### Pieles (Norteamérica)
- Registros de la Hudson's Bay Company Archives (Archives of Manitoba) — fuente primaria sólida.
- **Confianza:** ★★★☆☆.

### Minerales / oro (Witwatersrand, Australia)
- Series de producción minera del s. XIX–XX razonablemente bien documentadas en historia económica.
- **Confianza:** ★★★☆☆.

---

## 4. Esquema de datos propuesto

Para que el dataset sea publicable y reproducible, cada flujo debería registrar como mínimo:

| Campo | Descripción |
|---|---|
| `flow_id` | Identificador único |
| `resource` | Mercancía (categoría controlada) |
| `power` | Potencia colonial |
| `origin_lat`, `origin_lon` | Coordenadas del punto de extracción |
| `origin_name` | Topónimo histórico |
| `dest` | Destino/metrópoli |
| `year_start`, `year_end` | Período del flujo |
| `quantity_value` | Cifra (si existe) |
| `quantity_unit` | Unidad (toneladas, personas, pesos, £, etc.) |
| `confidence` | 1–5 (declarado explícitamente) |
| `source_citation` | Referencia bibliográfica completa |
| `source_url` / `doi` | Enlace o DOI |
| `notes` | Salvedades, disputas, supuestos |

Este esquema permite que el mapa muestre la incertidumbre visualmente (p. ej. grosor o opacidad según `confidence`) y que cualquier revisor rastree cada número hasta su fuente.

---

## 5. Recomendaciones para la versión publicable

1. **Adoptar la arquitectura por niveles de confianza.** Es la diferencia entre una infografía y un instrumento académico.
2. **Anclar lo que se pueda en las tres bases columna vertebral** (SlaveVoyages, TePaske & Brown, RICardo) y citar fuente por flujo.
3. **Tratar las cifras de mortalidad (Congo, mita minera, Middle Passage) como rangos con su debate**, nunca como puntos cerrados.
4. **Distinguir unidades con honestidad:** no es lo mismo "valor comercial en libras" que "toneladas físicas" que "personas". El mapa no debería sugerir comparabilidad donde no la hay.
5. **Publicar el dataset junto al mapa** (CSV + este documento metodológico) bajo una licencia abierta, replicando la buena práctica de RICardo y SlaveVoyages.

---

## 6. Pendientes de investigación

- Localizar series cuantitativas revisadas para opio (Bengala–China), té (Assam) y algodón (India) en el s. XIX.
- Verificar volúmenes de la VOC para especias (archivo de La Haya o literatura secundaria de Gaastra).
- Decidir la unidad de visualización: ¿intensidad por valor, por volumen físico, o categórica? (afecta la comparabilidad entre flujos).

---

*Fuentes consultadas en esta fase: SlaveVoyages / Hutchins Center (Harvard); TePaske & Brown (2010, Brill); Dedinger & Girard (2017, Historical Methods); Schwartz (2005, Revista de Indias); Bosma (2023, Harvard UP); literatura sobre el Estado Libre del Congo (Hochschild 1998; Casement 1904; debate demográfico).*
