var express = require('express'),
    app = express(),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    client = require('./lib/client.js'),
    bodyParser = require('body-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
var client_id = client.client_id;
var client_secret = client.client_secret;

app.get("/", function(req, res) {
    res.render("search");
});

app.post("/", function(req, res) {
    res.send(req.body.artist + " " + req.body.tour);
});


app.listen(8080, function() {
    console.log("listening on 8080");
});


