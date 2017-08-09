'use strict';

var fs = require('fs');
var lineByLine = require('n-readlines');
var archiver = require('archiver');
var Promise = require('promise');
var minimatch = require('minimatch');

module.exports.bundle = function(options) {
    return new Promise((resolve, reject) => {
        if (!options) {
            reject('Missing bundle options.');
            return;
        }

        // TODO -- more value and type checking on options object
        try {
            var output = fs.createWriteStream(options.target);
            var archive = archiver('zip', {
                zlib: { level: 9 } // Compression level
            });

            output.on('close', () => {
                console.log('Resource bundle created.');
                console.log(archive.pointer() + ' total bytes');
                resolve();
            });

            archive.on('entry', function (data) {
                if (options.verbose) {
                    console.log('adding file ' + data.name);
                }
            });

            var globs = [];
            if (fs.existsSync(options.source + '/.maignore')) {
                console.log('Found maignore file.');
                var liner = new lineByLine(options.source + '/.maignore');
                var line;
                while(line = liner.next()) {
                    globs.push(line.toString('ascii'));
                }
            }

            function doExclude(entry) {
                if (globs) {
                    for (var idx in globs) {
                        var glob = globs[idx];
                        if (minimatch(entry.name, glob)) {
                            console.log('Excluding ' + entry.name);
                            return '';
                        }
                    }
                }

                return entry;
            }

            archive.pipe(output);
            archive.directory(options.source, '', doExclude);
            archive.finalize();
        } catch (ex) {
            console.log(ex);
        }
    });
};