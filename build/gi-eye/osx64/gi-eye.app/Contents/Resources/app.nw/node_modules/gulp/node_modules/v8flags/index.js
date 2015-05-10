// this entire module is depressing. i should have spent my time learning
// how to patch v8 so that these options would just be available on the
// process object.

const os = require('os');
const fs = require('fs');
const path = require('path');
const execFile = require('child_process').execFile;
const env = process.env;
const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;
const configfile = '.v8flags.'+process.versions.v8+'.'+user+'.json';
const exclusions = ['--help'];

const failureMessage = [
  'Unable to cache a config file for v8flags to a your home directory',
  'or a temporary folder. To fix this problem, please correct your',
  'environment by setting HOME=/path/to/home or TEMP=/path/to/temp.',
  'NOTE: the user running this must be able to access provided path.',
  'If all else fails, please open an issue here:',
  'http://github.com/tkellen/js-v8flags'
].join('\n');

function fail (err) {
  err.message += '\n\n' + failureMessage;
  return err;
}

function openConfig (cb) {
  var userHome = require('user-home');
  var configpath = path.join(userHome || os.tmpdir(), configfile);
  // open file for reading and appending. if the filesize is zero
  // we will spawn node with --v8-options and write the parsed
  // options to a file. if it is larger than zero, we'll just read
  // the file and be done.
  fs.open(configpath, 'a+', function (err, fd) {
    if (err) {
      return cb(fail(err));
    }
    return cb(null, fd);
  });
}

function writeConfig (fd, cb) {
  execFile(process.execPath, ['--v8-options'], function (execErr, result) {
    var flags;
    if (execErr) {
      return cb(execErr);
    }
    flags = result.match(/\s\s--(\w+)/gm).map(function (match) {
      return match.substring(2);
    }).filter(function (name) {
      return exclusions.indexOf(name) === -1;
    });
    var buf = new Buffer(JSON.stringify(flags));
    fs.write(fd, buf, 0, buf.length, 0, function (writeErr, bytesWritten, buffer) {
      // linux ignores positional arguments when files are open in append mode.
      // the truncate call below ensures that multiple concurrent processes
      // trying to write to this config will not result in a file with the
      // contents appended multiple times.
      fs.ftruncate(fd, buf.length, function (truncErr) {
        fs.close(fd, function (closeErr) {
          var err = truncErr || writeErr || closeErr;
          if (err) {
            return cb(fail(err));
          }
          return cb(null, JSON.parse(buffer.toString()));
        });
      })
    });
  });
}

function readConfig (fd, filesize, cb) {
  var buf = new Buffer(filesize);
  fs.read(fd, buf, 0, filesize, 0, function (readErr, bytesRead, buffer) {
    fs.close(fd, function (closeErr) {
      var err = readErr || closeErr;
      if (err) {
        return cb(fail(err));
      }
      return cb(null, JSON.parse(buffer.toString()));
    });
  });
}

module.exports = function (cb) {
  openConfig(function (err, fd) {
    if (err) {
      return cb(fail(err));
    }
    fs.fstat(fd, function (statErr, stats) {
      var filesize = stats.size;
      if (statErr) {
        return cb(fail(statErr));
      }
      if (filesize === 0) {
        return writeConfig(fd, cb);
      }
      return readConfig(fd, filesize, cb);
    });
  });
};

module.exports.configfile = configfile;
