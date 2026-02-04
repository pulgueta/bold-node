# Recibe eventos de Bold a través de webhook

El webhook de Bold te permite conectar tus sistemas para recibir automáticamente notificaciones sobre eventos de pagos y transacciones realizadas en linea.

Estas notificaciones informarán a tus sistemas sobre los eventos que ocurren en las transacciones realizadas a través de los métodos de pago utilizados en Bold como: pagos con datáfonos, links de pago o botones de pago.

## ¿Para qué usar un webhook?

Los webhooks de Bold te permiten recibir notificaciones inmediatas sobre el estado de las transacciones de pago en tus sistemas backend. Esto te facilitará tomar acciones rápidas y automáticas en tu comercio.

Para recibir las notificaciones, debes configurar un endpoint HTTP de tipo POST. Cuando ocurra un evento, Bold realizará una solicitud al mismo e incluirá los detalles del evento en el cuerpo de la solicitud.

## ¿Qué tipo de eventos puedo recibir?

Puedes recibir los siguientes eventos relacionados con el flujo de pagos:

- Venta aprobada
- Venta rechazada
- Anulación aprobada
- Anulación rechazada

## ¿Cómo lo integro?

Para comenzar a recibir eventos en tu aplicación debes añadir un webhook dentro del Panel de Comercios en la sección de Integraciones.

Para hacerlo, sigue los siguientes pasos:

1. Crea un endpoint para recibir las peticiones POST con la información de los eventos
2. Registra el endpoint dentro del Panel de Comercios en la sección de Integraciones
3. Verifica el origen de los eventos recibidos

## Crea el endpoint

Debes crear un endpoint que pueda aceptar peticiones HTTPS de tipo POST.

Este endpoint debe:

- Recibir la solicitud POST con un cuerpo en formato JSON como el de los siguientes ejemplos según el método de pago usado
- El endpoint debe responder inmediatamente con el código de estado 200 antes de que cualquier lógica de tu sistema provoque un error por tiempo de espera (con un máximo de 2 segundos permitidos). Esta respuesta confirma que el evento fue recibido correctamente.

A continuación encontrarás la descripción de cada uno de los campos contenidos en el cuerpo del JSON.

### Ejemplos de cuerpos de solicitud

#### Datáfono Bold Plus (POS)

```json
{
  "id": "e4f8c1b9-3d02-4a7c-8e51-f672a9b3d0e4",
  "type": "SALE_APPROVED",
  "subject": "F8A5D6B7G2H1",
  "source": "/payments",
  "spec_version": "1.0",
  "time": 1761060600000000000,
  "data": {
    "payment_id": "F8A5D6B7G2H1",
    "merchant_id": "PQR6Y4T8Z3",
    "created_at": "2025-10-21T11:30:15-05:00",
    "amount": {
      "currency": "COP",
      "total": 1000,
      "taxes": [
        {
          "base": 810,
          "type": "VAT",
          "value": 190
        }
      ],
      "tip": 0
    },
    "user_id": "89cba4f0e1d2c3b4a5d6e7f8",
    "metadata": {
      "reference": "ORD-20251021-00145"
    },
    "bold_code": "B000",
    "payer_email": "cliente.ejemplo@email.com",
    "payment_method": "CARD",
    "card": {
      "capture_mode": "CHIP",
      "brand": "VISA",
      "cardholder_name": "JUAN PEREZ",
      "terminal_id": "qpos_smart_54321098765432101234",
      "masked_pan": "451732****0019",
      "installments": 1,
      "card_type": "CREDIT"
    },
    "approval_number": "0045678901",
    "integration": "POS"
  },
  "datacontenttype": "application/json"
}
```

#### Tarjeta web (Link de pago)

