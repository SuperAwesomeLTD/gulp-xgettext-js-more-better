'use strict';

var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var xgettext = require('xgettext-js-more-better');
var Catalog = require('gettext-catalog');
var assign = require('object-assign');

module.exports = function (catalogOptions, xgettextOptions, espreeOptions) {
  var catalog = new Catalog(catalogOptions);

  var firstFile = null;

  var finish = function (cb) {
    var pos = catalog.toPOs();
    pos.forEach(function (po) {
      this.push(new gutil.File({
        // if you don't want to use the first file for the base directory, you can use gulp-rename to change it
        cwd: firstFile.cwd,
        base: firstFile.base,
        path: path.join(firstFile.base, po.domain + '.pot'),
        contents: new Buffer(po.toString())
      }));
    }.bind(this));

    cb();
  };

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      return cb(new gutil.PluginError('gulp-xgettext-js-more-better', 'Streaming not supported'));
    }

    if (!firstFile) {
      firstFile = file;
    }

    var options = {
        filename: path.relative(file.cwd, file.path)
    };

    if (catalogOptions.identifiers) {
        options.identifiers = catalogOptions.identifiers;
    }

    var messages = xgettext(file.contents.toString(), assign(options, xgettextOptions), espreeOptions);
    catalog.addMessages(messages.messages);

    return cb();
  }, finish);
};
