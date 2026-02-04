# Cómo obtener el estado de una transacción

Bold pone a tu disposición varios métodos para que conozcas en qué estado se encuentra cada transacción realizada mediante integraciones de pagos en línea (botón de pagos, plugins para e-commerce, etc).

Puedes leer aquí los diferentes estados en los que puede encontrarse una transacción tras el pago.

## Métodos de consulta

Los métodos para obtener el estado de una transacción pueden dividirse en 2 tipos de consulta:

**Activa:** Deberás realizar una acción de tu lado cuando quieras saber el estado de una transacción.

- API
- Historial de ventas
- Reporte de transacciones

**Pasiva:** Bold te notificará automáticamente sobre el estado de las transacciones.

- Notificación por correo
- Webhook (método recomendado)

A continuación se detalla cada uno de ellos.

## Consulta activa

### API

Si requieres conocer activamente el estado de una transacción, puedes consultar en cualquier momento nuestra API apuntando al siguiente endpoint:

```
GET https://payments.api.bold.co/v2/payment-voucher/<identificador*único_de_la_venta>
```

> **info**
> La transacción puede demorar un tiempo en verse reflejada cuando el comprador finaliza y vuelve a tu tienda, por lo que la respuesta de la API puede que sea NO_TRANSACTION_FOUND, por este motivo recomendamos la integración de nuestro Webhook el cual asegura la notificación del estado de la compra en el momento preciso.
>
> La consulta con el identificador\*único_de_la_venta solo aplica para las integraciones con nuestro Botón de pagos y no para Link de pago.

Deberás agregar a la petición el siguiente header para que podamos identificar tu comercio:

| Llave         | Valor                          |
| ------------- | ------------------------------ |
| Authorization | x-api-key <llave_de_identidad> |

Por ejemplo, si la llave de identidad es:

```
DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH
```

Quedaría de la siguiente forma:

| Llave         | Valor                                                 |
| ------------- | ----------------------------------------------------- |
| Authorization | x-api-key DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH |

> **warning**
> No confundas la llave de identidad con la llave secreta. Si es incorrecta o no se anexa al header, la petición sera rechazada con el código 401 Unauthorized.

La respuesta contiene datos relativos a la transacción entre los cuales se encuentra el estado actual de la misma (que no necesariamente debe ser el estado final). A continuación un par de ejemplos de respuesta del servicio:

En el caso de una venta sin intentos de pago, se presentarán los siguientes campos de respuesta donde payment_status tiene el valor NO_TRANSACTION_FOUND.

```json
{
  "link_id": "BTN_BJDNPZZDC5",
  "total": 200000,
  "subtotal": 199900,
  "description": "Camiseta Rolling Stones XL",
  "reference_id": "ABCD2000",
  "payment_status": "NO_TRANSACTION_FOUND"
}
```

Si se realizó algún intento de pago, payment_status contendrá el estado de la transacción que puede ser uno de los que se indican más abajo.

```json
{
  "link_id": "BTN_8NSUASQINB",
  "transaction_id": "CNPVI70CQC0EY",
  "total": 10000,
  "subtotal": 9900,
  "description": "Mi producto estrella ⭐️🚀",
  "reference_id": "ABCD1000",
  "payment_method": "CREDIT_CARD",
  "payer_email": "juan.sanchez@mail.com",
  "transaction_date": "2023-12-06 17:27:16-05:00",
  "payment_status": "APPROVED"
}
```

### Historial de ventas

Puedes acceder al historial de ventas para ver el estado de las mismas.

[Historial de ventas](https://app.bold.co/historial-de-ventas)

### Reporte de transacciones

Descargando el reporte de transacciones diario o mensual puedes ver todas las transacciones realizadas y sus correspondientes estados en un documento de Excel.

Entre ellas encontrarás las realizadas con integraciones online (botón de pagos, plugins, etc) y las correspondientes referencias de cada una de las ventas.

## Consulta pasiva

### Notificación por correo

Al concluir una transacción en Bold de forma exitosa (pago aprobado), tanto el cliente como el comercio recibirán automáticamente una notificación por correo electrónico con el resultado detallado. Este mensaje incluye la referencia de la venta, información específica sobre el método de pago usado y otros detalles relativos a la transacción.

> **success**
> Esta es la forma más sencilla para que ambas partes puedan conocer si una transacción fue aprobada sin requerir configuraciones o integraciones previas.

### Webhook

Mediante este método recibirás automáticamente una notificación cuando se actualice el estado de una transacción. Bold te notificará el resultado de la misma en la URL que nos indiques y que debes configurar previamente.

Puedes leer la documentación relativa al webhook en esta guía para conocer más detalles.

> **success**
> Este es el método recomendado por Bold.

> **warning** > **Ambiente de pruebas**
>
> Ten en cuenta que no recibiras notificaciones por webhook si estás usando el ambiente de pruebas. Estamos trabajando para poder ofrecerte esta funcionalidad también en este ambiente para que puedas probar el flujo completo durante la fase de integración.

## Estados de una transacción

Principalmente, una transacción puede estar aprobada o rechazada.

Sin embargo, y dependiendo del método de pago usado, puede encontrarse en otros estados que se detallan a continuación:

En la respuesta de la API y las notificaciones recibidas mediante webhook encontrarás el estado de la transacción que indica en qué punto del proceso de pago se encuentra la misma. El estado permite saber si la transacción sigue en proceso o si ya se encuentra en su estado definitivo.

Las transacciones en proceso pueden tener uno de los siguientes estados:

- **PROCESSING**
- **PENDING** (solo PSE)

Los estados finales de una transacción pueden ser uno de los siguientes:

- **APPROVED:** Transacción aprobada
- **REJECTED:** Transacción rechazada
- **FAILED:** Transacción fallida
- **VOIDED:** Transacción anulada