```json
{
  "id": "a9c1d0f5-3b7e-4d2a-9f6c-8e4b5d2f0a1b",
  "type": "SALE_APPROVED",
  "subject": "CNPCGSPS2WBA8",
  "source": "/payments/links",
  "spec_version": "1.0",
  "time": 1761063334000000000,
  "data": {
    "payment_id": "CNPCGSPS2WBA8",
    "merchant_id": "MCNTR2025ABC",
    "created_at": "2025-10-21T12:30:10-05:00",
    "amount": {
      "currency": "COP",
      "total": 59900,
      "taxes": [
        {
          "base": 49916,
          "type": "VAT",
          "value": 9484
        }
      ],
      "tip": 500
    },
    "user_id": "usr_web_20251021",
    "metadata": {
      "reference": "WEB-ORD-009876"
    },
    "bold_code": "B000",
    "payer_email": "comprador.web@dominio.com",
    "payment_method": "CARD_WEB",
    "card": {
      "brand": "VISA",
      "cardholder_name": "CARLOS ALDANA",
      "masked_pan": "411111****5432",
      "installments": 1,
      "card_type": "CREDIT"
    },
    "approval_number": "123456",
    "integration": "LINK"
  },
  "datacontenttype": "application/json"
}
```

#### Nequi

```json
{
  "id": "c1d4e7f0-a3b8-4c9d-8e7f-1a2b3c4d5e6f",
  "type": "SALE_APPROVED",
  "subject": "TLCP9YXRV23",
  "source": "/payments/nequi",
  "spec_version": "1.0",
  "time": 1761065000000000000,
  "data": {
    "payment_id": "TLCP9YXRV23",
    "merchant_id": "MCNT2025XYZ",
    "created_at": "2025-10-21T12:40:00-05:00",
    "amount": {
      "currency": "COP",
      "total": 125000,
      "taxes": [
        {
          "base": 100000,
          "type": "VAT",
          "value": 19000
        }
      ],
      "tip": 6000
    },
    "user_id": "nequi_user_9876543210",
    "metadata": {
      "reference": "APP-VENTA-45210"
    },
    "bold_code": "B000",
    "payer_email": "pagador.nequi@example.com",
    "payment_method": "NEQUI"
  },
  "datacontenttype": "application/json"
}
```

#### Botón Bancolombia

```json
{
  "id": "2e9a7f3b-5d1c-4b6a-8e9f-0c1b2d3e4f5a",
  "type": "SALE_APPROVED",
  "subject": "T54XEEOUXNO",
  "source": "/payments/vnp/bancolombia",
  "spec_version": "1.0",
  "time": 1761065900000000000,
  "data": {
    "payment_id": "T54XEEOUXNO",
    "merchant_id": "MRCH12345COL",
    "created_at": "2025-10-21T12:55:00-05:00",
    "amount": {
      "currency": "COP",
      "total": 357000,
      "taxes": [
        {
          "base": 300000,
          "type": "VAT",
          "value": 57000
        }
      ],
      "tip": 0
    },
    "user_id": "vnp_user_456789",
    "metadata": {
      "reference": "ECOM-COMPRA-3321"
    },
    "bold_code": "B000",
    "payer_email": "pagador.bancolombia@ecomercio.co",
    "payment_method": "BOTON_BANCOLOMBIA",
    "integration": "LINK"
  },
  "datacontenttype": "application/json"
}
```

#### PSE

```json
{
  "id": "7d9b5c2a-1f8e-4a3d-9b0c-2e1f4a5b6c7d",
  "type": "SALE_APPROVED",
  "subject": "TEWGMSUI9L7",
  "source": "/payments/pse/payments",
  "spec_version": "1.0",
  "time": 1761066500000000000,
  "data": {
    "payment_id": "TEWGMSUI9L7",
    "merchant_id": "MRCH543210PSE",
    "created_at": "2025-10-21T13:05:00-05:00",
    "amount": {
      "currency": "COP",
      "total": 99900,
      "taxes": [
        {
          "base": 84000,
          "type": "VAT",
          "value": 15960
        }
      ],
      "tip": 0
    },
    "user_id": "pse_transaction_id_789012",
    "metadata": {
      "reference": "ECOM-FACT-10556"
    },
    "bold_code": "B000",
    "payer_email": "usuario.pse@comprasweb.co",
    "payment_method": "PSE",
    "integration": "LINK"
  },
  "datacontenttype": "application/json"
}
```

#### QR Bold

