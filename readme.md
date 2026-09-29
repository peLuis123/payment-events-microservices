# Payment Events - Arquitectura de Microservicios en AWS

MVP de procesamiento de pagos basado en eventos, construido con Node.js,
AWS Lambda y servicios administrados de AWS.

## Objetivo

Recibir una orden de pago, procesarla de forma asíncrona y notificar su
resultado sin acoplar directamente los microservicios.

## Arquitectura

```text
Cliente
	|
	v
Orders Service (Lambda Function URL)
	|
	v
SQS payment-queue
	|
	v
Payment Processor (Lambda)
	|                         \
	v                          v
DynamoDB Orders          SNS payment-events
															 |
															 v
										Notification Service (Lambda)
```

La comunicación entre servicios ocurre mediante SQS y SNS. Orders responde
rápidamente con `202 Accepted`; el procesamiento y la notificación ocurren
después.

## Servicios

| Servicio               | Responsabilidad                            | Entrada             | Salida              |
| ---------------------- | ------------------------------------------ | ------------------- | ------------------- |
| `orders-service`       | Validar y encolar órdenes                  | HTTP `POST /orders` | SQS `payment-queue` |
| `payment-processor`    | Decidir, persistir y publicar resultados   | SQS                 | DynamoDB y SNS      |
| `notification-service` | Consumir resultados y simular notificación | SNS                 | CloudWatch Logs     |

Cada servicio tiene su propio `package.json`, tests y `serverless.yml`, pero
los tres viven en este monorepo.

## Casos de uso del MVP

### Crear una orden de pago

El cliente envía una orden válida. Orders valida el payload, genera un
`eventId`, publica `payment.requested` y responde `202`.

### Aprobar un pago simulado

Payment Processor consume el evento. En el MVP, un monto de hasta `1000 USD`
se aprueba, se guarda en DynamoDB y se publica `payment.approved`.

### Rechazar un pago simulado

Un monto superior a `1000 USD` se rechaza, se guarda el motivo y se publica
`payment.rejected`.

### Evitar duplicados

Los eventos usan `eventId` como identificador de idempotencia. DynamoDB evita
duplicar resultados y los consumidores no deben generar efectos repetidos.

### Reintentar fallos

Los errores de procesamiento se propagan para que AWS aplique reintentos y,
cuando corresponda, envíe el mensaje a una DLQ.

## Documentación de API

La API HTTP de Orders está documentada en [services/orders-service/docs/openapi.yaml](services/orders-service/docs/openapi.yaml), compatible con Swagger UI, Swagger Editor y herramientas OpenAPI.

También puede abrirse desde `http://localhost:3000/docs` o desde `FUNCTION_URL/docs` después del despliegue.

Los contratos SQS/SNS están documentados en [docs/event-contracts.yaml](docs/event-contracts.yaml).

## Estructura

```text
services/
	orders-service/
		README.md
		docs/openapi.yaml
	payment-processor/
		README.md
	notification-service/
		README.md
docs/
	event-contracts.yaml
readme.md
```

## AWS desplegado

Región usada: `us-east-2`.

- Orders: Lambda Function URL pública.
- SQS: `payment-queue`.
- Payment Processor: Lambda con trigger SQS.
- DynamoDB: tabla `Orders`.
- SNS: topic `payment-events`.
- Notification: Lambda suscrita al topic SNS.

Los archivos `.env` contienen valores locales y están excluidos de Git. Usa
`.env.example` como plantilla sin credenciales.

## Desarrollo y pruebas

Cada servicio se instala y prueba desde su propia carpeta:

```cmd
cd services/orders-service
npm install
npm test

cd ../payment-processor
npm install
npm test

cd ../notification-service
npm install
npm test
```

Los tests unitarios mockean AWS. Además, se validó el flujo real en AWS desde
Orders hasta Notification mediante SQS, DynamoDB, SNS y CloudWatch.

## Despliegue

```cmd
cd services/orders-service
serverless deploy

cd ../payment-processor
serverless deploy

cd ../notification-service
serverless deploy
```

Antes de desplegar, revisa las variables del `.env` del servicio. No subas
credenciales ni archivos `.env` al repositorio.

