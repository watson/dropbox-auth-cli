'use stict';

var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var opn = require('opn');
var mkdirp = require('mkdirp');
var untildify = require('untildify');
var inquirer = require('inquirer');

var appKey = process.env.DROPBOX_KEY;
var appSecret = process.env.DROPBOX_SECRET;
var port = process.env.PORT || 3042;
var redirectUrl = 'http://localhost:' + port;

var start = function (callback) {
  http.createServer(function (req, res) {
    var code = querystring.parse(url.parse(req.url).query).code;

    if (!code) {
      res.writeHead(404);
      res.end();
      return;
    }

    req.on('end', function (err) {
      if (err) console.log('Error:', err.message);
      process.exit();
    });

    getAccessToken(code, function (err, token) {
      var respond = function (headline, body) {
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><center><h1>' + headline + '</h1><p>' + body + '</p></center></html>');
      };

      if (err) {
        respond('Error!', err.body);
        callback(err);
        return;
      }

      console.log('\nYour token is:\n\n  ' + token);

      save(token, function (err) {
        if (err) {
          respond('Error!', err.message);
          callback(err);
          return;
        }
        respond('Success!', 'Now return to your console for further instructions :)');
        callback(null, token);
      });
    });
  }).listen(port, ask);
};

var ask = function () {
  console.log('A Dropbox access token is tied to a Dropbox Platform app.');
  console.log('If you haven\'t done so already, please create one first via this link:');
  console.log('\n  https://www.dropbox.com/developers/apps/create\n');
  console.log('Then return and fill in the following details which you\'ll find on the app Settings page:\n');

  var questions = [
    { name: 'appKey', message: 'Dropbox App Key' },
    { name: 'appSecret', message: 'Dropbox App Secret' }
  ];

  inquirer.prompt(questions, function (answers) {
    appKey = answers.appKey;
    appSecret = answers.appSecret;
    openBrowser();
  });
};

var openBrowser = function () {
  var params = {
    response_type: 'code',
    client_id: appKey,
    redirect_uri: redirectUrl
  };
  var url = 'https://www.dropbox.com/1/oauth2/authorize?' + querystring.stringify(params);

  console.log('\nIf your browser doesn\'t open automatically, please open this URL manually:\n\n  ' + url);
  opn(url);
};

var getAccessToken = function (code, callback) {
  var params = {
    code: code,
    grant_type: 'authorization_code',
    client_id: appKey,
    client_secret: appSecret,
    redirect_uri: redirectUrl
  };
  var options = {
    method: 'POST',
    hostname: 'api.dropbox.com',
    path: '/1/oauth2/token?' + querystring.stringify(params)
  };

  https.request(options, function (res) {
    var buffers = [];
    res.on('data', buffers.push.bind(buffers));
    res.on('end', function () {
      var buffer = Buffer.concat(buffers);
      var err;

      try {
        var body = JSON.parse(buffer);
      } catch (e) {
        err = e;
      }

      if (!body || !body.access_token) {
        err = err || new Error('Unexpected response');
        err.body = buffer.toString();
        callback(err);
        return;
      }

      callback(null, body.access_token);
    });
  }).end();
};

var save = function (token, callback) {
  var dir = untildify('~/.config');
  mkdirp(dir, '0755', function (err) {
    if (err) return callback(err);
    var file = path.join(dir, 'dropbox.json');
    fs.writeFileSync(file, JSON.stringify({ token: token }));
    console.log('\nSuccessfully saved your token in:\n\n  ' + file);
    callback();
  });
};

module.exports = start;
