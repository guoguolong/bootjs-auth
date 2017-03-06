/**
 * PCUserAuth.js
 *
 * @author guojunlong@kaulware.com
 * @copyright Copyright &copy; 2017 Kaulware.com
 */
'use strict';

const crypto = require('crypto');
const co = require('co');

const PRIVATE_KEY = '75853663e45322a5152c70c9675d65a5';
const SESSION_KEY = 'mouser';

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}

function PCUserAuth(config) {
    return {
        create: function(req, res, next) {
            function getLoginInfo() {
                if (!req.cookies[SESSION_KEY]) return false;

                let decodedUserInfo = (new Buffer(req.cookies[SESSION_KEY], 'base64')).toString();
                let [userId, username, nickname, zoneId, loginTime, cryptedKey] = decodedUserInfo.split(',');
                userId = parseInt(userId);
                let joinedKey = [userId, username, nickname, zoneId, loginTime, PRIVATE_KEY].join(',');
                if (md5(joinedKey) != cryptedKey || userId < 1) {
                    return false;
                }
                return {
                    userId, username, nickname, zoneId, loginTime
                };
            };

            function hasLogin() {
                let userInfo = getLoginInfo();
                if (userInfo) {
                    return true;
                }
                return false;
            };

            function getLoginUser() {
                return getLoginInfo();
            };
            
            let authObj = {
                hasLoginP: function() {
                    return co(function* () {
                        return hasLogin();
                    });
                },
                getLoginUserP: function() {
                    return co(function* () {
                        return getLoginUser();
                    });
                },
                logout: function() {
                    res.clearCookie(SESSION_KEY);
                },
                getLoginUrl: function(referUrl) {
                    let url = 'http://wwww.mo.com/u/login';
                    if (referUrl) {
                        url += '?origin=' + new Buffer(referUrl).toString('base64');
                    }
                    return url;
                },
                getLogoutUrl:function () {
                    return 'http://www.mo.com/u/logout';
                }
            };
            req.auth = authObj;
            return authObj;
        }
    }
}
module.exports = PCUserAuth;