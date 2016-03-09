var http = require('http');
var fs = require('fs');
var request = require('request');
var url = require('url');
var querystring = require('querystring');

var server = http.createServer(function(req, res) {
  if (req.url === '/') {
    request('http://api.population.io/1.0/countries', function (error, response, body) {
      if (error || response.statusCode != 200) {
        console.error(error.message);
        res.end();
      }
      var countries = JSON.parse(body).countries;

      var options = '';
      for (var i = 0; i < countries.length; i++) {
        var country = countries[i];
        options += '<option>' + country + '</option>\n';
      }

      res.writeHead(200, {'Content-Type': 'text/html'});
      var html = fs.readFileSync('main.html', 'utf-8');
      html = html.replace('{{options1}}', options);
      html = html.replace('{{options2}}', options);
      res.write(html);

      res.end();
    });
  } else {
    var parseQueryString = true;
    var query = url.parse(req.url, parseQueryString).query;
    var country1 = query.country1;
    var country2 = query.country2;
    res.end('Compare ' + country1 + ' with ' + country2 + '.');
  }

}).listen(8080);