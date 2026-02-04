import transactionTestImg from '@/assets/img/api-integrations/transaccion-prueba.webp';
import reciboPrueba from '@/assets/img/api-integrations/recibo-prueba.webp';
import IntegrationLayout from './layout'

<br />

<IntegrationLayout>

    ### What is the API Integrations sandbox?
    This API Integrations feature allows you to simulate, test, and verify the functionality of your integration, creating transactions and receiving webhook notifications without having to use real money.

    ### How does it work?
    Similar to the [API Integrations](/api-integrations/integration) functionality, the integration is performed using an identity key, which allows authentication against the Bold system and, in turn, identify the intent to use the sandbox environment.

    ### How do I integrate it?
    To use API Integrations, consider the following:
    - Have a Bold account enabled
    - Have at least one SmartPro dataphone linked to your Bold account.
    - The dataphone must be turned on and with the application open or in background mode.


    The following will guide you to integrate API Integrations into your system:


    ### 1. Security

    The API works under a security scheme using an **identity key** (API key), which must be sent in the headers of each request.
    #### How do I access my integration keys?

    To integrate any of Bold's payment solutions into your website, you will need to first obtain integration keys. Using these keys, Bold identifies your business and ensures the integrity of your transactions.

    **Identity key:** Bold identifies your business through this unique key (also known as API key). To perform a transaction in the sandbox environment, you must select the identity key found in the **Test Keys** section.

    ### 2. Authentication

    To authenticate your requests, include the following header (header) in each request:

    | Key | Value |
    | :------------ | :--------- |
    | Authorization | ```x-api-key <identity_key>``` |

    Make sure to replace **`<identity_key>`** with the corresponding key to your business.

    For example, if the identity key is:

    **DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH**

    It would look like this:

    | Key | Value |
    | :------------ | :--------- |
    | Authorization | x-api-key DZSkDqh2iWmpYQg204C2fLigQerhPGXAcm5WyujxwYH |

    ---

    ### 3. Base URL

    All requests to the services must be made using the following base URL:

    `https://integrations.api.bold.co`

    Keep in mind that, regardless of the environment you are using, whether it is the sandbox or production environment, the responses will follow the same structure.


    ### 4. Payment methods query

    This service allows merchants to consult the payment methods enabled. The payment methods enabled for the sandbox environment are the same as those that are active in the production environment.
    The request is made through a GET request to the endpoint `/payments/payment-methods`.
    The following is the response structure.

    **Endpoint**

    ```http
    GET /payments/payment-methods
    ```
    **Parameters**
    No additional parameters are required in the GET request.

    **Request**

    ```http
    GET /payments/payment-methods
    --header 'Authorization: x-api-key <llave_de_identidad>'
    ```

    **Response**
    The response contains a payload object that includes information about the payment methods available for the integration.

    ```json
    {
        "payload": {
            "payment_methods": [
                {
                    "name": "DAVIPLATA",
                    "enabled": true
                },
                {
                    "name": "NEQUI",
                    "enabled": true
                },
                {
                    "name": "PAY_BY_LINK",
                    "enabled": true
                },
                {
                    "name": "POS",
                    "enabled": true
                }
            ]
        },
        "errors": []
    }
    ```

    The possible methods are: `POS` for card payment, `NEQUI` for payments with Nequi through Push or QR, `DAVIPLATA` for payments through the Daviplata app, and `PAY_BY_LINK` to create a payment link and allow your customer to make the payment on the web.

    ### 5. Payment terminals query

    This service allows merchants to consult the payment terminals (dataphones) enabled, currently only Smart Pro terminals are supported.
    The request is made through a GET request to the endpoint `/payments/binded-terminals`. The available terminals for the sandbox environment are the same as those available in the production environment.

    **Endpoint**

    ```http
    GET /payments/binded-terminals
    ```
    **Parameters**
    No additional parameters are required in the GET request.

    **Request**

    ```http
    GET /payments/binded-terminals
    --header 'Authorization: x-api-key <llave_de_identidad>'
    ```

    **Response**
    The response contains a payload object that includes information about the payment terminals available for the integration.

    ```json
    {
        "payload": {
            "available_terminals": [
                {
                    "terminal_model": "N86",
                    "terminal_serial": "N860W000000",
                    "status": "BINDED",
                    "name": "SPRO0000"
                }
            ]
        },
        "errors": []
    }
    ```

    ### 6. Payment creation through API

    To facilitate the creation of payments through our API, we have designed an intuitive interface that allows developers to send POST requests to the `/payments/app-checkout` endpoint. Below, the required and optional parameters that can be included in the request are detailed. Remember to include your test identity key to start the flow within this environment.

    **Endpoint**

    ```http
    POST /payments/app-checkout
    ```

    **Parameters**

    **Required**

    | Field | Type | Description |
    | :------------ | :--------- | :---------- |
    | amount | object | Contains detailed information about the amounts to be processed. Includes the total amount, associated taxes, and the tip amount. |
    | amount.currency | string | The currency in which the transaction is being made. Example: `COP` |
    | amount.total | number | The total amount to be processed in the transaction. Includes tips and associated taxes. |
    | amount.taxes | List[Object] | List of objects containing all the taxes associated with the transaction in question. Each object includes the type of tax, the base, and the value of the same. |
    | amount.tip | number | The tip amount assigned to the transaction. |
    | user_email | string | The email of the person making the sale. Example: `vendedor@comercio.com`. |
    | payment_method | string | This field is used to specify the payment method by which the sale will be made. You must choose one of the obtained in the `Payment methods query` section. Possible values are: <br/> <br/> **POS** → credit/debit cards.<br />  **NEQUI** → payment by Nequi.<br /> **DAVIPLATA** → payment by Daviplata.<br /> **PAY_BY_LINK** → payment by payment link. |
    | terminal_model | string | In this field you must send the model of the terminal to be used to process the payment. You must choose the model of the obtained in the `Payment terminals query` section. Example: `N86`. |
    | terminal_serial | string | In this field you must send the serial of the terminal to be used to process the payment. You must choose the serial of the obtained in the `Payment terminals query` section. Example: `N860W000000`. |
    | reference | string | Reference to identify the payment in the Webhook response. Example: `d9b10690-981d-494d-bcb0-66a1dacab51d`. |

    **Optional**

    | Field | Type | Description |
    | :------------ | :--------- | :---------- |
    | description | string | A brief description of the transaction. Example: `Purchase of electronic products`. |
    | payer | object | An object that specifies the details of the payer in case it is necessary. Each element within this object is also optional, as is the complete object, so if you do not want to send any information about the payer, you can simply send an empty object in the parameter. Ej: “payer”: {} . |
    | payer.email | string | Payer's email. Example: `pagador@hotmail.com`. |
    | payer.phone_number | string | Payer's phone number. Example `3100000000`. |
    | payer.document | object | An object that contains information about the payer's identity document. |
    | payer.document.document_type | string | Type of identity document. Must be one of the following: `[CEDULA, NIT, CEDULA_EXTRANJERIA, PEP, PASAPORTE, NUIP, REGISTRO_CIVIL, DOCUMENTO_EXTRANJERIA, TARJETA_IDENTIDAD, PPT]`. Example: `CEDULA`. |
    | payer.document.document_number | string | Payer's identity document number. Must have a minimum length of 4 and a maximum length of 15 characters. Example: `1010140000`. |

    **Request**

    ```json
    {
        "amount": {
            "currency": "COP",
            "taxes": [
                {
                    "type": "VAT",
                    "base": 10000,
                    "value": 1000
                }
            ],
            "tip_amount": 0,
            "total_amount": 1230000
        },
        "payment_method": "POS",
        "terminal_model": "N86",
        "terminal_serial": "N860W000000",
        "reference": "d9b10690-981d-494d-bcb0-66a1dacab51d",
        "user_email": "vendedor@comercio.com",
        "description": "Purchase of electronic products",
        "payer": {
            "email": "pagador@hotmail.com",
            "phone_number": "3100000000",
            "document": {
                "document_type": "CEDULA",
                "document_number": "1010140000"
            }
        }
    }
    ```

    The sandbox environment allows you to simulate the response you want to obtain to the transaction according to its value, that is, what you send in the `total_amount` field. Below, the ranges and/or values are shown together with the response you will obtain at the moment of finalizing the transaction flow within the sandbox environment:


    | `total_amount` | Response |
    | :------------ | :---------- |
    | Between $1.000 and $2.000.000 | Approval range. The transactions you create will end with an approved final status. |
    | $111.111 | Rejected. The reason for rejection is: Insufficient funds. |
    | $222.222 | Rejected. The reason for rejection is: Invalid pin. |
    | $333.333 | Rejected. The reason for rejection is: Expired card. |
    | $444.444 | Rejected. The reason for rejection is: Network failure. |
    | $999.999 | Rejected. The reason for rejection is: General rejection. |


    **Response**

    If the request was successful, you will receive a HTTP 201 code along with the following response. The `integration_id` field in the response is a unique identifier of the integration that was created, which serves to obtain support in case it is necessary.

    ```json
    {
        "payload": {
            "integration_id": "e1eeb06d-e2c4-461e-8346-f0982b4be1fc"
        },
        "errors": []
    }
    ```

    ### How to identify the environment of a transaction?

    In order to facilitate and inform you about the environment you are using at the time of making a transaction, a mark was added within the flow in the dataphone, which will indicate if the transaction you are making is a test. This mark will be shown during the entire payment flow, from the start until you obtain the receipt with the transaction status.

    <div style={{textAlign: 'center'}}>
        <img style={{maxWidth: '420px', display: 'inline'}} src={transactionTestImg.src} alt="Test Transaction" />
    </div>

    The receipt will look like this:

    <div style={{textAlign: 'center'}}>
        <img style={{maxWidth: '420px', display: 'inline'}} src={reciboPrueba.src} alt="Test Receipt" />
    </div>

    ### Transaction tracking

    With the [**Webhook**](/webhook) of Bold, you can receive updates about the status of the payment initiated through the API and access the value of the reference associated. Keep in mind that you must have configured the Webhook cataloged as `Sandbox`, since notifications from the test environment will only be sent to this.

    ### Possible errors

    Below, the error codes defined are detailed, along with an explanation, which will help you identify and correct possible failures present during the integration.

    | Code | Description | Status HTTP |
    | :------------ | :--------- | :---------- |
    | AP001 | The failure is not mapped to a particular error. | 500 |
    | AP002 | The `taxes` field of the `amount` object does not represent any of the possible configurations. | 400 |
    | AP003 | The payment method sent is not active. | 400 |
    | AP004 | The selected dataphone is not linked. | 400 |
    | AP005 | The body of the `body` sent does not contain all the required fields, validate in the response which field you are missing. | 400 |
    | AP006 | One of the fields of the `body` does not have the expected type according to what is defined in this documentation. | 400 |

</IntegrationLayout>
