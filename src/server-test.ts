/// <reference path="../typings/main.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as Vertx from 'vertx.io-eventbus';
import EventBus from './vertx3-eventbus-ts-client/vertx-eventbus';

const app = express();


// configure our app to use bodyParser(it let us get the json data from a POST)
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port:number = process.env.PORT || 8088;
const router = express.Router();

//EventBus Stuff
const eventBus:Vertx = EventBus.getInstance("http://localhost:8089/eventbus/");

router.get('/event', function (req, res) {
    res.setHeader("Content-Type", "application/json");
    let message: String = "This is one message to the event bus";
    eventBus.send("TEST-SERVICE", message);
});



// prefixed all routes with /api
app.use('/api', router);

app.listen(port);
console.log('Send GET to test...');
console.log('http://127.0.0.1:' + port + '/api/event');
