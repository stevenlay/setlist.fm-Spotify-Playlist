var express = require('express'),
    app = express(),
    request = require('request'),
    querystring = require('querystring'),
    bodyParser = require('body-parser');

app.set("view engine", "ejs");
app.set('port', (process.env.PORT || 8080));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));

var spotify_id = process.env.client_id,
    spotify_secret = process.env.spotify_secret,
    redirect_uri = 'https://setlistspotify.herokuapp.com/callback',
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
    res.render("search");
});

app.post("/", function(req, res) {
    artist_name = req.body.artist;
    tour = req.body.tour;
    var headers = {
        'Accept': 'application/json',
        'Accept-Language': 'en',
        'x-api-key': '249ec1e5-c734-43b4-8c7d-dd651a2c2d37'
    };
    console.log(api_key);
    var options = {
        url: 'https://api.setlist.fm/rest/1.0/search/setlists?artistName=' + artist_name + '&p=1&tourName=' + req.body.tour,
        headers: headers
    };
    function callback(error, response, body) {
        if (!error) {
            data = JSON.parse(body);
            console.log("Message: "+ JSON.stringify(data));
            if(data.message === 'not found') {
                console.log("ERROR CAUGHT");
                return res.redirect("/error");
            } else {
                map = {};
                encore_map = {};
                if(data.setlist) {
                    data.setlist.forEach(function(sets) {
                        let actualSet = sets.sets.set;
                        if(actualSet.length > 0) {
                            actualSet.forEach(function(songList) {
                                if(songList.encore) {
                                    console.log(songList.song);
                                    if(songList['song']) {
                                        songList['song'].forEach(function(song) {
                                            songList.song.forEach(function(song) {
                                                    encore_map[(song.name).toLowerCase()] = (encore_map[(song.name).toLowerCase()]+1) || 1;
                                            });
                                        })
                                    }
                                } else {
                                    if(songList['song']) {
                                        songList['song'].forEach(function(song) {
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

app.get('/loginspotify', function(req, res) {
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        show_dialog: false,
        client_id: spotify_id,
        scope: 'playlist-read-private playlist-modify playlist-modify-private',
        response_type: 'code',
        redirect_uri: 'https://setlistspotify.herokuapp.com/callback'
    }));
});

app.get('/callback', function(req, res) {
        authCode = req.query.code;
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': 'Basic ' + payload
        }

        let dataString = 'grant_type=authorization_code&code=' + authCode + '&redirect_uri=http://localhost:8080/callback';
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
    var link = "";
    let headers = {
        'Authorization': 'Bearer ' + spotify_token
    };

    let url = `https://api.spotify.com/v1/search?q=${artist_name}&type=artist`
    //console.log("URL: " + url);
    var options = {
        url: url,
        headers: headers
    };

    function get_id(err, response, body) {
        body = JSON.parse(body);
        let artist_id = (body.artists.items[0].id);


        let options = {
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
                let album_type = item.album_type;
                let artist = item.artists;

                if(album_type === 'album' && artist[0].name === artist_name) {
                   album_ids.push(item.id);
                }
                if (album_type === 'single' && artist[0].name === artist_name) {
                    album_ids.push(item.id);
                }
            });
            album_request = album_ids.join(",");
            let options = {
                url: 'https://api.spotify.com/v1/albums/?ids=' + album_request,
                headers: headers
            };

            function get_tracks(err, response, body) {
                body = JSON.parse(body);
                let albums = body.albums;
                console.log(albums);
                song_ids = {};
                //iterate through all the albums and get the track 
                //need to match track name to be added
                for (let i = 0; i < albums.length; i++) {
                    for (let numTrack = 0; numTrack < albums[i].tracks.total; numTrack++) {
                        let track_name = albums[i].tracks.items[numTrack].name.replace(/\s*\(.*?\)\s*/g, '');   
                        let track_uri = albums[i].tracks.items[numTrack].uri; 
                        console.log(track_name);
                        song_ids[track_name.toLowerCase()] = track_uri;              
                    }              
                }
                console.log(song_ids);
                let options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: headers
                };

                function get_user(err, response, body) {
                    body = JSON.parse(body);
                    user_id = body.id;

                    map_uri();
                    let options = {
                        url: `https://api.spotify.com/v1/users/${user_id}/playlists`,
                        headers: headers,
                        body: JSON.stringify({  "description": `Setlist of ${artist_name} ${tour}`, 
                        "public": false,
                        "name": `${artist_name} ${tour}`
                         })
                    }

                    function add_tracks(err, response, body) {
                        console.log('Created Playlist');
                        body = JSON.parse(body);
                        console.log(body);
                        link = body.external_urls.spotify;
                        playlist_id = body.id;

                        let options = {
                            url: `https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks?` +
                            querystring.stringify({uris: joined_uris}),
                            headers: headers
                        }

                        function done(err, response, body) {
                            body = JSON.parse(body);
                            console.log(link);
                            res.render('success', {playlist: link});
                        }
                        request.post(options, done);
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
    joined_uris = ""; 
    track_uris = [];

    //if key values match up from song_ids to the map, add to array for playlist
    for (const [key, value] of Object.entries(map)) {
        if(song_ids[key]) {
            track_uris.push(song_ids[key]);
        }
    }
    for (const [key, value] of Object.entries(encore_map)) {
        if(song_ids[key]) {
            track_uris.push(song_ids[key]);
        }
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


