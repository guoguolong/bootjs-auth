/**
 * MobileUserAuth.js
 *
 * @author guojunlong@kaulware.com
 * @copyright Copyright &copy; 2017 Kaulware.com
 */
'use strict';

const IORedis = require('ioredis');
const common = require('bootjs-common');
const SESSION_KEY1 = 'muser';
const SESSION_KEY2 = 'KWmuser';
const co = require('co');

function MobileUserAuth(config) {
    let ioredis = null;
    if (!config.redis) {
        throw new Error('Redis configuration for bootjs-auth is empty.');
    }
    if (!ioredis) {
        ioredis = new IORedis(config.redis, {
            enableReadyCheck: false,
            retryStrategy: function(times) {
                return Math.min(50, 2000);
            }
        });
    }

    return {
        create: function(req, res, next) {
            function getLoginInfoP() {
                return co(function*() {
                    let skey = req.cookies[SESSION_KEY1] || req.cookies[SESSION_KEY2];
                    if (!skey || !/^[\d\w]{32}$/.test(skey)) {
                        return false;
                    }
                    let clientType = req.cookies.deviceType && config.clientType || 'mobile';
                    let sessionKeyPre = clientType === 'app' && 'MOB_SESSIONID_' || 'MOB_SESSIONID_M_';
                    let userInfo = null;
                    if (config.connected) {
                        let redisKey = sessionKeyPre + skey;
                        userInfo = yield ioredis.get(redisKey);
                        userInfo = common.utils.jsonParse(userInfo);
                    } else { // 对于非线上环境，只能这么干了:(
                        userInfo = {
                            id: req.cookies['kwuser_id']
                        }
                    }
                    let userId = userInfo && userInfo['id'];
                    if (userId <= 0) {
                        return false;
                    }
                    userInfo['userId'] = userId;
                    return userInfo;
                }).catch(err => {
                    return false;
                });
            };
            let authObj = {
                hasLoginP: function() {
                    return co(function*() {
                        let userInfo = yield getLoginInfoP();
                        if (userInfo) {
                            return true;
                        }
                        return false;
                    }).catch(err => {
                        return false;
                    });
                },
                getLoginUserP: function() {
                    return getLoginInfoP();
                },
                logout: function() {
                    res.clearCookie(SESSION_KEY1);
                    res.clearCookie(SESSION_KEY2);
                },
                getLoginUrl: function(referUrl) {
                    let url = 'https://m.kw.com/u/login';
                    if (referUrl) {
                        url += '?urlRefer=' + new Buffer(referUrl).toString('base64');
                    }
                    return url;
                },
                getLogoutUrl: function() {
                    return 'https://m.kw.com/user/doLogout';
                }
            };
            req.auth = authObj;
            return authObj;
        }
    };
}
module.exports = MobileUserAuth;
