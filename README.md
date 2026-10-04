# Familia

Espacio compartido de planificación para Daniel y Cami: día / semana / mes, capas por persona (Tú, Cami, Juntos), categorías editables, puntos, rachas, niveles y mensajes de carga.

PWA sin dependencias ni build. Abrir `index.html` o servir la carpeta con cualquier servidor estático:

    python3 -m http.server 8000

## Estado actual (MVP)
- Los datos se guardan en el dispositivo (`localStorage`), vía el objeto `Store` en `app.js`.
- Incluye datos de ejemplo (Ajustes → Quitar ejemplos).

## Siguiente etapa
1. Sincronización en la nube (Supabase o Firebase, plan gratis) reemplazando `Store.load/save`.
2. Login simple para Cami.
3. Hosting (Vercel/Netlify/GitHub Pages) + recordatorios push (iOS 16.4+, app instalada en pantalla de inicio).
