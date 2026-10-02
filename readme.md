# Ecommerce y pagos en AWS

Monorepo de servicios Node.js para el ecommerce Casa Nativa: autenticación, catálogo, carrito, pedidos e integración con Stripe y PayPal. Utiliza AWS Lambda, DynamoDB, SQS y SNS, con despliegues mediante Serverless Framework.

## Servicios

| Servicio | Responsabilidad |
| --- | --- |
| [orders-service](services/orders-service/README.md) | API HTTP de autenticación, catálogo, inventario, carritos, pedidos y operaciones administrativas. |
| [payment-processor](services/payment-processor/README.md) | Procesamiento de eventos y adapters de checkout, reembolsos y retiros. |
| [webhook-service](services/webhook-service/README.md) | Recepción y verificación de eventos de Stripe y PayPal. |
| [notification-service](services/notification-service/README.md) | Consumo de eventos SNS y notificaciones mediante logs. |

El frontend se mantiene en el repositorio independiente `aws-ecommerce` y se publica en Firebase Hosting. Las imágenes se suben a Firebase Storage y los productos almacenan su URL.

## Flujos

- La API de ecommerce gestiona sesiones, productos, categorías, carritos y pedidos comerciales en DynamoDB.
- El checkout solicita al procesador una sesión del proveedor. Stripe y PayPal notifican sus resultados mediante webhooks firmados.
- El servicio de webhooks registra identificadores de eventos en DynamoDB y publica eventos internos en SNS.
- El flujo de órdenes de pago `POST /orders` publica `payment.requested` en SQS. El consumidor procesa el mensaje y publica su resultado en SNS.
- Notification Service consume los mensajes SNS y registra la notificación en CloudWatch.

Los eventos y solicitudes de pago incluyen identificadores de idempotencia. Los reintentos del checkout utilizan `Idempotency-Key`.

## Autorización y tienda única

El comercio se determina mediante `STOREFRONT_MERCHANT_ID`. Los registros públicos crean usuarios `buyer`; las operaciones administrativas requieren una sesión con rol `admin`.

Los compradores acceden a sus propios carritos, pedidos y pagos. El flujo de tienda única no requiere registros en `Merchants` o `MerchantUsers`. `X-Merchant-Id` no concede permisos. Las API keys se reservan para integraciones de servidor.

## Requisitos y configuración

- Node.js 22 y npm para trabajar con el runtime configurado en Lambda.
- Credenciales AWS autorizadas para los recursos de cada servicio.
- Configuración de proveedores y variables de entorno requeridas por cada `serverless.yml`.

Cada servicio tiene instalación, pruebas y despliegue independientes. Los archivos `.env` no se versionan. Los servicios que incluyen `.env.example` lo ofrecen como plantilla; `serverless.yml` define las variables utilizadas en el despliegue. No se almacenan credenciales en los README.

## Instalación y pruebas

Desde la carpeta del servicio correspondiente:

```sh
npm ci
npm test
```

Los tests emplean dobles de AWS y de los proveedores. No sustituyen la comprobación del flujo en un entorno desplegado.

## Despliegue

Desde la carpeta de cada servicio:

```sh
npx serverless deploy
```

La región predeterminada es `us-east-2`; el stage predeterminado es `dev`. La configuración de recursos, funciones, eventos e IAM está en el `serverless.yml` de cada servicio. Las URLs, ARNs y secretos requeridos deben estar disponibles en el entorno antes del despliegue.

Para publicar la versión del catálogo paginado, despliega `orders-service` antes del frontend.

## Documentación

- [API HTTP de Orders](services/orders-service/docs/openapi.yaml).
- Swagger UI en `/docs` del servicio Orders.
- [Contratos de eventos](docs/event-contracts.yaml).
- Los README de cada servicio describen configuración y comandos específicos.

## Consideraciones de operación

- La API de catálogo paginada conserva la respuesta de array para consultas sin parámetros de paginación. La búsqueda y el orden global requieren leer el catálogo del comercio con el índice actual.
- El ajuste de inventario utiliza una cantidad esperada; un conflicto devuelve `409`. Las reservas del mismo pedido son idempotentes y la transacción admite hasta 49 productos distintos.
- El flujo simulado de órdenes y los adapters de proveedores son mecanismos diferentes. El modo de Stripe depende de la clave configurada; PayPal utiliza `PAYPAL_ENVIRONMENT`.
- Notification Service registra logs; no envía correo. Su deduplicación se limita a la vida de cada instancia Lambda.