## Frontend futuro

El siguiente producto natural es una aplicación frontend para operar el MVP.
Podrá incluir:

- Formulario para crear órdenes.
- Estado y resultado de cada pago.
- Historial consultado desde una API de lectura.
- Vista de eventos y errores operativos.
- Autenticación y autorización.

Para soportarlo habrá que agregar una API de consulta, un modelo de lectura,
autenticación y posiblemente un servicio frontend independiente. El MVP actual
deja el flujo de escritura y procesamiento listo para esa evolución.

## Limitaciones conocidas

- La decisión de pago es simulada.
- La notificación actual escribe logs en vez de enviar email real.
- La deduplicación de Notification usa memoria de la instancia Lambda; debe
  moverse a una store compartida para una garantía completa entre cold starts.
- La tabla y el topic ya existen en AWS, mientras que la infraestructura futura
  puede centralizarse completamente con Terraform.

## Fase 2: pasarela de pagos

El MVP puede evolucionar sin reemplazar los microservicios actuales. La
primera integración será Stripe y después se añadirá PayPal mediante adapters
intercambiables. Las credenciales se guardarán en AWS Secrets Manager o SSM,
nunca en el código ni en Git.

### Arquitectura objetivo

```text
Frontend
   |
   v
Orders Service -> SQS payment-queue -> Payment Processor
				      |
				      +-> Stripe Adapter
				      +-> PayPal Adapter
				      |
				      v
			      Payment Provider
				      |
				      v
			      Webhook Service
				      |
		 +--------------------+--------------------+
		 v                    v                    v
	     DynamoDB             SNS events       Ledger/Balance
		 |                    |
		 v                    v
	     Query API        Notification Service -> Email provider
```

### Estados de pago

Los pagos reales deben manejar al menos `pending`, `approved`, `rejected`,
`cancelled`, `refunded` y `partially_refunded`. Una respuesta inicial del
proveedor no siempre confirma el cobro; la confirmación definitiva debe llegar
por un webhook firmado.

### Casos de uso de la fase 2

- Crear un Payment Intent en Stripe desde una orden válida.
- Crear una orden de PayPal usando el mismo contrato interno.
- Confirmar pagos mediante webhooks firmados.
- Evitar cobros duplicados con `eventId` y `providerEventId`.
- Registrar un ledger inmutable de cargos, reembolsos y comisiones.
- Consultar balances y movimientos para el futuro frontend.
- Enviar correos de confirmación, rechazo y reembolso.
- Procesar reembolsos totales y parciales.
- Reconciliar periódicamente el estado local contra Stripe o PayPal.

La implementación de esta fase está desglosada en [TASKS.md](TASKS.md) y en
el roadmap de cada servicio.

### Qué significa “completa”

La pasarela se considerará completa para producción cuando, además de crear y
confirmar pagos, pueda mantener un ciclo financiero trazable: estados de pago,
ledger inmutable de doble partida, balances, comisiones, reembolsos, disputas,
reconciliación con los proveedores, webhooks firmados, idempotencia, auditoría,
autorización, límites de uso, backups, recuperación y monitoreo. Las tareas de
esta definición están incluidas en el roadmap y deben completarse antes de
procesar dinero real.

### Idempotencia de pagos

La API de checkout usará `Idempotency-Key` para evitar crear dos pagos ante
reintentos del cliente. Los webhooks usarán `providerEventId` para evitar
procesar dos veces el mismo evento. Para llamadas a PayPal se enviará
`PayPal-Request-Id`; para Stripe se enviará `Idempotency-Key`.

## Correcciones de integración ecommerce

- El carrito requiere sesión y propietario; añadir artículos actualiza cantidades mediante una transacción con control de concurrencia.
- La reserva carga los artículos guardados del pedido y actualiza inventario y marcador de reserva en una sola transacción. Los reintentos del mismo pedido no descuentan stock otra vez.
- Checkout actualiza los campos del pago sobre el pedido existente.
- `GET /commercial-orders` devuelve pedidos del comprador; `GET /merchants/:merchantId/orders` requiere sesión admin y sesión admin de la tienda fija en MerchantUsers.
- La consulta de pagos requiere propietario, rol admin de la tienda fija o identidad de comercio autenticada. X-Merchant-Id por sí solo no autoriza el acceso.

