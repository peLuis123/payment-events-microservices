# Payment Processor

Servicio de procesamiento de pagos con adapters de Stripe y PayPal. Incluye consumo de órdenes desde SQS y funciones HTTP para checkout y operaciones financieras.

## Responsabilidades

- Procesar eventos `payment.requested` y publicar resultados en SNS.
- Crear sesiones de Stripe Checkout y órdenes de PayPal.
- Persistir pagos y consultar su estado.
- Procesar solicitudes de reembolso y retiro mediante los adapters de proveedores.
- Registrar movimientos contables, balances y liquidaciones mediante sus repositorios y servicios.

El consumidor de órdenes conserva un flujo simulado de aprobación/rechazo. Ese flujo es independiente del checkout que utiliza credenciales de Stripe o PayPal.

## Instalación y pruebas

```sh
npm ci
npm test
npm run test:coverage
```

Los tests usan eventos y dependencias simuladas. No requieren realizar cobros ni transferencias reales.

## Configuración

Utiliza `.env.example` como referencia y configura los valores requeridos por `serverless.yml` en un `.env` local excluido de Git o en el entorno de despliegue.

| Variable | Uso |
| --- | --- |
| `SQS_QUEUE_URL`, `SQS_QUEUE_ARN` | Cola de entrada y trigger SQS. |
| `SNS_TOPIC_ARN` | Publicación de eventos de pago. |
| `DYNAMODB_TABLE`, `DYNAMODB_TABLE_ARN` | Tabla del flujo de órdenes. |
| `PAYMENTS_TABLE`, `PAYMENTS_TABLE_ARN` | Persistencia de pagos y referencia IAM. |
| `REFUNDS_TABLE`, `PAYOUTS_TABLE` | Reembolsos y retiros. |
| `LEDGER_TABLE`, `BALANCES_TABLE` | Contabilidad y balances. |
| `STRIPE_SECRET_KEY` | Clave de Stripe; determina el modo de prueba o real. |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Credenciales de PayPal. |
| `PAYPAL_ENVIRONMENT` | `production` usa PayPal real; el valor predeterminado es `sandbox`. |
| `AWS_REGION` | Región del SDK. |

Los importes del checkout se representan en unidades menores de la moneda. Las llamadas a proveedores utilizan claves de idempotencia para identificar reintentos.

## Despliegue

```sh
npx serverless deploy
```

`serverless.yml` define las funciones, triggers, permisos y recursos. `src/checkout-handler.js` configura las dependencias del checkout; `src/handler.js` corresponde al consumidor de órdenes. La API del ecommerce utiliza la URL del procesador mediante `PAYMENT_PROCESSOR_CHECKOUT_URL`.
