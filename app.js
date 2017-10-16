var express = require('express');
var request = require('request');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client = require('./lib/client.js');
var client_id = client.client_id;
var client_secret = client.client_secret;

console.log(client_id);
