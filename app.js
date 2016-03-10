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
            var minAge1 = Infinity;
            var maxAge1 = 0;
            var myData1 = {};
            for (var i = 0; i < country1data.length; i++) {
              var ageSpecificData = country1data[i];
              var age = ageSpecificData.age;
              minAge1 = Math.min(age, minAge1);
              maxAge1 = Math.max(age, maxAge1);
              var population = ageSpecificData.total;
              myData1[age] = population;
              total1 += population;
            }

            request('http://api.population.io:80/1.0/population/2016/' + country2 + '/',
              (error, response, body) => {
                if (error || response.statusCode != 200) {
                  console.error(error.message);
                  res.end();
                }

                var country2data = JSON.parse(body);
                var country2text = '';
                var total2 = 0;
                var minAge2 = Infinity;
                var maxAge2 = 0;
                var myData2 = {};
                for (var i = 0; i < country2data.length; i++) {
                  var ageSpecificData = country2data[i];
                  var age = ageSpecificData.age;
                  minAge2 = Math.min(age, minAge2);
                  maxAge2 = Math.max(age, maxAge2);
                  var population = ageSpecificData.total;
                  myData2[age] = population;
                  total2 += population;
                }

                res.writeHead(200, {'Content-Type': 'text/html'});
                var html = fs.readFileSync('compare.html', 'utf-8');

                html = html.replace('{{country1name}}', country1);
                html = html.replace('{{country2name}}', country2);


                var minAge = Math.min(minAge1, minAge2);
                var maxAge = Math.max(maxAge1, maxAge2);

                var populationData = '';
                populationData += '<tr><td>Total</td><td>' + commaSeparate(total1) + '</td><td>' + commaSeparate(total2) + '</td></tr>';
                for (var age = minAge; age <= maxAge; age++) {
                  populationData += '<tr><td>' + age + ' yo</td><td>' + commaSeparate(myData1[age]) + '</td><td>' + commaSeparate(myData2[age]) + '</td></tr>';
                }

                html = html.replace('{{populationData}}', populationData);

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

function commaSeparate(num) {
  return Number(num).toLocaleString('en');
}