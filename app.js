var express = require('express'),
    app = express(),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    client = require('./lib/client.js'),
    bodyParser = require('body-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
var client_id = client.client_id
    client_secret = client.client_secret,
    api_key = client.api_key;


app.get("/", function(req, res) {
    res.render("search");
});

app.post("/", function(req, res) {
    var headers = {
        'Accept': 'application/json',
        'x-api-key': api_key
    };
    
    var options = {
        url: 'https://api.setlist.fm/rest/1.0/search/setlists?artistName=' + req.body.artist + '&p=1&tourName=' + req.body.tour,
        headers: headers
    };
    
    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            (data['setlist'].forEach(function(set) {
                console.log(set.artist.name);    
            }));
        }
    }
    
    request(options, callback); 
    res.send(req.body.artist + " " + req.body.tour);
});


app.listen(8080, function() {
    console.log("listening on 8080");
});


