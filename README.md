# dropbox-auth-cli

Fetch the access token of your Dropbox Platform app from the command
line.

## Prerequisites

If you want to work with the Dropbox API, you need an access token.
Access tokens are tied to Dropbox Platform apps, so you first need to
register your app as a Dropbox Platform app:

[https://www.dropbox.com/developers/apps/create](https://www.dropbox.com/developers/apps/create)

## Installation

```
npm install dropbox-auth-cli -g
```

## CLI Usage

From the command line, run `dropbox-auth` and enter your Dropbox
Platform App key and secret.

The Dropbox access token will be stored in `~/.config/dropbox.json`.

## Programmatic Usage

You can run the module programmaticly as well:

```javascript
var dropboxAuth = require('dropbox-auth-cli');

dropboxAuth(function (err, token) {
  console.log('The users token is:' token);
});
```
