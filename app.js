var http = require('http');
var fs = require('fs');
var request = require('request');
var url = require('url');
var querystring = require('querystring');

var server = http.createServer(function(req, res) {
  if (req.url === '/') {
    if (req.method.toLowerCase() === 'get') {
      request('http://api.population.io/1.0/countries',
        (error, response, body) => {
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
        }
      );
      return;
    } else {
      req.on('data', function (postBody) {
        var parsedParams = querystring.parse(postBody.toString());
        var country1 = parsedParams.country1;
        var country2 = parsedParams.country2;

        request('http://api.population.io:80/1.0/population/2016/' + country1 + '/',
          (error, response, body) => {
            if (error || response.statusCode != 200) {
              console.error(error.message);
              res.end();
            }
            var country1Data = JSON.parse(body);
            res.write('\n============ ' + country1 + ' ============\n');
            var total1 = 0;
            for (var i = 0; i < country1Data.length; i++) {
              var ageSpecificData = country1Data[i];
              var age = ageSpecificData.age;
              var population = ageSpecificData.total;
              total1 += population;
              res.write('Age ' + age + ': ' + population + '\n');
            }
            res.write('Total: ' + total1 + '\n');

            request('http://api.population.io:80/1.0/population/2016/' + country2 + '/',
              (error, response, body) => {
                if (error || response.statusCode != 200) {
                  console.error(error.message);
                  res.end();
                }
                var country2Data = JSON.parse(body);
                res.write('\n============ ' + country2 + ' ============\n');
                var total2 = 0;
                for (var i = 0; i < country2Data.length; i++) {
                  var ageSpecificData = country2Data[i];
                  var age = ageSpecificData.age;
                  var population = ageSpecificData.total;
                  total2 += population;
                  res.write('Age ' + age + ': ' + population + '\n');
                }
                res.write('Total: ' + total2 + '\n');

                res.end();
              }
            );
          }
        );
      });
    }
  }

}).listen(process.env.PORT || 5000);
