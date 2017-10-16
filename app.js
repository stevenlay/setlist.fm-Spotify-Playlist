var express = require('express'),
    app = express(),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser'),
    client = require('./lib/client.js');

app.set("view engine", "ejs");

var client_id = client.client_id;
var client_secret = client.client_secret;

app.get("/", function(req, res) {
    res.render("search.ejs");
});

app.post("/", function(req, res) {
    res.send("POST ROUTE");
});


app.listen(8080, function() {
    console.log("listening on 8080");
});


