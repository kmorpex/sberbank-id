'use strict'

const axios = require('axios')
const querystring = require('querystring');

const defaultConfig = {
    grantType: 'authorization_code',
    productionUrl: 'https://open.api.sberbank.ru/ru/prod',
    devUrl: 'https://dev.api.sberbank.ru/ru/prod',
    authPath: '/tokens/v2/oidc',
    userInfoPath: '/sberbankid/v2.1/userinfo',
    production: true,
    redirectUrl: null,
    clientId: null,
    clientSecret: null,
    scope: 'openid+name',
    timeout: 2000
};

const requiredFields = [
    'redirectUrl',
    'clientId',
    'clientSecret'
];

/**
 * @function
 * @param {Object} config Конфиг подключения к Сбербанк ID.
 * @prop {String} productionUrl урл шлюза PRODUCTION.
 * (по умолчанию 'https://open.api.sberbank.ru/ru/prod')
 *
 * @prop {String} devUrl урл шлюза DEVELOPMENT.
 * (по умолчанию 'https://dev.api.sberbank.ru/ru/prod')
 *
 * @prop {String} authPath Путь страницы авторизации.
 * (по умолчанию '/tokens/v2/oidc')
 *
 * @prop {String} userInfoPath Путь страницы получения информации о пользователе.
 * доступа. (по умолчанию '/sberbankid/v2.1/userinfo')
 *
 * @prop {Boolean} production Тип среды.
 * (по умолчанию true)
 *
 * @prop {Boolean} redirectUrl Ссылка, по которой должен
 * быть направлен пользователь после того, как даст
 * разрешение на доступ к ресурсу.
 * (по умолчанию null)
 *
 * @prop {String} clientId Идентификатор приложения партнера.
 * (по умолчанию null)
 *
 * @prop {String} clientSecret Секретный ключ партнера.
 * (по умолчанию null)
 *
 * @prop {String} scope Области доступов.
 * (по умолчанию 'openid+name')
 *
 * @prop {Number} timeout Время ожидания ответа от сервера Сбербанка.
 * (по умолчанию 2000)
 *
 * @return {Class} Класс для работы со Сбербанк ID.
 */
module.exports = (config) => {
    if (typeof config !== 'object' || config === null) {
        throw new Error('Config is required.');
    }

    const _conf = Object.assign(
        {},
        defaultConfig,
        config
    );

    for (let field of requiredFields) {
        let value = _conf[field];
        if (value === null || value === undefined) {
            throw new Error(`Field '${field}' is required to config.`);
        }
    }

    const {
        grantType,
        clientId,
        clientSecret,
        redirectUrl,
        authPath,
        userInfoPath,
        scope,
        production,
        timeout
    } = _conf;

    const baseUrl = production ? _conf.productionUrl : _conf.devUrl

    /**
     * Класс для работы со Сбербанк ID.
     *
     * @class SberbankID
     *
     * @constructor
     * @param {String} code Код авторизации, полученный после авторизации на стороне Сбербанка
     */
    class SberbankID {
        constructor(code) {
            if (!code) {
                throw new Error(`Field 'code' is required to constructor`)
            }

            this.code = code
            this.instance = axios.create({
                baseURL: baseUrl,
                timeout: timeout,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-IBM-Client-ID': clientId
                }
            });
        }

        /**
         * Метод получает и записывает токен авторищации для последующего запроса.
         * @method setAccessToken
         * @return {void}
         */
        async setAccessToken() {
            const query = querystring.stringify({
                grant_type: grantType,
                scope: scope,
                client_id: clientId,
                client_secret: clientSecret,
                code: this.code,
                redirect_uri: redirectUrl
            })

            try {
                this.instance.defaults.headers['RqUID'] = this.generateRequestID()
                const { data } = await this.instance.post(authPath, query)
                const { access_token } = data
                this.instance.defaults.headers['Authorization'] = `Bearer ${access_token}`;
            } catch (e) {
                new Error(e)
            }
        }

        /**
         * Метод получения информации о пользователе
         * @method getUserInfo
         * @return {Object} User data
         */
        async getUser() {
            try {
                await this.setAccessToken()
                this.instance.defaults.headers['x-Introspect-RqUID'] = this.generateRequestID()
                const { data } = await this.instance.get(userInfoPath)
                return data
            } catch (err) {
                if (err.response) {
                    const { moreInformation } = err.response.data
                    throw new Error(`Can not get access from Sberbank. ${moreInformation}`)
                }
                throw new Error('Error while getting marker or handling response. ' + err.message)
            }
        }

        /**
         * Метод генерирует уникальный идентификатор сообщения, «maxLength=32 и pattern=([0-9]|[a-f]|[A-F]){32})».
         * @method generateRequestID
         * @return {String} RequestID
         */
        generateRequestID() {
            let RequestID = ''
            const charset = "abcdefABCDEF0123456789"
            for(let i=0; i < 32; i++) {
                RequestID += charset.charAt(Math.floor(Math.random() * charset.length))
            }

            return RequestID
        }
    }

    return SberbankID
}