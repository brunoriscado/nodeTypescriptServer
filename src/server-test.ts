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
;


function onMessage(e:any) {
    console.log('Event Bus onMessage send/received:\n'+JSON.stringify(e));
}

function onOpen() {
    console.log('Event Bus opened...');
    registerHandler();
}


const eventBus = io.Vertx.EventBusImpl.getInstance("http://localhost:8089/eventbus/", undefined, onOpen, onMessage);


function registerHandlerCallback(e:any) {
    console.log('Event Bus registerHandlerCallback received:\n'+JSON.stringify(e));
}


function registerHandler(e?:any) {
    console.log("try to register a new handler:"+ JSON.stringify(e));
    eventBus.registerHandler("TEST-HANDLER", undefined, registerHandlerCallback);
}


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