```json
{
  "id": "7d9b5c2a-1f8e-4a3d-9b0c-2e1f4a5b6c7d",
  "type": "SALE_APPROVED",
  "subject": "TEWGMSUI9L7",
  "source": "/payments/pse/payments",
  "spec_version": "1.0",
  "time": 1761066500000000000,
  "data": {
    "payment_id": "TEWGMSUI9L7",
    "merchant_id": "MRCH543210PSE",
    "created_at": "2025-10-21T13:05:00-05:00",
    "amount": {
      "currency": "COP",
      "total": 99900,
      "taxes": [
        {
          "base": 84000,
          "type": "VAT",
          "value": 15960
        }
      ],
      "tip": 0
    },
    "user_id": "pse_transaction_id_789012",
    "metadata": {
      "reference": "ECOM-FACT-10556"
    },
    "bold_code": "B000",
    "payer_email": "usuario.pse@comprasweb.co",
    "payment_method": "PSE",
    "integration": "LINK"
  },
  "datacontenttype": "application/json"
}
```

## Descripción de estructura de la notificación

| Nombre del campo | Descripción                                                                                                                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id               | UUID de la notificación. Es única para cada notificación enviada.                                                                                                                                                                                                                            |
| type             | Tipo de la notificación. Describe el estado de transacción al momento de emitir la notificación. Sus posibles valores son:<br>- SALE_APPROVED → "Venta aprobada"<br>- SALE_REJECTED → "Venta rechazada"<br>- VOID_APPROVED → "Anulación aprobada"<br>- VOID_REJECTED → "Anulación rechazada" |
| subject          | ID de la transacción que está siendo notificada. Este ID es definido por Bold.                                                                                                                                                                                                               |
| source           | Recurso que lanzó la notificación en cuestión.                                                                                                                                                                                                                                               |
| spec_version     | Versión de la especificación CloudEvents usada.                                                                                                                                                                                                                                              |
| time             | Hora de emisión de la notificación en formato POSIX.                                                                                                                                                                                                                                         |
| data             | Cuerpo de la notificación. Incluye información de la transacción tal como: fecha de creación, monto, impuestos, método de pago, información del método de pago, referencia externa enviada a Bold al momento del pago, etc.                                                                  |
| datacontenttype  | Formato en el que se encuentra el body de la notificación.                                                                                                                                                                                                                                   |

## Descripción del cuerpo de la notificación

