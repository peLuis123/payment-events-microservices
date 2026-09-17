# Payment Processor

Consumidor de `payment-queue` que procesa pagos y publica resultados en SNS.

## Flujo

1. Recibe un evento `payment.requested` desde SQS.
2. Valida el mensaje con Zod.
3. Ejecuta la decisión simulada: hasta `1000 USD` se aprueba; por encima se rechaza.
4. Persiste el resultado en DynamoDB `Orders`.
5. Publica `payment.approved` o `payment.rejected` en `payment-events`.
6. Usa el `eventId` para evitar efectos duplicados.

## Desarrollo local

```cmd
npm install
npm test
npm run test:coverage
```

El handler se prueba con eventos SQS simulados; no necesita un puerto HTTP.

## Variables de entorno

| Variable             | Uso                                    |
| -------------------- | -------------------------------------- |
| `SQS_QUEUE_URL`      | URL de la cola de entrada.             |
| `SQS_QUEUE_ARN`      | ARN del trigger SQS.                   |
| `DYNAMODB_TABLE`     | Tabla de resultados, `Orders`.         |
| `DYNAMODB_TABLE_ARN` | ARN usado por IAM.                     |
| `SNS_TOPIC_ARN`      | Topic de resultados, `payment-events`. |
| `AWS_REGION`         | Región local del SDK, `us-east-2`.     |

## Despliegue

```cmd
serverless deploy
```

El trigger, la DLQ, los permisos IAM y la suscripción de entrada se definen en `serverless.yml`.
