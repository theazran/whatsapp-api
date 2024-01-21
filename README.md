# whatsapp-api
whatsapp unofficial api

## instalation
```
git clone https://github.com/theazran/whatsapp-api.git/
cd whatsapp-api
npm install
npm start
```
## how to use
```
open browser localhost:9000
input your number whatsapp and scan qrcode
```
## featured
> [!NOTE]
> only send text message.
## sample
```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'http://localhost:9000/send',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>'{
    "number": "6285xxxxxxx",
    "to": "6285xxxxxx",
    "type": "chat",
    "message": "Hello, this is a test message!"
}
',
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;

```
# buy me a coffe
 [Saweria](https://saweria.co/theazran)
