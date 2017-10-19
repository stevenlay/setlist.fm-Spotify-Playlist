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
    var data = [], counter = 0;
    function callback(error, response, body) {
        if (!error) {
            data = JSON.parse(body);
            console.log(data.message);
            if(data.message === 'not found') {
                console.log("ERROR CAUGHT");
                res.render("error", {artist: req.body.artist, tour:req.body.tour});
            } else {
                data.setlist.forEach(function(sets) {
                    var actualSet = sets.sets.set;
                    if(actualSet.length > 0) {
                        actualSet.forEach(function(songList) {
                            if(songList.encore) {
                                //console.log(songList.song);
                                if(songList['song']) {
                                    songList['song'].forEach(function(song) {
                                        songList.song.forEach(function(song) {
                                                console.log(song.name);
                                        });
                                    })
                                }
                            } else {
                                if(songList['song']) {
                                    songList['song'].forEach(function(song) {
                                        console.log(song.name);
                                    });
                                }
                            }
                            console.log();       
                         });
                   }
                });
            }
            res.render("results", {data:data, artist: req.body.artist, tour:req.body.tour});
        } else {
            console.log("ERROR");
        }
    }
    request(options, callback);
});


app.listen(8080, function() {
    console.log("listening on 8080");
});


