module.exports = function(app) {
    var router = app.get('express').Router();
    var request = require('request');
    var crypto = require('crypto');
    var config = app.get('config');
    var fs = require("fs");
    var gm = false;
    if (app.get('config').graphicsmagick) {
        gm = require('gm');
    }
    router.get('/facebook', function(req, res) {
        if (app.get('settings') && app.get('settings').site_mode && (app.get('settings').site_mode == 'private' || app.get('settings').site_mode == 'invites')) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
        var config_auth = app.get('config_auth');
        var code = req.query.code;
        if (!code) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
        var url = 'https://graph.facebook.com/oauth/access_token?client_id=' + config_auth.facebook.clientID + '&client_secret=' + config_auth.facebook.clientSecret + '&redirect_uri=' + config_auth.facebook.callbackURL + '&code=' + code;
        request.get(url, function(error, response, body) {
            if (error || !body) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            var res_arr1 = body.split(/&/);
            var data = {};
            for (var i = 0; i < res_arr1.length; i++) {
                var res_arr2 = res_arr1[i].split(/=/);
                if (res_arr2.length == 2) data[res_arr2[0]] = res_arr2[1];
            }
            if (!data.access_token) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
            var data_url = 'https://graph.facebook.com/me?access_token=' + data.access_token;
            request.get(data_url, function(error, response, body) {
                if (error || response.statusCode != 200) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
                var user_data = JSON.parse(body);
                app.get('mongodb').collection('users').find({
                    email: user_data.email
                }, {
                    limit: 1
                }).toArray(function(err, items) {
                    if (err) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
                    if (typeof items == 'undefined' || !items || !items.length) {
                        var _now = Date.now();
                        var user = {
                            username: 'fb_' + _now,
                            realname: user_data.name,
                            email: user_data.email,
                            password: crypto.createHash('md5').update(config.salt + '.' + Math.random()).digest('hex'),
                            username_auth: 'fb_' + _now,
                            need_finish: '1',
                            status: 1
                        };
                        app.get('mongodb').collection('users').insert(user, function(err, items) {
                            if (err) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
                            var user_id = items[0]._id.toHexString();
                            if (!user_id) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
                            app.get('mongodb').collection('users').find({
                                _id: items[0]._id
                            }, {
                                limit: 1
                            }).toArray(function(err, items) {
                                if (err || typeof items == 'undefined' || !items || !items.length) return res.redirect(303, "/auth?rnd=" + Math.random().toString().replace('.', ''));
                                req.session.auth = items[0];
                                req.session.auth.timestamp = Date.now();
                                delete req.session.auth.password;
                                if (!gm) {
                                    if (req.session.auth_redirect) {
                                        var host = req.session.auth_redirect_host || '';
                                        return res.redirect(303, host + req.session.auth_redirect + "?rnd=" + Math.random().toString().replace('.', ''));
                                    }
                                    return res.redirect(303, "/auth/profile?rnd=" + Math.random().toString().replace('.', ''));
                                }
                                var afn = crypto.createHash('md5').update(config.salt + '.' + req.session.auth._id).digest('hex');
                                var file = fs.createWriteStream(app.get('config').dir.avatars + '/' + afn + '.jpg');
                                request.get('http://graph.facebook.com/' + user_data.id + '/picture?type=large').pipe(file).on('close', function() {
                                    if (!fs.existsSync(app.get('config').dir.avatars + '/' + afn + '.jpg')) {
                                        if (req.session.auth_redirect) {
                                            var host = req.session.auth_redirect_host || '';
                                            return res.redirect(303, host + req.session.auth_redirect + "?rnd=" + Math.random().toString().replace('.', ''));
                                        }
                                        return res.redirect(303, "/auth/profile?rnd=" + Math.random().toString().replace('.', ''));
                                    }
                                    var img = gm(app.get('config').dir.avatars + '/' + afn + '.jpg');
                                    img.size(function(err, size) {
                                        if (!err) {
                                            if (size.width >= size.height) {
                                                img.resize(null, 128);
                                                img.crop(128, 128, 0, 0);
                                            } else {
                                                img.resize(128, null);
                                                img.crop(128, 128, 0, 0);
                                            }
                                            img.setFormat('jpeg');
                                            img.write(app.get('config').dir.avatars + '/' + afn + '.jpg', function(err) {
                                                if (req.session.auth_redirect) {
                                                    var host = req.session.auth_redirect_host || '';
                                                    return res.redirect(303, host + req.session.auth_redirect + "?rnd=" + Math.random().toString().replace('.', ''));
                                                }
                                                return res.redirect(303, "/auth/profile?rnd=" + Math.random().toString().replace('.', ''));
                                            });
                                        } else {
                                            if (req.session.auth_redirect) {
                                                var host = req.session.auth_redirect_host || '';
                                                return res.redirect(303, host + req.session.auth_redirect + "?rnd=" + Math.random().toString().replace('.', ''));
                                            }
                                            return res.redirect(303, "/auth/profile?rnd=" + Math.random().toString().replace('.', ''));
                                        }
                                    });
                                });
                            });
                        });
                    } else {
                        req.session.auth = items[0];
                        req.session.auth.timestamp = Date.now();
                        delete req.session.auth.password;
                        if (req.session.auth_redirect) {
                            var host = req.session.auth_redirect_host || '';
                            return res.redirect(303, host + req.session.auth_redirect + "?rnd=" + Math.random().toString().replace('.', ''));
                        }
                        return res.redirect(303, "/auth/profile?rnd=" + Math.random().toString().replace('.', ''));
                    }
                });
            });
        });
    });
    return router;
};
