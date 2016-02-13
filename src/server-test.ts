/// <reference path="../typings/main.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as DAO from './dao/daoImpl';

const app = express();
const userDAO:DAO.InMemoryUserDAO = new DAO.InMemoryUserDAO();


// configure our app to use bodyParser(it let us get the json data from a POST)
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port:number = process.env.PORT || 8088;
const router = express.Router();

//EventBus Stuff
var EventBus = require('vertx3-eventbus-client');
var eventBus = new EventBus("http://localhost:8089/eventbus/");

router.get('/event', function (req, res) {
    res.setHeader("Content-Type", "application/json");
    let message: String = "This is one message to the event bus";
    eventBus.send("TEST-SERVICE", message, function(response, json) {
                       res.end(json.body);
                 });
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
console.log('Send GET to test...');
console.log('http://127.0.0.1:' + port + '/api/event');
