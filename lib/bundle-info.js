'use strict';

var keychain = require('keychain');
var prompt = require('prompt');
var Promise = require('promise');
var fs = require('fs');

module.exports.getInfo = function(_name) {
    var self = this;

    return new Promise((resolve, reject) => {
        prompt.start();

        syncBundleFile()
            .then(getDecoratedInfo)
            .then(function(bundleInfo) {
                bundleInfo.name = _name;
                resolve(bundleInfo);
            })
            .catch(function(err) {
                console.log(err);
            })
            .done();

        function syncBundleFile() {
            return new Promise((resolve, reject) => {
                var doesBundleFileExist = fs.existsSync(_name + '.bundle.json');

                if (doesBundleFileExist) {
                    resolve();
                    return;
                }

                createBundleFile().then((bundleInfo) => {
                    keychain.setPassword({
                        account: bundleInfo.username,
                        service: bundleInfo.target,
                        password: bundleInfo.password
                    }, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve();
                    });
                })
                .catch(function(err) {
                    reject(err);
                });
            });
        }

        function createBundleFile() {
            return new Promise((resolve, reject) => {
                var schema = {
                    properties: {
                        env: {
                            pattern: /^Production|Developer|Sandbox$/,
                            message: 'Environment',
                            default: 'Production'
                        },
                        username: {
                            message: 'Salesforce Username',
                            required: true
                        },
                        password: {
                            message: 'Salesforce Password',
                            required: true,
                            hidden: true,
                            replace: '*'
                        }
                    }
                };

                prompt.get(schema, (err, info) => {
                    info.target = _name;

                    var bundleInfo = JSON.parse(JSON.stringify(info));
                    delete bundleInfo.password;

                    fs.writeFileSync(_name + '.bundle.json', JSON.stringify(bundleInfo));
                    resolve(info);
                });
            });
        }

        function getDecoratedInfo() {
            return new Promise((resolve, reject) => {
                var bundleInfoJSON = fs.readFileSync(_name + '.bundle.json', 'utf-8');
                var bundleInfo = JSON.parse(bundleInfoJSON);

                keychain.getPassword({ account: bundleInfo.username, service: bundleInfo.target }, (err, password) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    bundleInfo.password = password;
                    resolve(bundleInfo);
                });
            });
        }
    });
};