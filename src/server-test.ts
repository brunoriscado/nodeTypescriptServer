/// <reference path="../typings/main.d.ts" />

import * as express from 'express';
import * as bodyParser from 'body-parser';
import { IEventBus } from 'EventBus';
import io = require("./vertx3-ts-client/vertx3-ts-client");

const app = express();
 
// configure our app to use bodyParser(it let us get the json data from a POST)
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port:number = process.env.PORT || 8088;
const router = express.Router();

function onOpenMessage() {
    console.log('Event Bus opened...');
}

function onMessage(e:any) {
    console.log('Event Bus message send:\n'+JSON.stringify(e));
}


const eventBus:IEventBus = io.Vertx.EventBusImpl.getInstance("http://localhost:8089/eventbus/", undefined, onOpenMessage, onMessage);


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
