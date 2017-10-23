var express = require('express'),
    app = express(),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    client = require('./lib/client.js'),
    bodyParser = require('body-parser'),
    SpotifyWebApi = require('spotify-web-api-node');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

var client_id = client.client_id
    client_secret = client.client_secret,
    api_key = client.api_key,
    redirect_uri = 'localhost:8080/callback';

var spotifyApi = new SpotifyWebApi({
    client_id, client_secret, redirect_uri
});

var map = {},
    encore_map = {},
    data = [],
    artist = "",
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
            console.log(data.message);
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
                                                console.log(song.name);
                                                encore_map[song.name] = (encore_map[song.name]+1) || 1;
                                        });
                                    })
                                }
                            } else {
                                if(songList['song']) {
                                    songList['song'].forEach(function(song) {
                                        console.log(song.name);
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

app.get('/login', function(req, res) {
    
      // your application requests authorization
      res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
          client_id: client_id,
          response_type: 'code',
          redirect_uri: 'localhost:8080/callback',
        }));
});

app.get('/callback', function(req, res) {
    var code = req.query.code || null;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    };
    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token,
                refresh_token = body.resfresh_token;
            var options = {
                url: 'https://api.spotify.com/v1/me',
                headers: {'Authorization': 'Bearer ' + access_token},
                json:true
            };
            request.get(options, function(error,response, body) {
                console.log(body);
            });
            res.redirect('/#' +
                querystring.stringify({
                    access_token: access_token,
                    refresh_token: refresh_token
                }));
        } else {
            res.redirect('/#' + 
            querystring.stringify({
                error: 'invalid token'
            }));
        }
    });
});

app.get('/error', function(req, res) {
    res.render('error');
});

app.listen(8080, function() {
    console.log("listening on 8080");
});


