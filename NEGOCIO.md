# 💅 Lore del negocio — AuraNails

> Este documento reconstruye la lógica de negocio a partir del código existente (nunca hubo un documento de producto). Nada de esto estaba implementado contra un backend real — es la intención capturada en la UI y en los datos hardcodeados. Úsalo como punto de partida para decidir qué se mantiene, qué cambia y qué se corta al migrar a Supabase.

## 🏠 Qué es

Una app de reservas para un **salón de uñas** ("nail studio") llamado **AuraNails**, ubicado en Jr. Raimondi 501, Rioja, San Martín, Perú. Pensada para una dueña que atiende sola (no hay concepto de "empleadas" ni "sedes" en el modelo actual).

El objetivo: que las clientas reserven su cita online, elijan servicio y horario disponible, suban referencias de diseño, paguen por transferencia y suban el comprobante — y que la dueña gestione todo desde un panel: su agenda, las citas, el cobro y la relación con las clientas (mini-CRM).

## 👥 Roles

Dos roles únicos, definidos por un campo `role` en el perfil del usuario:

| Rol | Cómo se crea | Qué puede hacer |
|---|---|---|
| **client** (clienta) | Se registra libremente desde `/registro` | Reservar citas, ver su historial, editar su perfil/preferencias |
| **admin** (dueña) | Se crea manualmente en la base de datos (no hay flujo de alta) | Gestiona agenda, citas, pagos, clientas y catálogo |

No existe un tercer rol tipo "staff/empleada" — el modelo asume una sola persona atendiendo.

## 💅 Catálogo de servicios

Hardcodeado en `src/utils/constants.js` (8 servicios), cada uno con nombre, descripción, duración (minutos) y precio:

| Servicio | Duración | Precio (actual, en COP) |
|---|---|---|
| Esmaltado Permanente (Gel) | 60 min | $25.000 |
| Rubber Base con Diseño | 90 min | $35.000 |
| Acrílico Natural | 120 min | $50.000 |
| Acrílico con Diseño (nail art) | 150 min | $65.000 |
| Francés (French Manicure) | 60 min | $30.000 |
| Diseño Adicional (Nail Art extra) | 30 min | $15.000 |
| Retiro de Acrílico | 45 min | $20.000 |
| Reparación de Uña | 20 min | $8.000 |

⚠️ **Inconsistencia detectada:** el salón está configurado en Perú (`VITE_SALON_ADDRESS`, WhatsApp +51), pero los precios se formatean como pesos colombianos (`Intl.NumberFormat('es-CO', { currency: 'COP' })` en `utils/dates.js`). Esto es una decisión pendiente de corregir (ver sección de preguntas abiertas).

La pantalla de admin "Servicios" (`ServiceManager.jsx`) es **solo lectura** — literalmente le dice a la dueña "para editar precios y duraciones, modificá el archivo `src/utils/constants.js`". No hay gestión de catálogo desde la UI.

## 📅 Agenda / disponibilidad

La dueña define su propia disponibilidad semana a semana (`CalendarManager.jsx`):

- Cada semana se identifica por la fecha de su **lunes** (`YYYY-MM-DD`).
- Por cada día de la semana puede: activarlo/desactivarlo, definir horario de atención (`start`/`end`), y agregar **bloques de descanso** (`breaks`: rango `breakStart`–`breakEnd`, ej. almuerzo).
- No hay repetición automática — cada semana se configura a mano (no hay "horario recurrente por defecto").

A partir de esa configuración, el sistema calcula los **horarios disponibles** para reservar (`utils/slots.js`, lógica pura ya rescatada):

- Genera slots cada **30 minutos** dentro del horario del día.
- Descarta un slot si se superpone con un bloque de descanso.
- Descarta un slot si ya está ocupado por otra cita (`confirmed`, `pending_payment` o `pending_validation` — es decir, una cita "reserva" el horario aunque todavía no esté confirmada ni pagada).
- Un slot es válido solo si el servicio completo (según su duración) entra antes del cierre del horario.

## 🧾 Flujo de reserva (cliente)

Wizard de 4 pasos en `BookingPage.jsx`:

1. **Servicio** — elige uno del catálogo.
2. **Fecha y hora** — ve solo los días que la dueña habilitó esa semana, y dentro de esos, los horarios libres calculados como arriba.
3. **Fotos** (opcional) — sube hasta 3 fotos de referencia del diseño (Pinterest/Instagram), máx. 5MB c/u.
4. **Pago** — ve el monto a pagar, y le pide a la clienta que:
   - contacte al WhatsApp del salón para pedir los datos bancarios (**no se muestran en la app**, es intencional),
   - transfiera,
   - suba una captura del comprobante.

Al confirmar el paso 3 se "crea" la cita con estado `pending_payment`. Al subir el comprobante (paso 4), pasa a `pending_validation`.

## 🔄 Estados de una cita

Máquina de estados simple, sin automatizaciones (todo lo mueve la dueña a mano, excepto la creación y la subida de comprobante):

```
pending_payment  →  pending_validation  →  confirmed  →  completed
        ↓                    ↓                  ↓
                       cancelled / no_show
```

