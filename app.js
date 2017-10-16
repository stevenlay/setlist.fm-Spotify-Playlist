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
    console.log(req.body.artist);
    console.log(req.body.tour);
    var headers = {
        'Accept': 'application/json',
        'x-api-key': api_key
    };
    
    var options = {
        url: 'https://api.setlist.fm/rest/1.0/search/setlists?artistName=' + req.body.artist + '&p=1&tourName=' + req.body.tour,
        headers: headers
    };
    
    var data, set;

    var counter = 0;
    function callback(error, response, body) {
        if (!error) {
            var data = JSON.parse(body);
            data['setlist'].forEach(function(set) {
                if(set.sets.set.length > 0) {
                    console.log(set.sets);
                }  
            });
        } else {
            console.log("ERROR");
        }
    }
    
    request(options, callback); 
    res.render("results", {data:data, artist: req.body.artist, tour: req.body.tour});
});


app.listen(8080, function() {
    console.log("listening on 8080");
});


