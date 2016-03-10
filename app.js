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



            var country1data = JSON.parse(body);
            var country1text = '';
            var total1 = 0;
            for (var i = 0; i < country1data.length; i++) {
              var ageSpecificData = country1data[i];
              var age = ageSpecificData.age;
              var population = ageSpecificData.total;
              total1 += population;
              country1text += 'Age ' + age + ': ' + population + '<br>';
            }
            country1text += 'Total: ' + total1;

            request('http://api.population.io:80/1.0/population/2016/' + country2 + '/',
              (error, response, body) => {
                if (error || response.statusCode != 200) {
                  console.error(error.message);
                  res.end();
                }
                var country2data = JSON.parse(body);
                var country2text = '';
                var total2 = 0;
                for (var i = 0; i < country2data.length; i++) {
                  var ageSpecificData = country2data[i];
                  var age = ageSpecificData.age;
                  var population = ageSpecificData.total;
                  total2 += population;
                  country2text += 'Age ' + age + ': ' + population + '<br>';
                }
                country2text += 'Total: ' + total2;

                res.writeHead(200, {'Content-Type': 'text/html'});
                var html = fs.readFileSync('compare.html', 'utf-8');

                html = html.replace('{{country1name}}', country1);
                html = html.replace('{{country2name}}', country2);

                html = html.replace('{{country1text}}', country1text);
                html = html.replace('{{country2text}}', country2text);
                res.write(html);

                res.end();
              }
            );
          }
        );
      });
    }
  }

}).listen(process.env.PORT || 5000);
