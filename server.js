// server.js

// set up ========================
var express = require('express');
var app = express();                               // create our app w/ express
// log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({'extended': 'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({type: 'application/vnd.api+json'})); // parse application/vnd.api+json as json
app.use(methodOverride());


app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,Content-Type,Content-Range, Content-Disposition,Authorization,Accept');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, HEAD,GET,PUT,POST,DELETE');
    next();
})


// listen (start app with node server.js) ======================================
app.set('port', (process.env.PORT || 8080));
app.listen(process.env.PORT || 8080);
console.log("App listening on port 8080");
