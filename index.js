/**
 * index.js
 *
 * @author guojunlong@kaulware.com
 * @copyright Copyright &copy; 2017 Kaulware.com
 */
'use strict';

module.exports = function(config) {
    let authClasses = {
        pc: './lib/PCUserAuth',
        app: './lib/MobileUserAuth',
        mobile: './lib/MobileUserAuth'
    };
    config.clientType = config.clientType || 'pc';
    let AuthClass = null;
    if (typeof config.clientType === 'function') {
        AuthClass = config.clientType;
        return AuthClass(config);
    } else {
        if (authClasses[config.clientType]) {
            AuthClass = require(authClasses[config.clientType]);
            return AuthClass(config);
        }
    }
    throw new Error('Unknown client type: ' + config.clientType + '.');
}