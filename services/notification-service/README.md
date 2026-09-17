# Notification Service

Consumidor de eventos SNS que simula el envío de notificaciones mediante logs estructurados.

## Flujo

1. Recibe un envelope real de SNS.
2. Valida los campos estándar de AWS y el evento de pago.
3. Ignora eventos duplicados por `eventId` durante la vida de la instancia.
4. Registra `Payment notification sent` sin exponer el payload completo.
5. Propaga errores para permitir reintentos y DLQ.

## Desarrollo local

```cmd
npm install
npm test
npm run test:coverage
```

El handler se prueba con eventos SNS simulados; no necesita un puerto HTTP.

## Variables de entorno

| Variable        | Uso                                |
| --------------- | ---------------------------------- |
| `SNS_TOPIC_ARN` | Topic SNS de resultados.           |
| `AWS_REGION`    | Región local del SDK, `us-east-2`. |
| `NODE_ENV`      | Entorno de ejecución.              |

## Despliegue

```cmd
serverless deploy
```

El despliegue crea la Lambda, suscripción al topic SNS, DLQ y permiso para que SNS invoque la función.

## Limitación del MVP

La deduplicación actual usa memoria de la instancia Lambda. Para una garantía duradera entre cold starts se debe mover a DynamoDB o a otra store compartida en una fase posterior.
