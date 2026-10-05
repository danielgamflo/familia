# Puesta en marcha (Supabase + GitHub Pages)

Tiempo estimado: 15 minutos. Todo gratis.

## 1. Crear la base de datos (Supabase)
1. Entra a https://supabase.com y crea una cuenta (puedes usar GitHub).
2. **New project**: nombre `familia`, elige una contraseña de base de datos (guárdala) y la región más cercana (por ejemplo South America).
3. Cuando termine de crearse, abre **SQL Editor → New query**.
4. Abre `supabase/schema.sql`, cambia los dos correos del final por los reales (Daniel = `a`, Cami = `b`), pega todo y toca **Run**.
5. **Authentication → Providers → Email**: apaga **Confirm email** (así crean la cuenta y entran de inmediato). Solo los dos correos de la tabla `members` pueden ver o guardar datos, aunque otra persona creara una cuenta.
6. **Project Settings → API**: copia **Project URL** y **anon public key**.

## 2. Conectar la app
Edita `config.js` y pega esos dos valores. La anon key es pública por diseño: la seguridad la dan las reglas del SQL.

## 3. Publicar la app (GitHub Pages)
1. En GitHub: repositorio `familia` → **Settings → Pages**.
2. **Source: Deploy from a branch**, branch `claude/shared-calendar-gamification-ojpsq5` (o `main` si ya la unieron), carpeta `/ (root)`. **Save**.
3. En 1–2 minutos queda en `https://danielgamflo.github.io/familia/`.
4. En **Supabase → Authentication → URL Configuration** pon esa dirección en **Site URL**.

## 4. Instalar en el teléfono
- iPhone: abre el link en Safari → botón Compartir → **Agregar a pantalla de inicio**.
- Android: Chrome → menú → **Instalar app**.

Cada uno entra una vez con su correo y una contraseña (**Crear cuenta** la primera vez). La app reconoce quién es quién por el correo.
