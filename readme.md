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
