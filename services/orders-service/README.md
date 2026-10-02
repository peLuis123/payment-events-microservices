# Orders Service

API HTTP del ecommerce. Expone autenticación por sesión, catálogo, inventario, carritos, pedidos, checkout y operaciones administrativas mediante Express y una Lambda Function URL.

## Funcionalidades

- Registro de compradores, login, renovación y cierre de sesión.
- Consulta pública de productos activos y categorías; creación y edición con rol admin.
- Ajuste transaccional de inventario con control de concurrencia.
- Carritos y pedidos con permisos por propietario.
- Reserva de existencias y creación de sesiones de checkout.
- Consulta administrativa de pedidos y balance; solicitudes de reembolso y retiro.
- Recepción de órdenes de pago en `POST /orders` y publicación en SQS.

El backend utiliza `STOREFRONT_MERCHANT_ID` como tienda fija. Los permisos administrativos se comprueban desde la sesión firmada, sin membresías ni cabeceras de selección de comercio.

## Desarrollo y pruebas

```sh
npm ci
npm test
npm run dev
```

El servidor local escucha por defecto en `http://localhost:3000`. Swagger UI está disponible en `/docs` y la especificación está en [docs/openapi.yaml](docs/openapi.yaml).

## Configuración

Crea un `.env` local excluido de Git. `serverless.yml` contiene la configuración completa de despliegue, incluidos nombres de tablas y permisos IAM.

| Variable | Uso |
| --- | --- |
| `AUTH_TOKEN_SECRET` | Secreto de firma de sesiones; obligatorio en el despliegue. |
| `FRONTEND_ORIGIN` | Origen exacto permitido para el frontend y CORS. |
| `STOREFRONT_MERCHANT_ID` | ID interno de la tienda; predeterminado `merchant-123`. |
| `PAYMENT_PROCESSOR_CHECKOUT_URL` | URL del procesador de pagos. |
| `SQS_QUEUE_URL`, `SQS_QUEUE_ARN` | Cola de órdenes y referencia IAM. |
| `MERCHANT_API_KEYS` | Configuración de integraciones de servidor. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Límites de solicitudes. |
| `AWS_REGION`, `PORT` | Región del SDK y puerto local. |
| Variables `*_TABLE` | Tablas de usuarios, sesiones, catálogo, inventario, carritos y pedidos. |

La Lambda se configura con `NODE_ENV=production`. Las cookies de producción usan HTTPS; el frontend local incluye un proxy de desarrollo para trabajar contra la API desplegada.

## Paginación del catálogo

```http
GET /products?page=1&pageSize=12&sort=low&category=ceramica&q=taza
```

Devuelve `{ items, page, pageSize, total, totalPages }`. `pageSize` admite 1–48; `sort` admite `featured`, `low`, `high` y `name`. `category` acepta ID o slug. Los filtros y el orden se aplican antes de paginar. Una página fuera de rango devuelve la última disponible.

Sin `page` ni `pageSize`, la respuesta conserva el formato de array. `includeInactive=true` requiere rol admin. El índice actual exige leer el catálogo del comercio para calcular filtros, orden y totales.

## Inventario y permisos

`PATCH /products/:productId/inventory` recibe `availableQuantity` y `expectedAvailableQuantity`. Sincroniza las existencias del producto e inventario y conserva las unidades reservadas. Un valor esperado desactualizado devuelve `409`.

El stock no se modifica mediante el PATCH general de producto. Productos inactivos requieren admin para su consulta individual. Los compradores solo pueden operar sobre recursos propios.

## Despliegue

```sh
npx serverless deploy
```

La función HTTP utiliza `src/handler.handler`. Conserva el ID de tienda correspondiente a tus datos y configura las variables requeridas antes de desplegar. Los cambios de contrato del catálogo se despliegan antes que el frontend que los consume.
