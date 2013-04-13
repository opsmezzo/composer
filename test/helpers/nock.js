var nock      = require('nock')
  , path      = require('path')
  , fs        = require('fs')
  , smartnock = {}
  ;

function endsWith (string, ending) {
  return string.length >= ending.length && 
    string.substr(string.length - ending.length) == ending;
}

function noop(){}

function fake_chain() {
  return {
      "get"                  : fake_chain
    , "post"                 : fake_chain
    , "delete"               : fake_chain
    , "put"                  : fake_chain
    , "intercept"            : fake_chain
    , "done"                 : fake_chain
    , "isDone"               : fake_chain
    , "filteringPath"        : fake_chain
    , "filteringRequestBody" : fake_chain
    , "matchHeader"          : fake_chain
    , "defaultReplyHeaders"  : fake_chain
    , "log"                  : fake_chain
  };
}

function loadFixture(filename, json) {
  var contents = fs.readFileSync(
    path.join(__dirname, '..', 'fixtures', filename), 'ascii');
  return json ? JSON.parse(contents): contents;
}

smartnock.nock = function (url, fixture) {
  if(process.env.NOCK) {
    var nocks = loadFixture(path.join(fixture, 'nock.json'), true);
    nocks.forEach(function(n) {
      var hasBody = n.length === 6, 
          i=0;
      var method   = n[i++]
        , url_path = n[i++]
        , body     = hasBody ? n[i++] : null
        , status   = n[i++] || 200
        , file     = n[i++] || ""
        , headers  = n[i++] || {}
        ;
      if(typeof file === "string" && endsWith(file, '.json')) {
        file = loadFixture(path.join(fixture, file));
      }
      if(typeof body === "string" && endsWith(body, '.json')) {
        body = loadFixture(path.join(fixture, body));
      }
      if(typeof headers === "string" && endsWith(headers, '.json')) {
        headers = loadFixture(path.join(fixture, headers));
      }
      console.error(url, method, url_path, body, status, file, headers)
      nock(url)[method](url_path, body).reply(status, file, headers);
    });
    nock(url).log(console.error)
    
    return nock(url);
  } else {
    return fake_chain();
  }
};

smartnock.nock.recorder = nock.recorder;
module.exports = smartnock.nock;