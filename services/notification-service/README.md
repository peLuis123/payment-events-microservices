# Notification Service

Consumidor de eventos SNS que registra notificaciones de pago mediante logs estructurados en CloudWatch.

## Procesamiento

1. Valida el envelope SNS y el evento de pago.
2. Comprueba si el `eventId` ya fue procesado por la instancia.
3. Registra la notificación sin incluir el payload completo.
4. Propaga los errores para permitir reintentos.

El servicio utiliza un notificador de logs; no envía correos electrónicos. La deduplicación se mantiene en memoria durante la vida de cada instancia Lambda y no se comparte entre instancias.

## Instalación y pruebas

```sh
npm ci
npm test
npm run test:coverage
```

El handler se prueba con eventos SNS simulados y no requiere un servidor HTTP.

## Configuración

Usa `.env.example` como referencia para un `.env` local excluido de Git.

| Variable | Uso |
| --- | --- |
| `SNS_TOPIC_ARN` | Topic SNS de resultados. |
| `AWS_REGION` | Región del SDK. |
| `NODE_ENV` | Entorno de ejecución. |

## Despliegue

```sh
npx serverless deploy
```

`serverless.yml` configura la Lambda, la suscripción SNS, los permisos y la DLQ. El punto de entrada es `src/handler.handler`.