| Campo                | Tipo         | Descripción                                                                                                                                                                                                                                 |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| payment_id           | string       | ID de la transacción generado por Bold. Permite llevar trazabilidad de la misma.                                                                                                                                                            |
| merchant_id          | string       | ID del comercio que está haciendo la transacción.                                                                                                                                                                                           |
| created_at           | string       | Cadena de texto que contiene la fecha y hora de creación de la transacción en formato ISO 8601 con time zone América/Bogotá.                                                                                                                |
| amount               | object       | Contiene información detallada de los montos a procesar. Incluye el monto total, los impuestos asociados y la propina correspondiente.                                                                                                      |
| amount.currency      | string       | Moneda en la que se realizó la transacción, siguiendo el estándar ISO 4217.                                                                                                                                                                 |
| amount.total         | number       | Cantidad correspondiente al total a procesar en la transacción. Incluye propinas e impuestos asociados.                                                                                                                                     |
| amount.taxes         | List[Object] | Lista de objetos que contienen todos los impuestos asociados a la transacción en cuestión. Cada objeto incluye el tipo del impuesto, la base y el valor del mismo.                                                                          |
| amount.taxes[].base  | number       | Base del impuesto asociado a la transacción.                                                                                                                                                                                                |
| amount.taxes[].type  | string       | Tipo de impuesto asociado a la transacción. Los posibles valores son:<br>- VAT → Impuesto al valor agregado<br>- CONSUMPTION → Impuesto al consumo                                                                                          |
| amount.taxes[].value | number       | Valor del impuesto asociado a la transacción.                                                                                                                                                                                               |
| amount.tip           | number       | Cantidad correspondiente a la propina asignada a la transacción.                                                                                                                                                                            |
| user_id              | string       | ID del usuario del comercio que inició la transacción.                                                                                                                                                                                      |
| metadata             | object       | Objeto que contiene información adicional enviada por el comercio al momento de crear la transacción.                                                                                                                                       |
| metadata.reference   | string       | Referencia de pago. Esta depende del tipo de integración:<br>- API Integrations: valor definido en reference al crear el pago.                                                                                                              |
| bold_code            | string       | Código único generado por Bold para identificar la transacción en el datáfono.                                                                                                                                                              |
| payer_email          | string       | Correo electrónico del tarjetahabiente                                                                                                                                                                                                      |
| payment_method       | string       | Método de pago usado en la transacción. Los posibles valores son:<br>- CARD → tarjetas de crédito/débito<br>- SOFT_POS → tarjetas de crédito/débito usando el dispositivo móvil                                                             |
| card                 | object       | Información básica de la tarjeta con la que se realizó el pago.                                                                                                                                                                             |
| card.capture_mode    | string       | Método de captura usado para el pago. Los posibles valores son:<br>- CHIP<br>- CONTACTLESS_CHIP                                                                                                                                             |
| card.brand           | string       | Franquicia de la tarjeta usada en el pago. Los posibles valores son:<br>- VISA<br>- VISA_ELECTRON<br>- MASTERCARD<br>- MAESTRO<br>- AMERICAN_EXPRESS<br>- CODENSA<br>- DINERS<br>- DISCOVER<br>- TUYA<br>- SODEXO<br>- OLIMPICA<br>- UNKOWN |
| card.cardholder_name | string       | Nombre del tarjetahabiente.                                                                                                                                                                                                                 |
| card.terminal_id     | string       | ID del datáfono usado para la captura de la tarjeta.                                                                                                                                                                                        |
| card.masked_pan      | string       | PAN de la tarjeta con la que se realizó el pago enmascarado con el siguiente formato "123456xxxxxx7890"                                                                                                                                     |
| card.installments    | number       | Numero de cuotas escogido por el tarjetahabiente.                                                                                                                                                                                           |
| card.card_type       | string       | Tipo de la tarjeta que uso el tarjetahabiente, Los posibles valores son:<br>- DEBIT<br>- CREDIT                                                                                                                                             |
| approval_number      | string       | Numero de aprobación de la transacción ante la red.                                                                                                                                                                                         |
| integration          | string       | Tipo de integración usada en la transacción. Los posibles valores son:<br>- POS → datáfono Bold Plus<br>- SOFT_POS → datáfono móvil<br>- API_INTEGRATIONS → API Integrations                                                                |

## Registra el endpoint

Después de crear el endpoint, registra la URL en la sección de Integraciones en el Panel de Comercios para que Bold sepa a dónde enviar los eventos.

Puedes registrar hasta 5 endpoints.

### Formato de la URL del webhook

El formato de la URL para registrar tu webhook es el siguiente:

```
https://<tu-website>/<tu-webhook-url>
```

Para registrar tu webhook debes:

1. Ve a la sección Integraciones en el Panel de Comercios. Si ingresas por primera vez debes activar las llaves de integración con el botón Activar llaves.

2. Entre las llaves generadas encontratás la llave secreta. Esta sirve para verificar la autenticidad de la información enviada a la URL del webhook.

3. Luego de activar las llaves, ve a la sección Webhooks y haz clic en el botón Configurar webhook.

4. Agrega la URL del webhook en el campo URL de punto de conexión y haz clic en Crear webhook.

5. Ahora verás la URL que acabas de configurar en la sección de webhooks creados y podrás empezar a recibir automáticamente eventos de webhook cada vez que se realice una transacción.

Para dejar de recibir notificaciones en tu webhook configurado, simplemente elimínalo de tu lista de webhooks utilizando el botón de la papelera (Trash Icon) ubicado en el lado derecho de la URL.

> **warning**
> Las notificaciones de ventas realizadas mediante:
>
> - Datáfono Bold Plus
> - Link de pagos
> - Botón de pagos
> - Versiones antiguas de la app Bold
>
> pueden tener una demora de máximo 10 minutos para que sean notificadas a tu webhook. Estamos trabajando para que estos tiempos sean menores.