| Estado | Quién lo dispara | Significado |
|---|---|---|
| `pending_payment` | Clienta crea la cita | Reservó el horario, todavía no pagó nada |
| `pending_validation` | Clienta sube comprobante | Pagó (dice ella), falta que la dueña lo confirme |
| `confirmed` | Dueña valida el comprobante | Cita asegurada |
| `completed` | Dueña la marca manualmente | Se hizo el servicio (cuenta para ingresos del mes) |
| `cancelled` | Dueña o clienta | Se cancela, con motivo opcional |
| `no_show` | Dueña | La clienta no llegó |

## 💳 Pago

**No hay pasarela de pago real implementada**, a pesar de que `@mercadopago/sdk-react` está en las dependencias y hay una `VITE_MP_PUBLIC_KEY` configurada. El flujo real es 100% manual:

1. La clienta transfiere por fuera de la app (los datos bancarios se comparten por WhatsApp).
2. Sube una captura del comprobante.
3. La dueña la revisa a ojo y confirma o rechaza.

Esto es una decisión de negocio a revisar: ¿se integra Mercado Pago de verdad ahora que se migra a Supabase, o se mantiene el pago manual (más simple, sin comisiones, pero más lento y con más fricción/confianza)?

## 📱 WhatsApp

Tampoco hay integración real con la **WhatsApp Cloud API**, aunque existen las variables de entorno preparadas (`VITE_WA_PHONE_NUMBER_ID`, `VITE_WA_ACCESS_TOKEN`, `VITE_WA_BUSINESS_ACCOUNT_ID`). Lo que existe hoy son **links `wa.me`** que abren WhatsApp con un mensaje pre-escrito, para que la dueña (o clienta) lo envíe manualmente. Hay dos plantillas:

- **Confirmación de cita**: incluye fecha, hora, servicio, dirección y la política de cancelación completa.
- **Recordatorio** (pensado para 24h antes, pero sin ningún disparador automático — la dueña lo envía a mano desde la ficha de la cita).

## 📜 Políticas del negocio (texto fijo, se manda en los mensajes de WhatsApp)

- **Cancelaciones:** avisar con ≥24h de anticipación para reagendar sin costo.
- **Tolerancia de retraso:** 15 minutos. Pasado ese tiempo, se cancela y se registra como inasistencia (`no_show`).
- **Depósito/seña:** no reembolsable si la clienta no asiste o cancela con <24h de anticipación.

## 🗂️ Mini-CRM de clientas

Panel admin (`ClientsCRM.jsx`) con:

- Listado buscable por nombre o teléfono.
- Ficha de cada clienta: teléfono, email, **colores favoritos**, **alergias/sensibilidades**, notas libres de la dueña, e **historial completo de citas**.
- Botón directo para escribirle por WhatsApp.

Estos mismos campos (`favoriteColors`, `allergies`, `notes`) los puede editar la propia clienta desde su perfil (`Profile.jsx`) — es decir, hoy es un dato compartido y editable por ambos lados, sin distinción entre "lo que dice la clienta" y "lo que anota la dueña" (esto puede valer la pena separarlo).

## 📊 Dashboard admin

Métricas mostradas al entrar (`Dashboard.jsx`):

- Citas de hoy.
- Comprobantes pendientes de validar (alerta visual aparte).
- Total de clientas registradas.
- Ingresos del mes = suma de `servicePrice` de las citas en estado `completed` (sin filtrar por mes real — suma **todas** las completadas históricas, otro punto a revisar).

## 🧩 Piezas que faltaban conectar (y ahora se resuelven con Supabase)

Todo lo de arriba es la intención de producto. Lo que nunca se conectó a un backend real:
- Autenticación y almacenamiento de perfiles/roles.
- Persistencia de citas, agenda semanal y clientas.
- Subida de fotos de referencia y comprobantes de pago.
- Cualquier automatización (recordatorios, cálculo de ingresos por mes real, etc.).

## ❓ Preguntas abiertas para definir antes de implementar en Supabase

1. **Moneda/localización:** ¿el negocio opera en soles peruanos (PEN) o se mantiene en pesos colombianos (COP)? Hoy hay una contradicción entre la dirección/WhatsApp (Perú) y el formato de precios (COP).
2. **Catálogo de servicios:** ¿pasa a ser una tabla editable desde el panel admin, o se mantiene hardcodeado en el frontend?
3. **Pago:** ¿se integra Mercado Pago de verdad (cobro automático) o se mantiene el flujo manual de transferencia + comprobante?
4. **WhatsApp:** ¿se integra la Cloud API para enviar mensajes automáticos (confirmación al crear cita, recordatorio 24h antes), o se mantienen los links `wa.me` manuales?
5. **Recordatorios automáticos:** si se integra WhatsApp de verdad, ¿quién dispara el recordatorio de 24h — un cron/job en Supabase (Edge Function + `pg_cron`), o se sigue mandando a mano?
6. **Multi-profesional:** ¿sigue siendo una sola dueña atendiendo, o se contempla a futuro más de una persona con su propia agenda?
7. **Notas de clienta vs. notas de la dueña:** ¿conviene separar `favoriteColors`/`allergies` (que edita la clienta) de las notas privadas de la dueña (que hoy comparten el mismo campo `notes`)?
8. **Ingresos del dashboard:** ¿se filtra por mes calendario real, o se deja como total acumulado de citas completadas?
9. **Registro de admin:** ¿se mantiene "solo se crea a mano en la base de datos", o se agrega alguna forma de invitar/promover un usuario a admin desde la propia app?
