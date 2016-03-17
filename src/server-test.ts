/// <reference path="../typings/main.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import { IEventBus } from 'Vertx';
import EventBus = require("./vertx3-eventbus-ts-client/vertx3-eventbus-ts-client");

const app = express();

const eventBus:IEventBus = new EventBus("http://localhost:8089/eventbus/"); 

// configure our app to use bodyParser(it let us get the json data from a POST)
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port:number = process.env.PORT || 8088;
const router = express.Router();

//EventBus Stuff

router.get('/event', function (req, res) {
    res.setHeader("Content-Type", "application/json");
    let message: String = "This is one message to the event bus";
    eventBus.send("TEST-SERVICE", message, undefined, function(response, json) {
                       res.end(json.body);
                 });
});



// prefixed all routes with /api
app.use('/api', router);

app.listen(port);
console.log('Send GET to test...');
console.log('http://127.0.0.1:' + port + '/api/event');
