var http = require('http');
var fs = require('fs');
var request = require('request');
var querystring = require('querystring');

var POPULATION_REQUEST_URL = 'http://api.population.io:80/1.0/population/2016/';

var server = http.createServer((originalRequest, responseToOriginalRequest) => {
  if (originalRequest.url === '/') {
    if (isGetRequest(originalRequest)) {
      request('http://api.population.io/1.0/countries',
        (error, responseToPopulationRequest, body) => {
          handleError(error, responseToPopulationRequest, responseToOriginalRequest);

          var countries = JSON.parse(body).countries;
          var options = '';
          for (var i = 0; i < countries.length; i++) {
            var country = countries[i];
            options += '<option>' + country + '</option>\n';
          }

          var html = fs.readFileSync('main.html', 'utf-8');
          html = html.replace('{{options1}}', options);
          html = html.replace('{{options2}}', options);

          responseToOriginalRequest.writeHead(200, {'Content-Type': 'text/html'});
          responseToOriginalRequest.write(html);
          responseToOriginalRequest.end();
        }
      );
      return;
    } else {
      originalRequest.on('data', (postBody) => {
        var parsedParams = querystring.parse(postBody.toString());
        var country1 = parsedParams.country1;
        var country2 = parsedParams.country2;

        request(POPULATION_REQUEST_URL + country1,
          (error, responseToPopulationRequest, body) => {
            handleError(error, responseToPopulationRequest, responseToOriginalRequest);

            var country1data = JSON.parse(body);
            var relevantInfo1 = extractRelevantInfo(country1data);

            request(POPULATION_REQUEST_URL + country2,
              (error, responseToPopulationRequest2, body) => {
                handleError(error, responseToPopulationRequest2, responseToOriginalRequest);

                var country2data = JSON.parse(body);
                var relevantInfo2 = extractRelevantInfo(country2data);

                var html = fs.readFileSync('compare.html', 'utf-8');
                html = html.replace('{{country1name}}', country1);
                html = html.replace('{{country2name}}', country2);

                var minAge = Math.min(relevantInfo1.minAge, relevantInfo2.minAge);
                var maxAge = Math.max(relevantInfo1.maxAge, relevantInfo2.maxAge);
                var populationData = '';
                populationData += '<tr><td>Total</td><td>' +
                  commaSeparate(relevantInfo1.total) + '</td><td>' +
                  commaSeparate(relevantInfo2.total) + '</td></tr>';
                for (var age = minAge; age <= maxAge; age++) {
                  populationData += '<tr><td>' + age + ' yo</td><td>' +
                    commaSeparate(relevantInfo1.populationMap[age]) + '</td><td>' +
                    commaSeparate(relevantInfo2.populationMap[age]) + '</td></tr>';
                }
                html = html.replace('{{populationData}}', populationData);

                responseToOriginalRequest.writeHead(200, {'Content-Type': 'text/html'});
                responseToOriginalRequest.write(html);
                responseToOriginalRequest.end();
              }
            );
          }
        );
      });
    }
  }

}).listen(process.env.PORT || 5000);

function isGetRequest(request) {
  return request.method.toLowerCase() === 'get';
}

function handleError(error, responseToPopulationRequest, responseToOriginalRequest) {
  if (error || responseToPopulationRequest.statusCode !== 200) {
    console.error(error.message);
    responseToOriginalRequest.end();
  }
}

function extractRelevantInfo(countryData) {
  var total = 0;
  var minAge = Infinity;
  var maxAge = -Infinity;
  var populationMap = {};
  for (var i = 0; i < countryData.length; i++) {
    var ageSpecificData = countryData[i];
    var age = ageSpecificData.age;
    minAge = Math.min(age, minAge);
    maxAge = Math.max(age, maxAge);
    var population = ageSpecificData.total;
    populationMap[age] = population;
    total += population;
  }
  return {
    total: total,
    minAge: minAge,
    maxAge: maxAge,
    populationMap: populationMap
  };
}

function commaSeparate(num) {
  return Number(num).toLocaleString('en');
}