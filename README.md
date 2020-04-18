# Sberbank ID
Модуль идентификации и авторизации пользователей через Сбербанк ID для NodeJS

Перед использованием ознакомтесь с [документацией](https://developer.sberbank.ru/doc/v1/sberbank-id/info).

## использование

1. Установите
```js
npm i -S sberbank-id
```

2. Создайте экземпляр подключения к Сбербанк ID

```js
const SberbankID = require('sberbank-id');
  
const instance = SberbankID({
   clientId: '8cec2741-a248-****-92e5-117cbfbdb11d',
   clientSecret: 'secret',
   scope: 'openid+name+mobile+email',
   redirectUrl: 'https://test.com/sberbank/callback'
})
    
const sberbank = new instance('DCF6F66E-EB61-9969-86AA-64D1B1051C9B')
```

3. Получите данные пользователя

```js
const user = await sberbank.getUser()
```

Метод getUser возвращает Promise, в который приходит объект результата. Этот объект содержит объект данных пользователя.

Подробнее о получении информации о пользователе читайте в официальной документации Сбербанк ID.



