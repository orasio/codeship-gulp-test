var express = require('express');
var app = express();
var getme = require('./js/getme');

app.get('/', function(req, res){
  res.send('hello world');
});
app.get('/getme', getme.getme);

app.listen(process.env.port || 1337);
console.log("App is running in %s port", process.env.port || 1337);