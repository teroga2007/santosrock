# Santos Rock

Sitio responsive con Vite, React y TypeScript, Tailwind CSS, daisyUI, i18next y Motion (entrada `motion/mini` para animación ligera).

## Desarrollo

La dirección visual anual está en `src/site/theme-2027.css`: contiene los nueve colores de la paleta 2027, aplicados a páginas, blog y componentes daisyUI. `src/site/CosmicBackdrop.tsx` dibuja una escena vectorial decorativa de luna, estrellas y ovni. Las animaciones respetan `prefers-reduced-motion`. El afiche preliminar se utilizó únicamente como referencia; no se copió a los archivos públicos ni se importaron sus fechas, bandas o datos de venta.

Requiere Node.js 22.12+ o 24 LTS y npm.

```sh
npm install
npm run dev
```

```sh
npm run lint
npm run build
npm run preview
```

Interfaz en `src/locales/es.json` y `src/locales/en.json`. Traducciones completas de las ocho páginas migradas y los catorce artículos en `src/locales/pages.en.json`, `posts.en.json` y `history.en.json`. Español por defecto; la selección se conserva en localStorage y cambia contenido, categorías, búsqueda, fechas y metadatos, sin modificar las URL originales.

Los catálogos editoriales se organizan por ID original: título, descripción/extracto y nodos de texto del HTML en orden. `node scripts/inspect-translations.mjs posts 2457` muestra las unidades originales con sus índices. `scripts/compile-editorial.mjs` comprueba cobertura y genera `src/locales/content.en.json`, namespace `content` de i18next, al compilar. Si cambia el contenido en español, revisar también su traducción. Se conservan imágenes, videos y contenidos de proveedores externos en su idioma original.

Inicio `/`, asociación `/quienes-somos/`, contacto `/contacto/`, blog `/blog/` y artículos en **`/{slug}/`**, exactamente como en WordPress. Se conservan las 36 URL del sitemap entregado, como páginas o RSS. Las rutas del prototipo `/blog/{slug}` tienen redirecciones 301; `/#sobre` y `/#contacto` navegan a las páginas correspondientes. Galería, próximos eventos y `/en-construccion/` conservan el estado de construcción; las rutas desconocidas muestran 404.

El contador apunta a `2027-01-16T00:00:00-06:00` (medianoche en Costa Rica), sin asumir una hora de apertura; al llegar se detiene en cero. Fecha en `src/site/Countdown.tsx`.

Logo oficial en `public/logo_SR_blanco.png` para encabezado y pie, y `public/logo_SR_negro.png` para favicon. Los textos y fotos de contenido proceden del sitio original. Contacto publicado: `info@santosrock.com` y `+506 8689 6331`. El antiguo cartel de newsletter se sustituyó por un formulario de suscripción compatible con Netlify Forms. La política de privacidad conserva el texto de WordPress, incluidas referencias a cuentas y comentarios antiguos: requiere actualización editorial si se desea describir exclusivamente la nueva aplicación.

## Publicación

Newsletter: `/newsletter/` contiene un formulario prerenderizado para Netlify Forms llamado `newsletter`, con correo, idioma, consentimiento y honeypot. Activar la detección de formularios en Netlify antes de desplegar. Las solicitudes aparecerán en Forms; la captura no realiza envíos masivos ni conecta automáticamente con una plataforma de newsletter. Esa integración queda pendiente de elegir el servicio. En Vite local no hay un backend de formularios; comprobar la recepción real después del despliegue. Referencia: [Netlify Forms](https://docs.netlify.com/manage/forms/setup/).

El alojamiento elegido es **Netlify**. `netlify.toml` configura `npm run build`, la carpeta de publicación `dist`, Node.js 24 y el dominio canónico `https://santosrock.com`. Al importar el repositorio en Netlify, mantener la raíz del proyecto como directorio base. Para una publicación manual, compilar localmente y subir toda la carpeta `dist`.

Las redirecciones y los RSS se generan en `dist/_redirects`; Netlify sirve automáticamente `dist/404.html` para rutas inexistentes. No añadir la regla SPA `/* /index.html 200`, porque el sitio ya genera HTML para cada ruta. Configuración de referencia: [Vite en Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/) y [redirecciones](https://docs.netlify.com/manage/routing/redirects/overview/). La configuración local no publica el sitio ni cambia el DNS; al desplegar, comprobar las rutas históricas y asociar el dominio definitivo.

Publicar **todo `dist/`**, incluidos `.htaccess`, `_redirects` y `404.html`. La compilación genera HTML completo en español para 30 rutas canónicas, metadatos individuales, sitemap y robots. También genera 24 feeds RSS; los feeds de comentarios permanecen válidos y vacíos porque los comentarios no formaron parte de la migración.

Se incluyen reglas para Apache/cPanel y Netlify/Cloudflare Pages. Servir archivos existentes y devolver `404.html` con HTTP 404 para rutas desconocidas; evitar un fallback indiscriminado al inicio con HTTP 200. Verificar en el alojamiento definitivo al publicar; `vite preview` reproduce estas reglas localmente. Los enlaces antiguos a medios tienen redirecciones a sus copias locales. Inventario: `docs/route-migration-report.json` y `docs/page-migration-report.json`.

## Blog

14 artículos originales importados desde la API pública de WordPress, con versiones completas en inglés. Los originales españoles no se sobrescriben. Datos en `src/data/blog-posts.json`, imágenes y videos en `public/images/blog/{slug}/`; páginas en `src/data/site-pages.json` y `public/images/pages/`. No se necesita WordPress en producción.

```sh
npm run build
npm run test:blog
node --test scripts/site.test.mjs scripts/i18n.test.mjs
```

La compilación genera título, descripción, canonical y Open Graph en HTML por artículo, además de actualizarlos al navegar dentro de la aplicación. `VITE_SITE_URL` configura el origen de las URL públicas; por defecto es `https://santosrock.com`. Ajustarlo antes de compilar si cambia el dominio definitivo.

Proceso, fuentes, decisiones de migración y validación: [docs/blog-migration.md](docs/blog-migration.md). El HTML comprometido se sanitiza al importar con una lista de etiquetas y atributos permitidos; nunca se renderizan respuestas remotas sin validar.

Para reimportar: `npm run migrate:blog`, `npm run migrate:pages` y `node scripts/map-legacy-routes.mjs`. Revisar traducciones después de cualquier cambio editorial.

Con preview en `http://127.0.0.1:5173` y una pestaña de Chrome abierta allí con depuración local en el puerto 9223, ejecutar uno a la vez `node scripts/check-site-browser.mjs`, `node scripts/check-blog-browser.mjs` y `node scripts/check-i18n-browser.mjs`. Comprueban códigos HTTP, medios, rutas, idiomas, metadatos y anchos 320/390/768/1440 px. Capturas en `.cache/`.

