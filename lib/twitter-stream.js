// access point 'constants'
var REQUEST_TOKEN_URI = "https://api.twitter.com/oauth/request_token",
    ACCESS_TOKEN_URI = "https://api.twitter.com/oauth/access_token",
    STREAM_API_URI = "https://stream.twitter.com/1/statuses/filter.json";

var OAuth = require('oauth').OAuth;

var TwitterFeed = function (params) {
  this.auth = params.auth;
  this.method = params.method;
  this.keywords = params.keywords;
  this.onConnect = params.onConnect || function () {};
  this.onResponse = params.onResponse || function () {};
};

var AuthenticatedConnection = function (auth, method, keywords) {
  var oa = new OAuth(
      REQUEST_TOKEN_URI,
      ACCESS_TOKEN_URI,
      auth.consumer_key,
      auth.consumer_secret,
      "1.0A",
      null,
      "HMAC-SHA1"
    );

  var postUrl = STREAM_API_URI + '?' + method + '=' + keywords.join(',');

  // establish connection to Twitter API
  return oa.post(postUrl, auth.access_token, auth.access_token_secret);
};

TwitterFeed.prototype.connect = function () {
  var twitter = new AuthenticatedConnection(this.auth, this.method, this.keywords),
      that = this;

  // Add listener to Twitter connection--call to .onTweet() callback in this block
  twitter.addListener('response', function (response) {
    var message = '';
    response.setEncoding('utf8');
    response.addListener("data", function (chunk) {
      message += chunk;
      var newlineIndex = message.indexOf('\r');

      // response should not be sent until message includes '\r'
      // see: https://dev.twitter.com/docs/streaming-api/concepts#parsing-responses
      if (newlineIndex !== -1) {
        var tweet = message.slice(0, newlineIndex);
        tweet = tweet.trim();
        if (tweet !== '') {
          try {
            that.onResponse(JSON.parse(tweet));
          } catch (e) { console.log('could not parse tweet'); }
        }
      }
      message = message.slice(newlineIndex + 1);
    });
  });
  twitter.end();
};

module.exports = TwitterFeed;
