var express = require('express'),
    app = express(),
    request = require('request'),
    querystring = require('querystring'),
    //client = require('./lib/client.js'),
    bodyParser = require('body-parser');
'use strict';

app.set("view engine", "ejs");
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({extended:true}));

var spotify_id = process.env.client_id,
    client_secret = "",//client.client_secret,
    api_key = process.env.api_key,
    spotify_secret = process.env.spotify_secret,
    redirect_uri = 'localhost:8080/callback',
    authCode = "",
    auth_token = "";
    spotify_token = "";
var payload = new Buffer(spotify_id+":"+spotify_secret).toString("base64");
var map = {},
    encore_map = {},
    song_ids = {},
    album_ids = [],
    album_request = "",
    data = [],
    artist_name = "",
    artist_id,
    user_id,
    playlist_id,
    track_uris = [],
    joined_uris;
    tour = "";

app.get("/", function(req, res) {
    map = {}, encore_map = {}
    res.render("search");
});

app.post("/", function(req, res) {
    console.log(req.body.artist);
    console.log(req.body.tour);
    artist_name = req.body.artist;
    tour = req.body.tour;
    var headers = {
        'Accept': 'application/json',
        'x-api-key': api_key
    };
    
    var options = {
        url: 'https://api.setlist.fm/rest/1.0/search/setlists?artistName=' + artist_name + '&p=1&tourName=' + req.body.tour,
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
                if(data.setlist) {
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
                                                    encore_map[(song.name).toLowerCase()] = (encore_map[(song.name).toLowerCase()]+1) || 1;
                                            });
                                        })
                                    }
                                } else {
                                    if(songList['song']) {
                                        songList['song'].forEach(function(song) {
                                            //console.log(song.name);
                                            map[(song.name).toLowerCase()] = (map[(song.name).toLowerCase()]+1) || 1;
                                        });
                                    }
                                }
                                console.log();       
                            });
                        }
                    });
                } else {
                    return res.redirect("/error");
                }
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
    res.render("results", {artist: artist_name, tour: tour, data: data});
});

// app.get('/loginyt', function(req, res) {
//     res.redirect('https://accounts.google.com/o/oauth2/v2/auth?' +
//     querystring.stringify({
//         client_id: client_id,
//         redirect_uri: 'http://localhost:8080/callbackgooglegoogle',
//         scope: 'https://www.googleapis.com/auth/youtube',
//         prompt: 'consent',
//         response_type: 'code',
//         access_type: 'offline'
//     }));
// });

app.get('/loginspotify', function(req, res) {
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        show_dialog: false,
        client_id: spotify_id,
        scope: 'playlist-read-private playlist-modify playlist-modify-private',
        response_type: 'code',
        redirect_uri: 'http://localhost:8080/callback'
    }));
});

app.get('/callbackgoogle', function(req, res) {
        //console.log(req.query.code);
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
        //console.log(authCode);
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
            //console.log("Spotify_TOKEN: " + spotify_token);
            res.render('callback');
        }
        request(options, callback);
});

app.post('/callback', function(req, res) {
    var headers = {
        'Authorization': 'Bearer ' + spotify_token
    };

    var url = `https://api.spotify.com/v1/search?q=${artist_name}&type=artist`
    //console.log("URL: " + url);
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
                var album_type = item.album_type;
                var artist = item.artists;

                if(album_type === 'album' && artist[0].name === artist_name) {
                    //console.log(item.id);
                    //console.log(item.name);
                   //album_map[item.id] = item.name;
                   album_ids.push(item.id);
                }
                if (album_type === 'single' && artist[0].name === artist_name) {
                    //console.log(item.id);
                    //console.log(item.name);
                    //single_map[item.id] = item.name;
                    album_ids.push(item.id);
                }
            });
            album_request = album_ids.join(",");
            //console.log(album_request);
            var options = {
                url: 'https://api.spotify.com/v1/albums/?ids=' + album_request,
                headers: headers
            };

            function get_tracks(err, response, body) {
                body = JSON.parse(body);
                var albums = body.albums;

                //iterate through all the albums
                for (var i = 0; i < albums.length; i++) {
                    //console.log(albums[i].name);
                    //console.log(albums[i].length;)
                    for (var numTrack = 0; numTrack < albums[i].tracks.total; numTrack++) {
                        var track_name = albums[i].tracks.items[numTrack].name;   
                        var track_uri = albums[i].tracks.items[numTrack].uri; 
                        console.log(track_name);
                        song_ids[track_name.toLowerCase()] = track_uri;              
                    }              
                }
                //console.log(song_ids);
                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: headers
                };

                function get_user(err, response, body) {
                    body = JSON.parse(body);
                    user_id = body.id;
                    //console.log(user_id);
                    
                    map_uri();
                    var options = {
                        url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
                        headers: headers,
                        body: JSON.stringify({  "description": `Setlist of ${artist_name}: ${tour}`, 
                        "public": false,
                        "name": `${artist_name}: ${tour}`
                         })
                    }

                    function add_tracks(err, response, body) {
                        console.log('Created Playlist');
                        body = JSON.parse(body);
                        console.log(body);
                        playlist_id = body.id;


                        var options = {
                            url: `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks?` +
                            querystring.stringify({uris: joined_uris}),
                            headers: headers
                        }

                        function afterwards(err, response, body) {
                            console.log(joined_uris);
                            var body = JSON.parse(body);
                            console.log(body);
                            res.render('success');
                        }
                        request.post(options, afterwards);
                    };
                    request.post(options,add_tracks);
                }
                request(options, get_user);             
            };
            request(options, get_tracks);
            console.log()
        }
        request(options, get_albums);
    };
    request(options, get_id);
});

function map_uri() {
    console.log("mapped");
    for (const [key, value] of Object.entries(map)) {
        // do something with `key` and `value`
        if(song_ids[key]) {
            track_uris.push(song_ids[key]);
        }
    }
    for (const [key, value] of Object.entries(encore_map)) {
        // do something with `key` and `value`
        if(song_ids[key]) {
            track_uris.push(song_ids[key]);
        }
    }
    for (var i = 0; i < track_uris.length; i++) {
        //console.log(track_uris[i]);
    }
    joined_uris = track_uris.join(",");                 
}

app.get('/error', function(req, res) {
    res.render('error');
});

app.get('/success', function(req, res) {
    res.render('success');
});

app.listen(app.get('port'), function() {
    console.log("Listening on: ", app.get('port'));
});


