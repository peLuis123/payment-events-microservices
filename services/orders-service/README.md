# Orders Service

Servicio HTTP que recibe órdenes de pago y publica eventos `payment.requested` en SQS.

## Responsabilidad

- Expone `POST /orders` mediante Lambda Function URL.
- Valida el body con Zod.
- Crea un `eventId` y un evento de pago.
- Publica el evento en `payment-queue`.
- Responde `202 Accepted` sin esperar el procesamiento del pago.

## Desarrollo local

```cmd
npm install
npm test
npm run dev
```

Por defecto escucha en `http://localhost:3000`. El archivo `.env` contiene la configuración local y no se versiona.

## Variables de entorno

| Variable        | Uso                                |
| --------------- | ---------------------------------- |
| `AWS_REGION`    | Región local del SDK, `us-east-2`. |
| `SQS_QUEUE_URL` | URL de `payment-queue`.            |
| `SQS_QUEUE_ARN` | ARN usado por IAM y Serverless.    |
| `NODE_ENV`      | Entorno de ejecución.              |
| `PORT`          | Puerto local.                      |

## Despliegue

```cmd
serverless deploy
```

La función desplegada usa `src/handler.handler` y una Lambda Function URL. La especificación HTTP está en [docs/openapi.yaml](docs/openapi.yaml).

Swagger UI está disponible en:

```text
http://localhost:3000/docs
https://FUNCTION_URL/docs
```

## Ejemplo

```cmd
curl -X POST "https://FUNCTION_URL/orders" ^
  -H "Content-Type: application/json" ^
  -d "{\"orderId\":\"order-123\",\"customerId\":\"customer-456\",\"amount\":49.99,\"currency\":\"USD\"}"
```

Respuesta esperada:

```json
{
  "message": "Order accepted",
  "eventId": "generated-event-id"
}
```
