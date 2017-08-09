'use strict';

var builder = require('xmlbuilder'),
    jsforce = require('jsforce'),
    fs = require('fs-extra'),
    archiver = require('archiver');

module.exports.run = function deploy(info) {
    const POLL_INTERVAL = 5000;
    const POLL_TIMEOUT = 180000;

    var self = this;

    return new Promise((resolve, reject) => {
        var options;

        if (info.env !== 'Production') {
            options = {};
            options.loginUrl = 'https://test.salesforce.com';
        }

        var metaXML = builder.create('StaticResource', { encoding: 'utf-8' })
            .att('xmlns', 'http://soap.sforce.com/2006/04/metadata')
            .ele('cacheControl', 'Public').up()
            .ele('contentType', 'application/zip').up()
            .ele('description', info.name + ' resource bundle').up()
            .end({ pretty: true });

        fs.writeFileSync(self.resourceDir + '/' + info.name + '.resource-meta.xml', metaXML);

        var packageXML = builder.create('Package', { encoding: 'utf-8' })
            .att('xmlns', 'http://soap.sforce.com/2006/04/metadata')
            .ele('types')
            .ele('members', info.name).up()
            .ele('name', 'StaticResource').up().up()
            .ele('version', '39.0').up()
            .end({ pretty: true });

        fs.writeFileSync(self.deployDir + '/package.xml', packageXML);

        var conn = new jsforce.Connection(options);

        console.log('Logging In ...');

        conn.login(info.username, info.password, function(err, userInfo) {
            if (err) {
                console.log('Error during login: ' + err);
                reject();
                return;
            }

            console.log('Logged In!');

            var archive = archiver('zip');
            archive.directory(self.deployDir);
            archive.finalize();

            console.log('Deploying ...');

            conn.metadata
                .deploy(archive)
                .on('progress', (result) => {
                    console.log('Deployment Status: ' + result.state);
                })
                .on('complete', (results) => {
                    console.log(results);
                    resolve();
                    console.log('Deployment finished. Success => ' + result.success);
                    console.log('Number of components deployed: ' + result.numberComponentsDeployed);
                    callback(null, 'Deploy complete.\nComponents deployed: ' + result.numberComponentsDeployed);
                })
                .on('error', err => callback(err))
                .poll(POLL_INTERVAL, POLL_TIMEOUT);
        });
    });
}