Para aplicar estas correcciones hay que desplegar orders-service con sus cambios IAM y el UserIndex de CommercialOrders, y esperar a que el índice esté activo. Configurar FRONTEND_ORIGIN con el origen exacto usado en el navegador (localhost y 127.0.0.1 son distintos). Inventory debe contener availableQuantity y reservedQuantity para los productos vendibles; Los productos nuevos inicializan Inventory de forma transaccional; los productos anteriores se inicializan mediante el endpoint de inventario. No se modifican datos existentes ni se despliega AWS al ejecutar los tests.

Validación local: `cd services/orders-service` y `npm test -- --silent`. Los tests usan dobles de AWS; no sustituyen una prueba de integración en un entorno desplegado. La liberación/consumo definitivo de reservas y la recuperación duradera del checkout siguen siendo trabajo posterior.

## Endpoints de ecommerce y roles

| Método y ruta | Permiso |
| --- | --- |
| GET /products/:productId | Público para productos activos; admin del comercio para inactivos |
| POST /products y POST /categories | Sesión admin de la tienda fija |
| PATCH /products/:productId | Admin del comercio; edición o status inactive |
| PATCH /categories/:categoryId | Admin del comercio; edición o status inactive |
| PATCH /carts/:cartId/items/:productId | Propietario; cuerpo {quantity: entero positivo} |
| DELETE /carts/:cartId/items/:productId | Propietario; respuesta 204 |
| GET /commercial-orders/:orderId | Propietario o admin del comercio |
| GET /merchants/:merchantId/orders | Admin del comercio |
| GET /products/:productId/inventory | Admin del comercio |
| PATCH /products/:productId/inventory | Admin del comercio; availableQuantity y expectedAvailableQuantity |

El PATCH de inventario mantiene reservedQuantity y sincroniza Products.stock; un valor esperado desactualizado devuelve 409. La reserva de pedidos descuenta ambas tablas en una sola transacción (hasta 49 productos distintos). No modificar stock mediante PATCH de producto. Los PATCH rechazan campos desconocidos, IDs y merchantId. El rol se obtiene de la sesión firmada y el recurso debe pertenecer a la tienda fija; no se consulta MerchantUsers ni se confía en roles enviados por el cliente. Las rutas de lectura pública filtran inactivos; includeInactive=true requiere rol admin de la tienda fija. Los endpoints y sus respuestas están documentados en docs/openapi.yaml del servicio.

## Tienda única: vendedor y compradores

El flujo actual es una tienda fija, un vendedor con rol admin y compradores con rol buyer. Los registros nuevos se crean siempre como buyer; el vendedor se provisiona fuera del registro público. La autorización usa la sesión firmada y el ID interno STOREFRONT_MERCHANT_ID; no consulta Merchants ni MerchantUsers y no exige crear comercios o membresías.

- GET /products y GET /categories listan el catálogo público de la tienda configurada. POST y PATCH de catálogo e inventario requieren admin. Los recursos de otra tienda se rechazan.
- GET /admin/orders y GET /admin/balance resuelven la tienda en el servidor, sin selector. Las rutas antiguas /merchants/:merchantId/orders y /balance solo aceptan el ID de la tienda fija.
- Los compradores conservan permisos por propietario sobre carritos, pedidos y pagos. La creación del carrito usa el ID interno del servidor.
- GET /me/merchants ya no se expone. POST /merchants devuelve 409 SINGLE_STORE_MODE para un admin: no se crean tiendas adicionales.
- X-Merchant-Id no autoriza ni selecciona la tienda. Las API keys siguen reservadas para integraciones de servidor; el navegador usa cookies. Idempotency-Key se mantiene para operaciones de pago.

Desplegar orders-service con STOREFRONT_MERCHANT_ID (valor predeterminado merchant-123), conservando el valor que corresponda a los productos/pedidos existentes. No es necesaria una migración de datos ni crear registros en Merchants/MerchantUsers. No se eliminan tablas ni índices desplegados. La administración de múltiples vendedores se pospone.
