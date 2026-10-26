# Librería API — API REST de venta y compra de libros

API REST construida con Node.js + Express que simula el backend de una tienda de libros de segunda mano. Los usuarios se registran con un rol específico (**vendedor** o **comprador**), los vendedores publican libros y los compradores los adquieren.

> ⚠️ **Importante:** Esta es una **API simulada con fines de practicas con node.js**. Los datos se guardan en memoria y se pierden al reiniciar el servidor. No procesa pagos reales. Al final del documento se explica cómo evolucionarla a producción.

---

## 📋 Tabla de contenidos

- [¿Qué es esta API?](#qué-es-esta-api)
- [¿Qué puede hacer?](#qué-puede-hacer)
- [¿Qué NO puede hacer (por ser simulada)?](#qué-no-puede-hacer-por-ser-simulada)
- [Arquitectura](#arquitectura)
- [Tecnologías usadas](#tecnologías-usadas)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Cómo ejecutar](#cómo-ejecutar)
- [Roles y permisos](#roles-y-permisos)
- [Endpoints](#endpoints)
- [Ejemplos de uso](#ejemplos-de-uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Cómo evolucionar a producción](#cómo-evolucionar-a-producción)
- [Licencia](#licencia)

---

## ¿Qué es esta API?

Es una **simulación funcional de un marketplace de libros**. Está pensada para:

- Aprender cómo se diseña una API REST con autenticación JWT.
- Entender la **arquitectura en capas** (routes → controllers → services → repositories).
- Practicar **autorización por roles (RBAC)**: no todos los usuarios pueden hacer lo mismo.
- Modelar un flujo de negocio real: publicar → comprar → marcar como vendido.

Todos los datos viven **en memoria** (arrays de JavaScript). Cuando reinicias el servidor, se borran. Esto es intencional: permite probar la API sin instalar una base de datos.

**No es un producto listo para producción.** No procesa pagos, no envía correos, no maneja stock ni envíos. Es una base sólida para aprender y extender.

---

## ¿Qué puede hacer?

### Autenticación con roles
- ✅ Registrar usuarios con rol **`vendedor`** o **`comprador`**.
- ✅ Iniciar sesión y obtener un token JWT válido por 2 horas.
- ✅ Hashear contraseñas con bcrypt (nunca se guardan en texto plano).
- ✅ Validar que el rol sea uno de los dos permitidos.

### Vendedores
- ✅ Publicar libros con título y precio.
- ✅ Ver sus libros publicados (los que aún no se han vendido).
- ✅ No pueden comprar sus propios libros (validación explícita).

### Compradores
- ✅ Ver el catálogo de libros disponibles (público, sin token).
- ✅ Comprar libros con un solo clic (marcado como vendido).
- ✅ No pueden comprar libros ya vendidos.
- ✅ No pueden comprar sus propios libros (aunque el rol lo permita, se valida).

### Seguridad
- ✅ Contraseñas hasheadas con bcrypt.
- ✅ JWT firmado con clave secreta en `.env`.
- ✅ Autorización por roles: `POST /books` solo vendedores, `POST /books/:id/buy` solo compradores.
- ✅ El `sellerId` siempre se extrae del token, nunca del cuerpo de la petición.

---

## ¿Qué NO puede hacer (por ser simulada)?

| Limitación | ¿Por qué? | Cómo se resuelve en producción |
|-----------|----------|-------------------------------|
| **Procesar pagos reales** | No hay integración con pasarelas de pago. | Stripe / MercadoPago / PayPal |
| **Persistencia de datos** | Los datos están en arrays en memoria. Al reiniciar, se pierden. | MongoDB / PostgreSQL |
| **Enviar correos de confirmación** | No hay servicio de email. | Nodemailer + SendGrid / Mailgun |
| **Subir portadas de libros** | Solo se guarda título y precio. No hay campo de imagen. | `multer` + Cloudinary / S3 |
| **Manejar stock** | Cada libro es único (un solo ejemplar). No hay inventario. | Modelo `Inventory` con cantidad |
| **Múltiples fotos por libro** | No implementado. | Array de URLs o tabla `BookImage` |
| **Categorías / filtros** | No hay categorías ni búsqueda. | Campo `category` + query params |
| **Reseñas / ratings** | No hay sistema de calificaciones. | Modelo `Review` + endpoint |
| **Historial de compras** | El comprador no tiene endpoint para ver qué compró. | Endpoint `GET /books/purchased` |
| **Reembolsos** | No implementado. | Flujo de negocio complejo |
| **Envíos** | No hay tracking ni direcciones. | Integración con logística |
| **Rate limiting** | Cualquiera puede spamear registros o compras. | `express-rate-limit` |
| **Verificación de email** | Cualquiera puede registrarse con email falso. | Token de verificación por email |
| **Recuperación de contraseña** | No hay flujo de "olvidé mi contraseña". | Token por email + expiración |
| **Favoritos / wishlist** | No implementado. | Modelo `Favorite` |

---

## Arquitectura

La API sigue una **arquitectura en capas** (Layered Architecture):

```
Cliente HTTP
    │
    ▼
┌──────────────────────────┐
│  Routes                  │  ← Define URLs y middlewares
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Controllers             │  ← Traduce HTTP ↔ negocio
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Services                │  ← Lógica de negocio (validaciones)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  Repositories            │  ← Acceso a datos (arrays)
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  db.js (arrays en RAM)   │  ← Datos simulados
└──────────────────────────┘
```

**Regla de oro:** cada capa solo habla con la de abajo. Nunca se salta capas.

### Roles de cada capa

| Capa | Responsabilidad | Lo que NO hace |
|------|----------------|----------------|
| **Routes** | Mapear URL → controlador, aplicar middlewares | Lógica, validaciones |
| **Controllers** | Extraer datos del `req`, llamar al servicio, devolver `res` con código HTTP | Acceso a datos, reglas de negocio |
| **Services** | Validar reglas de negocio, generar IDs, hashear contraseñas, validar roles | Tocar `req`, `res`, ni el array de datos |
| **Repositories** | Leer, crear, actualizar en el array `db.js` | Validaciones, lógica de negocio |
| **Middlewares** | Autenticación JWT y autorización por rol | Lógica de negocio |

---

## Tecnologías usadas

| Tecnología | Para qué |
|-----------|---------|
| **Node.js** (v18+) | Entorno de ejecución |
| **Express** | Framework HTTP |
| **jsonwebtoken** | Generar y verificar JWT |
| **bcryptjs** | Hash de contraseñas |
| **dotenv** | Variables de entorno |
| **crypto** (nativo) | Generar UUIDs (`crypto.randomUUID()`) |
| **nodemon** (dev) | Reinicio automático en desarrollo |

---

## Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone <url-del-repo> libreria-api
cd libreria-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo `.env`

Copia la plantilla y rellena los valores:

```bash
cp .env.example .env
```

Edita `.env`:

```env
PORT=3000
JWT_SECRET=cambia_esto_por_una_clave_larga_y_aleatoria
```

> 🔒 **Nunca subas `.env` a Git.** Ya está en `.gitignore`.

---

## Variables de entorno

| Variable | Obligatoria | Descripción | Ejemplo |
|----------|------------|-------------|---------|
| `PORT` | No | Puerto donde corre el servidor (default `3000`) | `3000` |
| `JWT_SECRET` | **Sí** | Clave secreta para firmar/verificar tokens. Debe ser larga y aleatoria. | `mi_clave_secreta_super_segura_2026` |

Si `JWT_SECRET` falta, el login **fallará** con error `secretOrPrivateKey must have a value`.

---

## Cómo ejecutar

### Desarrollo (con reinicio automático)

```bash
npm run dev
```

### Producción (sin nodemon)

```bash
npm start
```

Verás en consola:

```
Servidor corriendo en http://localhost:3000
```

---

## Roles y permisos

La API tiene **dos roles**. Cada uno tiene permisos distintos:

| Acción | Público | Comprador | Vendedor |
|--------|---------|-----------|----------|
| Ver catálogo (`GET /books`) | ✅ | ✅ | ✅ |
| Registrarse (`POST /auth/register`) | ✅ | — | — |
| Login (`POST /auth/login`) | ✅ | — | — |
| Publicar libro (`POST /books`) | ❌ | ❌ | ✅ |
| Comprar libro (`POST /books/:id/buy`) | ❌ | ✅ | ❌ |

**¿Por qué el vendedor no puede comprar?** En este modelo de negocio, un vendedor **no es cliente de sí mismo**. Si quisieras permitir que un vendedor también compre, tendrías que rediseñar el modelo para que el rol no sea excluyente (ej: `roles: ['vendedor', 'comprador']` como array).

**¿Por qué el comprador no puede publicar?** Porque en este marketplace simplificado cada rol hace una sola cosa. Es una decisión de diseño, no una limitación técnica.

---

## Endpoints

### 🔓 Públicos (no requieren token)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Registrar usuario (con rol) |
| `POST` | `/auth/login` | Iniciar sesión y obtener JWT |
| `GET` | `/books` | Ver catálogo de libros disponibles |

### 🔒 Protegidos (requieren `Authorization: Bearer <token>`)

| Método | Ruta | Rol requerido | Descripción |
|--------|------|---------------|-------------|
| `POST` | `/books` | **Vendedor** | Publicar un libro |
| `POST` | `/books/:id/buy` | **Comprador** | Comprar un libro |

---

## Ejemplos de uso

### 1. Registrar un vendedor

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Vendedor1","email":"vendedor@test.com","password":"123456","role":"vendedor"}'
```

**Respuesta:**
```json
{
  "id": "a1b2c3d4-...",
  "name": "Vendedor1",
  "email": "vendedor@test.com",
  "role": "vendedor"
}
```

### 2. Registrar un comprador

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Comprador1","email":"comprador@test.com","password":"123456","role":"comprador"}'
```

### 3. Login del vendedor (guarda el token)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendedor@test.com","password":"123456"}'
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "vendedor"
}
```

### 4. Publicar un libro (con token del vendedor)

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_VENDEDOR>" \
  -d '{"title":"Cien años de soledad","price":25.50}'
```

**Respuesta:**
```json
{
  "id": "libro-abc-123",
  "title": "Cien años de soledad",
  "price": 25.50,
  "sellerId": "a1b2c3d4-...",
  "sold": false,
  "buyerId": null,
  "createdAt": "2026-01-15T10:30:00.000Z"
}
```

### 5. Ver catálogo (público, sin token)

```bash
curl http://localhost:3000/books
```

**Respuesta:**
```json
[
  {
    "id": "libro-abc-123",
    "title": "Cien años de soledad",
    "price": 25.50,
    "sellerId": "a1b2c3d4-...",
    "sold": false
  }
]
```

> 🔍 **Nota:** solo aparecen libros **no vendidos**. Los vendidos se ocultan del catálogo automáticamente.

### 6. Comprar un libro (con token del comprador)

```bash
curl -X POST http://localhost:3000/books/libro-abc-123/buy \
  -H "Authorization: Bearer <TOKEN_COMPRADOR>"
```

**Respuesta:**
```json
{
  "message": "Compra realizada",
  "book": {
    "id": "libro-abc-123",
    "title": "Cien años de soledad",
    "price": 25.50,
    "sellerId": "a1b2c3d4-...",
    "sold": true,
    "buyerId": "e5f6g7h8-..."
  }
}
```

### 7. Casos de error esperados

**Comprar un libro ya vendido:**
```json
{ "error": "El libro ya fue vendido" }
```

**Comprar tu propio libro:**
```json
{ "error": "No puedes comprar tu propio libro" }
```

**Vendedor intenta comprar (rol incorrecto):**
```json
{ "error": "No tienes permiso para esta acción" }
```

**Comprador intenta publicar (rol incorrecto):**
```json
{ "error": "No tienes permiso para esta acción" }
```

**Token inválido o expirado:**
```json
{ "error": "Token inválido o expirado" }
```

---

## Estructura del proyecto

```
libreria-api/
├── src/
│   ├── routes/
│   │   ├── authRoutes.js          # POST /auth/register, /auth/login
│   │   └── bookRoutes.js          # GET /books, POST /books, POST /books/:id/buy
│   ├── controllers/
│   │   ├── authController.js      # Traduce HTTP ↔ authService
│   │   └── bookController.js      # Traduce HTTP ↔ bookService
│   ├── services/
│   │   ├── authService.js         # Registro con rol, login, JWT, bcrypt
│   │   └── bookService.js         # Publicar, listar, comprar (validaciones)
│   ├── repositories/
│   │   ├── db.js                  # Arrays en memoria (la "BD")
│   │   ├── userRepository.js      # CRUD de usuarios
│   │   └── bookRepository.js      # CRUD de libros
│   ├── middlewares/
│   │   └── authMiddleware.js      # authenticate + authorizeRole
│   ├── config/                    # (reservado para configuración futura)
│   ├── app.js                     # Ensambla Express (sin escuchar)
│   └── server.js                  # Inicia el servidor
├── node_modules/                  # Dependencias (no va a Git)
├── .env                           # Secretos reales (no va a Git)
├── .env.example                   # Plantilla (sí va a Git)
├── .gitignore
├── package.json
└── package-lock.json
```

---

## Limitaciones conocidas

Además de las ya mencionadas, esta API tiene:

1. **No hay paginación** en el catálogo. Si hay 10 000 libros, todos se devuelven de una vez. → Agregar `?page=1&limit=20`.
2. **No hay búsqueda ni filtros** (`?q=cien&minPrice=10&maxPrice=50`). → Agregar query params.
3. **No hay categorías** ni tags. → Agregar campo `category` al modelo.
4. **No hay reseñas** de libros ni vendedores. → Modelo `Review`.
5. **No hay historial de compras** del comprador. → Endpoint `GET /books/purchased`.
6. **No hay endpoint para que el vendedor vea sus libros vendidos**. → Agregar `GET /books/sold`.
7. **No hay cancelación de compra**. → Endpoint `POST /books/:id/refund`.
8. **No hay edición ni eliminación de libros**. → `PATCH` y `DELETE`.
9. **El JWT no se puede revocar** antes de que expire. → Blacklist o rotación.
10. **No hay validación de formato de email**. → Regex o librería `validator`.
11. **No hay rate limiting**. Cualquiera puede crear 1000 cuentas. → `express-rate-limit`.
12. **No hay tests automatizados**. → Jest + Supertest.
13. **No hay logs estructurados**. → `pino` o `winston`.
14. **El "precio" no valida decimales** correctamente. → Usar centavos (enteros) o librería `dinero.js`.

---

## Cómo evolucionar a producción

### Paso 1 — Persistencia real (MongoDB / PostgreSQL)

Reemplazar los arrays de `db.js` por una BD real. **Solo cambian los repositorios**, no los servicios ni los controladores. Ese es el beneficio de la arquitectura en capas.

**Ejemplo con MongoDB + Mongoose:**

```javascript
// src/repositories/bookRepository.js
const Book = require('../models/Book');

const create = (book) => Book.create(book);
const findAll = () => Book.find({ sold: false });
const findById = (id) => Book.findById(id);
const update = (id, data) => Book.findByIdAndUpdate(id, data, { new: true });

module.exports = { create, findAll, findById, update };
```

Los servicios **no cambian una sola línea**. Siguen llamando `bookRepository.findById(id)`.

### Paso 2 — Pagos reales con Stripe

```bash
npm install stripe
```

Flujo:
1. Comprador hace `POST /books/:id/buy`.
2. Backend crea un **PaymentIntent** en Stripe.
3. Devuelve el `client_secret` al frontend.
4. Frontend confirma el pago con Stripe.js.
5. Stripe envía un **webhook** al backend: `payment_intent.succeeded`.
6. El backend marca el libro como vendido.

**Nunca marques el libro como vendido antes de confirmar el pago.** En esta API simulada lo hacemos directo, pero en producción es un error grave.

### Paso 3 — Subida de portadas

```bash
npm install multer
```

```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/books', authenticate, authorizeRole('vendedor'), upload.single('cover'), bookController.create);
```

Guardar el archivo en S3/Cloudinary y devolver la URL pública.

### Paso 4 — Emails transaccionales

```bash
npm install nodemailer
```

Enviar email al vendedor cuando su libro se vende, y al comprador con la confirmación.

### Paso 5 — Búsqueda y filtros

Agregar query params a `GET /books`:

```
GET /books?q=cien&minPrice=10&maxPrice=50&category=novela&page=1&limit=20
```

### Paso 6 — Historial de compras

```javascript
// bookService.js
const getPurchasedBy = (buyerId) => {
  return bookRepository.findAll().filter(b => b.buyerId === buyerId);
};
```

### Paso 7 — Rol flexible (opcional)

Si quieres que un usuario pueda ser **vendedor y comprador a la vez**:

```javascript
// En lugar de:
role: 'vendedor'

// Usar:
roles: ['vendedor', 'comprador']

// Y en el middleware:
const authorizeRole = (...rolesRequeridos) => (req, res, next) => {
  const tieneAlguno = rolesRequeridos.some(r => req.user.roles.includes(r));
  if (!tieneAlguno) return res.status(403).json({ error: 'Sin permiso' });
  next();
};
```

Y en el JWT, incluir `roles: ['vendedor', 'comprador']` en lugar de `role: 'vendedor'`.

---

## Licencia

MIT — libre para usar, modificar y aprender.

---

## Créditos

Proyecto educativo para aprender **Node.js + Express + JWT + RBAC + arquitectura en capas**.

No es un producto comercial. No lo uses en producción sin implementar las mejoras listadas arriba.
