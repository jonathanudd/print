var scribe = require('scribe-js')(),
       console = process.console,
       express = require('express'),
       app = express();


app.set('port', (process.env.PORT || 5000));
app.get('/', function(req, res) {
res.send('Hello world, see you at /logs');
});
app.use('/logs', scribe.webPanel());
console.addLogger('debug', 'red');
console.addLogger('fun', 'red');
var port = app.get("port");
app.listen(port, function() {
console.time().log('Server listening at port ' + port);
});
