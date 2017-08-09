#!/usr/bin/env node

'use strict';

var bundler = require('./lib/bundler'),
    bundleInfo = require('./lib/bundle-info'),
    deploy = require('./lib/deploy'),
    fs = require('fs-extra'),
    args = require('command-line-args');

this.deployDir = 'deploy';
this.resourceDir = this.deployDir + '/staticresources';

const optionDefinitions = [
    { name: 'dirName', alias: 'd', type: String },
    { name: 'verbose', alias: 'v', type: Boolean, defaultValue: false }
];

const options = args(optionDefinitions);

if (!options.dirName) {
    console.error('Please specify a directory to bundle.');
    return;
}

if (!fs.existsSync(options.dirName)) {
    console.error('Specified directory does not exist. (' + options.dirName + ')');
    return;
}

if (fs.existsSync(this.deployDir)) fs.removeSync(this.deployDir);

fs.mkdirSync(this.deployDir);
fs.mkdirSync(this.resourceDir);

const bundleTarget = this.resourceDir + '/' + options.dirName + '.resource';

var bundleOptions = {
    source: options.dirName,
    target: bundleTarget,
    verbose: options.verbose
};

var self = this;

bundler.bundle(bundleOptions)
    .then(bundleInfo.getInfo.bind(null, options.dirName))
    .then(deploy.run.bind(this))
    .catch(function(err) {
        console.log('ERROR: ' + err);
        // fs.removeSync(options.dirName + '.bundle.json');
    }).done(function(result) {
        fs.copySync(bundleTarget, options.dirName + '.resource');
        fs.copySync(bundleTarget + '-meta.xml', options.dirName + '.resource-meta.xml');
        fs.removeSync(self.deployDir);
    });