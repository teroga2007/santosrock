# Migración editorial del blog

Fuente: `https://santosrock.com/wp-json/wp/v2/posts?per_page=100&_embed&page=1`.

El inventario público consultado el 8 de septiembre de 2026 contiene **14 entradas en una página**, según `X-WP-Total` y `X-WP-TotalPages`. Se revisaron las 14 y todas corresponden a contenido editorial de Santos Rock. No se encontraron publicaciones de spam en esta respuesta: **0 excluidas**, sin inferir cifras históricas del sitio. Fuerza Dread y Tita y La Cueva del Zoncho son las dos entradas legítimas adicionales a la lista inicial. No hay artículos pendientes de revisión.

## Contenido y medios

- `src/data/blog-posts.json`: ID original, título, slug, categoría principal, todas las categorías, miniatura destacada, extracto, contenido, fecha y URL original.
- `public/images/blog/{slug}/`: 69 imágenes y 2 videos MP4, copiados sin recodificar ni alterar sus proporciones. Las imágenes de galería enlazan con su versión local completa. Se reutiliza la miniatura cuando corresponde a la misma imagen del cuerpo.
- `docs/blog-migration-report.json`: inventario por artículo, hashes del contenido fuente y de los 71 archivos, correspondencia entre URL remota y local, paginación y exclusiones.
- Se mantiene la estructura de párrafos, encabezados, citas, énfasis, enlaces y pies de foto. Los textos originales españoles no se corrigen ni reescriben. Por solicitud posterior del usuario, se añadieron versiones completas en inglés en catálogos separados de i18next, conservando medios, enlaces y estructura.
- Las letras capitulares aisladas en encabezados de Elementor se reinsertan literalmente al comienzo de su párrafo. Los demás encabezados conservan su nivel original, incluso las citas que WordPress representaba como `h2`.
- Se extrae exclusivamente la sección editorial revisada `5aa35477`. Se retiran navegación, pie de página, shortcodes de plantilla, separadores decorativos y envoltorios de Elementor.
- Se conservan 20 embeds de Spotify e Instagram con iframes de rutas y dominios explícitamente permitidos. Instagram conserva sus enlaces de respaldo originales. No se ejecuta `embed.js` ni ningún script importado. Los proveedores pueden requerir cookies, inicio de sesión o limitar disponibilidad; sus medios continúan alojados por ellos.
- Los dos videos de la entrevista a Tita están alojados localmente. El enlace original al programa de Zavaleta en Google Drive se conserva.

## Repetir la migración

```sh
npm run migrate:blog
```

El script recorre la paginación de la API, aplica indicadores fuertes de spam y exige una lista explícita de IDs revisados. Una entrada nueva no se publica automáticamente: queda anotada para revisión. Antes de añadir IDs a `approved`, revisar su texto completo y medios. Un cambio en el contenedor editorial detiene la importación para evitar incorporar elementos ajenos al artículo.

Las respuestas y descargas se guardan en `.cache/blog-migration/` (ignorada por Git, fuera de `public`). Para reproducir la extracción sin volver a consultar el inventario:

```sh
node scripts/migrate-blog.mjs --cached
```

La sanitización usa `sanitize-html` con listas de etiquetas, atributos, protocolos, dominios y rutas de embeds. Se descartan scripts, eventos, estilos activos, formularios, SVG, `srcdoc` y proveedores no autorizados. Las descargas se restringen al directorio de medios de Santos Rock y a tipos de imagen/video admitidos. Una revisión nueva del contenido sigue siendo necesaria aunque pase el filtro automatizado.

## Validación

```sh
npm run lint
npm run build
npm run test:blog
```

Las pruebas verifican inventario, ausencia de indicadores de spam, activos locales, sanitización adversarial y metadatos estáticos de todas las rutas. Cuando está disponible la caché de la API también comparan directamente los textos completos, encabezados, párrafos, imágenes, pies de foto, títulos, extractos y fechas originales. Solo se ignora espacio en blanco de maquetación al comparar la prosa.

`node scripts/check-blog-browser.mjs` verifica las 14 rutas en un preview de producción en `http://127.0.0.1:5173`, usando una sesión local de Chrome que tenga abierta esa URL y `--remote-debugging-port=9223`. Comprueba carga y decodificación de imágenes, metadatos de ambos videos, anchos de 320/390/768/1440 px, búsqueda, filtros, ES/EN, 404 y regresiones de inicio y galería. Guarda capturas en la caché ignorada.

## Publicación y SEO

`npm run build` genera `dist/{slug}/index.html` con contenido completo, título y extracto originales y canonical/Open Graph por artículo. Se conservan las rutas originales de WordPress, confirmadas con el sitemap entregado. Las rutas del prototipo `/blog/{slug}` redirigen con 301. El alojamiento debe priorizar archivos existentes y servir `404.html` con HTTP 404 para rutas desconocidas; la compilación incluye reglas de alojamiento. `VITE_SITE_URL` debe apuntar al dominio público definitivo (por defecto `https://santosrock.com`).

La migración posterior también recuperó ocho páginas del sitio original, preservó archivos de etiquetas y RSS, y añadió el logo oficial y traducciones ES/EN a toda la aplicación. Ver `README.md` y `docs/route-migration-report.json` para el estado final.
