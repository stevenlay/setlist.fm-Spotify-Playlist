var express = require('express'),
    app = express(),
    request = require('request'),
    axios = require('axios'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    client = require('./lib/client.js'),
    OAuth = require('oauth'),
    bodyParser = require('body-parser');
'use strict';

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

var client_id = client.client_id,
    client_secret = client.client_secret,
    api_key = client.api_key,
    spotify_id = client.spotify_id,
    spotify_secret = client.spotify_secret,
    redirect_uri = 'localhost:8080/callback',
    authCode = "",
    auth_token = "";
    spotify_token = "";
var payload = new Buffer(spotify_id+":"+spotify_secret).toString("base64");
var map = {},
    encore_map = {},
    album_map = {},
    data = [],
    artist = "",
    artist_id,
    tour = "";

app.get("/", function(req, res) {
    map = {}, encore_map = {}
    res.render("search");
});

app.post("/", function(req, res) {
    console.log(req.body.artist);
    console.log(req.body.tour);
    artist = req.body.artist;
    tour = req.body.tour;
    var headers = {
        'Accept': 'application/json',
        'x-api-key': api_key
    };
    
    var options = {
        url: 'https://api.setlist.fm/rest/1.0/search/setlists?artistName=' + req.body.artist + '&p=1&tourName=' + req.body.tour,
        headers: headers
    };
    function callback(error, response, body) {
        if (!error) {
            data = JSON.parse(body);
            //console.log(data.message);
            if(data.message === 'not found') {
                console.log("ERROR CAUGHT");
                return res.redirect("/error");
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
                                                //console.log(song.name);
                                                encore_map[song.name] = (encore_map[song.name]+1) || 1;
                                        });
                                    })
                                }
                            } else {
                                if(songList['song']) {
                                    songList['song'].forEach(function(song) {
                                        //console.log(song.name);
                                        map[song.name] = (map[song.name]+1) || 1;
                                    });
                                }
                            }
                            console.log();       
                         });
                   }
                });
            }
            console.log(map);
            console.log(encore_map);
            res.redirect("/results");
        } else {
            console.log("ERROR");
        }
    }
    request(options, callback);
});

app.get("/results", function(req, res) {
    res.render("results", {artist: artist, tour: tour, data: data});
});

app.get('/loginyt', function(req, res) {
    res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' +
    querystring.stringify({
        client_id: client_id,
        redirect_uri: 'http://localhost:8080/callbackgooglegoogle',
        scope: 'https://www.googleapis.com/auth/youtube',
        prompt: 'consent',
        response_type: 'code',
        access_type: 'offline'
    }));
});

app.get('/loginspotify', function(req, res) {
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        show_dialog: false,
        client_id: spotify_id,
        response_type: 'code',
        redirect_uri: 'http://localhost:8080/callback'
    }));
});

app.get('/callbackgoogle', function(req, res) {
        console.log(req.query.code);
        authCode = req.query.code;
        var url = "https://www.googleapis.com";
        url += '/oauth2/v4/token?code=' + authCode + '&client_id=' + client_id + '&client_secret=' + client_secret + '&redirect_uri=http://localhost:8080/callback&grant_type=authorization_code';
        function callback(err, response, body) {
                //console.log(body);
                auth_token = JSON.parse(body).access_token;
                //console.log(auth_token);
                res.render('callback');
        
        }
        request.post({url: url},callback);
});

app.get('/callback', function(req, res) {
        authCode = req.query.code;
        console.log(authCode);
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': 'Basic ' + payload
        }

        var dataString = 'grant_type=authorization_code&code=' + authCode + '&redirect_uri=http://localhost:8080/callback';
        var options = {
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            headers: headers,
            body: dataString,
        };
        function callback(err, response, body) {
            spotify_token = JSON.parse(body).access_token;
            console.log("Spotify_TOKEN: " + spotify_token);
            res.render('callback');
        }
        request(options, callback);
});

app.post('/callback', function(req, res) {
    var headers = {
        'Authorization': 'Bearer ' + spotify_token
    };

    var url = `https://api.spotify.com/v1/search?q=${artist}&type=artist`
    console.log("URL: " + url);
    var options = {
        url: url,
        headers: headers
    };
    function get_id(err, response, body) {
        body = JSON.parse(body);
        var artist_id = (body.artists.items[0].id);


        var options = {
            url: `https://api.spotify.com/v1/artists/${artist_id}/albums`,
            headers: headers
        }

        function get_albums(err, response, body) {
            console.log("\n");
            console.log("\n");
            console.log("\n");
            //console.log(body);
            body = JSON.parse(body);
            body.items.forEach(function(item) {
                var artists = item.artists;
                artists.forEach(function(artist) {
                    //console.log(artist);
                });
            });

            res.render('success');
        }
        request(options, get_albums);


  
    };
    request(options, get_id);
});
app.get('/error', function(req, res) {
    res.render('error');
});

app.get('/success', function(req, res) {
    res.render('success');
});

app.listen(8080, function() {
    console.log("listening on 8080");
});