## Verifica el origen de los eventos recibidos

Te recomendamos asegurar tu integración de webhook con Bold. Para ello, es importante verificar que todas las peticiones realizadas a la URL del webhook sean generadas exclusivamente por Bold.

### Cómo verificar las firmas de webhook

Para asegurar que la información provenga de Bold y garantizar la integridad de los datos, puedes seguir estos pasos:

1. Convertir el cuerpo recibido a formato Base64.
2. Cifrar el cuerpo en Base64 utilizando la llave secreta con el algoritmo de encriptación HMAC-SHA256 para generar un HMAC (código de autenticación de mensajes) en formato hexadecimal.
3. Comparar el resultado obtenido con el valor del encabezado x-bold-signature incluido en la petición y verificar que sean idénticos.

#### Ejemplo del contenido enviado en el header x-bold-signature

```
'x-bold-signature': '381db35c39c6e3016884c70054ade14f4d78bcd8167e8d1170751fe3bce74662'
```

A continuación encuentras un snippet que puedes utilizar para hacer la verificación de la firma:

```javascript
const express = require("express");
const crypto = require("crypto");
const base64 = require("base-64");

const app = express();
const port = 4000;

app.use(express.raw({ type: "application/json" }));

app.post("/signature", (req, res) => {
  const { body } = req;
  const receivedSignature = req.headers["x-bold-signature"];

  const encoded = base64.encode(body);
  const secretKey = "";

  const hashed = crypto
    .createHmac("sha256", secretKey)
    .update(encoded)
    .digest("hex");

  const isValidRequest = crypto.timingSafeEqual(
    Buffer.from(hashed),
    Buffer.from(receivedSignature)
  );

  if (isValidRequest) {
    // 200 OK
    res.json({ message: "Valid signature" });
  } else {
    // 400 Bad Request invalid signature
    res.status(400).json({ message: "Invalid signature" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

> **warning**
> En modo pruebas la firma usa una clave vacia, es decir cuando se quiere verificar una transacción que se realizo con las llaves de pruebas, el atributo donde va tu LLAVE_SECRETA no se ingresa, debe ir como un String vacio.
>
> Ejemplo:
>
> ```php
> $secretKey = '';
> ```

## Webhook de pruebas

Se encuentra disponible un webhook de pruebas que puede ser configurado desde el panel de comercios en la sección de integraciones > webhooks > webhooks de prueba

Por el momento solo se permite 1 webhook de prueba por comercio, el cual puede recibir todos los tipos de eventos disponibles.

Para transacciones realizadas en el ambiente de pruebas de API Integrations, las notificaciones se enviarán al webhook registrado en el panel de comercios mencionado anteriormente. Sin embargo, para las integraciones de link de pago o botón de pagos, debes utilizar la opción de "Probar el webhook" al finalizar la compra, esto solo aplica para las pruebas de integraciones en línea. Consulta más detalles en la documentación del Ambiente de pruebas de link de pago y botón de pago y conoce cómo utilizar esta opción.

> **info**
> Para transacciones realizadas en modo de pruebas, las notificaciones al webhook no se envían.
>
> Sin embargo, para las integraciones en línea puedes utilizar la opción de "Probar el webhook" al finalizar la compra, solo aplica para las pruebas de integraciones en linea. Consulta mas detalles en la documentación del Ambiente de pruebas y conoce como utilizar esta opción.

## Servicio de fallback del webhook

### ¿Para qué se utiliza?

El servicio de fallback te permite consultar activamente la notificación de una transacción asociada al último estado válido por el que ha pasado. Estos estados pueden ser:

- SALE_APPROVED → "Venta aprobada"
- SALE_REJECTED → "Venta rechazada"
- VOID_APPROVED → "Anulación aprobada"
- VOID_REJECTED → "Anulación rechazada"

### ¿Cómo se utiliza?

#### Obtén tus llaves de integración

Como se explica en la sección de llaves de integración, es indispensable obtener tus llaves de integración para integrarte con las soluciones de Bold.

Una vez que tengas tus llaves, puedes proceder con el siguiente paso.

#### Realiza una solicitud a la URL

```
GET https://integrations.api.bold.co/payments/webhook/notifications/<payment_id>
```

Debes incluir el siguiente encabezado en la solicitud para que podamos identificar tu comercio con tus llaves:

| Llave         | Valor                          |
| ------------- | ------------------------------ |
| Authorization | x-api-key <llave_de_identidad> |

Asegúrate de reemplazar `<llave de identidad>` con la correspondiente a tu comercio.

Por ejemplo, si la llave de identidad es:

```
DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH
```

Entonces el encabezado sería:

| Llave         | Valor                                                 |
| ------------- | ----------------------------------------------------- |
| Authorization | x-api-key DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH |

#### Los parámetros disponibles son:

- **payment_id:** Este es el identificador de la transacción que deseas consultar, puede ser el ID de la transacción o la referencia externa enviada al momento del pago.

**Query params:**

- **is_external_reference:** Con este parámetro determinas si el parámetro payment_id corresponde al ID de la transacción o a la referencia externa enviada al momento del pago, por defecto su valor es False, Por lo tanto, si este campo no se envía, la búsqueda se realizará automáticamente por ID. Si en caso contrario deseas realizar la búsqueda por referencia externa, este parámetro debe ser enviado con valor true

Como respuesta, recibirás un cuerpo de la siguiente manera:

```json
{
  "notifications": [
    // Lista de notificaciones que cumplen con la condición enviada. Se envía una respuesta por cada pago que cumple con la condición, con un máximo de 10 transacciones coincidentes
  ]
}
```

Por ejemplo, si queremos obtener la notificación de ejemplo ubicada en la sección "Crea el endpoint" tendríamos que hacer una petición a la siguiente URL:

```
GET https://integrations.api.bold.co/payments/webhook/notifications/CP332C3C9WZU
```

o si quieres obtenerla por referencia externa, puedes usar la siguiente petición:

```
GET https://integrations.api.bold.co/payments/webhook/notifications/ORD-SHOP03-1719242727607215713?is_external_reference=true
```

cualquiera de las dos peticiones te deberá retornar el siguiente resultado:

```json
{
  "notifications": [
    {
      "id": "191850cb-00f8-4f64-aa5f-4975848e9428",
      "type": "SALE_REJECTED",
      "subject": "CP332C3C9WZU",
      "source": "/payments",
      "spec_version": "1.0",
      "time": 1711989345347444700,
      "data": {
        "payment_id": "CP332C3C9WZU",
        "merchant_id": "CKKA859CGE",
        "created_at": "2024-04-01T11:35:42-05:00",
        "amount": {
          "total": 111111,
          "taxes": [
            {
              "base": 96618,
              "type": "VAT",
              "value": 4831
            }
          ],
          "tip": 9662
        },
        "card": {
          "capture_mode": "CHIP",
          "franchise": "VISA",
          "cardholder_name": "DARIO SUAREZ RUBEN",
          "terminal_id": "qpos_mini_27000230021050800072"
        },
        "user_id": "b7221e5b-aa8a-4c13-8105-8771a0088d35",
        "payment_method": "CARD",
        "metadata": {
          "reference": "ORD-SHOP03-1719242727607215713"
        }
      },
      "datacontenttype": "application/json"
    }
  ]
}
```

## Política de reintentos del webhook

Cuando tu sistema recibe una notificación de Bold, es crucial responder para confirmar la recepción correcta. Para esto debes enviar un código HTTP 200 (OK). En caso de no hacerlo, Bold intentará reenviar la notificación hasta obtener una confirmación de recepción HTTP 200 (OK) con un máximo de 5 reintentos.

Los reintentos de notificación seguirán el siguiente procedimiento:

| # de reintento de notificación | Tiempo desde el intento inicial |
| ------------------------------ | ------------------------------- |
| Primer reintento               | 15 min                          |
| Segundo reintento              | 1 Hora                          |
| Tercer reintento               | 4 Horas                         |
| Cuarto reintento               | 8 Horas                         |
| Quinto reintento               | 24 Horas                        |
