# Webhook Service

Servicio previsto para recibir webhooks firmados de Stripe y PayPal, traducirlos
a eventos internos y publicarlos para el resto de la plataforma.

## Proveedores

- Stripe: valida la firma HMAC del header `Stripe-Signature` y procesa eventos
  como `payment_intent.succeeded`, fallidos, reembolsos y disputas.
- PayPal: valida la autenticidad con la API de verificación de webhooks y
  procesa capturas, rechazos, reembolsos y disputas.

## Idempotencia

- `Idempotency-Key`: se reserva para solicitudes de checkout iniciadas por un
  cliente.
- `providerEventId`: evita procesar dos veces un webhook externo.
- `PayPal-Request-Id`: identifica reintentos de llamadas salientes a PayPal.
- Stripe usa `Idempotency-Key` en la creación de Payment Intents.

La implementación actual contiene adapters y tests locales; la persistencia
durable de eventos y el endpoint Lambda son tareas posteriores.
