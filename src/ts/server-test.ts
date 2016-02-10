/// <reference path="../../typings/main.d.ts" />
import * as express from 'express';
const app = express();
import * as bodyParser from 'body-parser';

import DAO = require('./dao/daoImpl');

const userDAO:DAO.InMemoryUserDAO = new DAO.InMemoryUserDAO();


//EventBus Stuff
var EventBus = require('vertx3-eventbus-client');
var eventBus = new EventBus("http://localhost:8089/eventbus/");

/** Don't call until the event bus is open. */
function onopenEventBus(message: String) {

      //Call using event bus.
      eventBus.send("TEST-SERVICE",
              "SAY_HELLO_WORLD", function(response, json) {
              console.log(json.body);
      });
}

/** Get notified of errors. */
function onerrorEventBus(error: String) {
  console.log("Problem calling event bus " + error)
}

eventBus.onopen = onopenEventBus;
eventBus.onerror = onerrorEventBus;


// configure our app to use bodyParser(it let us get the json data from a POST)
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port:number = process.env.PORT || 8080;
const router = express.Router();

router.get('/event', function (req, res) {
    res.end("OK");
    eventBus.onopen("OK");
});

router.get('/', function (req, res) {
    res.json(userDAO.read(req.query.id));
});

router.post('/', function (req, res) {
    res.json(userDAO.create(req.body));
});

router.put('/', function (req, res) {
    res.json({result : userDAO.update(req.body)});
});

router.delete('/', function (req, res) {
    res.json({result : userDAO.delete(req.query.id)});
});

// prefixed all routes with /api
app.use('/api', router);

app.listen(port);
console.log('http://127.0.0.1:' + port + '/api');
