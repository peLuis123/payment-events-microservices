# Webhook Service

Servicio HTTP que recibe eventos de Stripe y PayPal, verifica su autenticidad, los traduce a eventos internos y los publica en SNS.

## Procesamiento

- Stripe: verificación de la firma `Stripe-Signature` sobre el cuerpo del evento.
- PayPal: verificación mediante la API del proveedor.
- Traducción de eventos de pagos, reembolsos y disputas al contrato interno.
- Registro de identificadores de eventos en DynamoDB mediante el repositorio `ProviderEvents`.
- Publicación de eventos en el topic indicado por `PAYMENT_EVENTS_TOPIC_ARN`.

El punto de entrada desplegado es `src/handler.handler`, expuesto mediante Lambda Function URL. La configuración de endpoints de los proveedores debe apuntar a las rutas definidas por la aplicación.

## Instalación y pruebas

```sh
npm ci
npm test
npm run dev
```

Las pruebas utilizan firmas, eventos y dependencias controladas; no sustituyen la entrega de un webhook desde el proveedor al entorno desplegado.

## Configuración

Completa `.env.example` en un `.env` local excluido de Git o proporciona las variables mediante el entorno de despliegue.

| Variable | Uso |
| --- | --- |
| `PAYMENT_EVENTS_TOPIC_ARN` | Topic SNS de eventos internos. |
| `PROVIDER_EVENTS_TABLE` | Tabla de identificadores de eventos; predeterminado `ProviderEvents`. |
| `STRIPE_WEBHOOK_SECRET` | Secreto de firma del endpoint Stripe. |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Credenciales para verificar eventos PayPal. |
| `PAYPAL_WEBHOOK_ID` | Identificador del webhook PayPal. |
| `PAYPAL_WEBHOOK_SECRET` | Variable requerida por la configuración del servicio. |
| `PAYPAL_ENVIRONMENT` | Selección del entorno PayPal; predeterminado `sandbox`. |

Consulta `serverless.yml` para las variables, permisos y recursos del despliegue. Las credenciales del proveedor y sus secretos de webhook no se incluyen en el código ni en esta documentación.

## Despliegue

```sh
npx serverless deploy
```

El servicio necesita acceso a la tabla de eventos y permiso para publicar en SNS. La recepción HTTP, publicación y consumo del evento son etapas distintas del procesamiento.
