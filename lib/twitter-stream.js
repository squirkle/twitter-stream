var TwitterFeed = function (params) {
  this.auth = params.auth;
  this.method = params.method;
  this.keywords = params.keywords || params.users || params.locations;
  this.onConnect = params.onConnect || function () {};
  this.onResponse = params.onResponse || function () {};
};

var TwitterLink = require('twitter-link');

var StreamConnection = function (auth, method, keywords) {
  var link = new TwitterLink(auth),
      postUrl = STREAM_API_URI + '?' + method + '=' + keywords.join(',');

  // establish connection to Twitter API
  return link.post(postUrl);
};

TwitterFeed.prototype.connect = function () {
  var twitter = new StreamConnection(this.auth, this.method, this.keywords),
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
