/*
 *   Copyright (c) 2011-2015 The original author or authors
 *   ------------------------------------------------------
 *   All rights reserved. This program and the accompanying materials
 *   are made available under the terms of the Eclipse Public License v1.0
 *   and Apache License v2.0 which accompanies this distribution.
 *
 *       The Eclipse Public License is available at
 *       http://www.eclipse.org/legal/epl-v10.html
 *
 *       The Apache License v2.0 is available at
 *       http://www.opensource.org/licenses/apache2.0.php
 *
 *   You may elect to redistribute this code under either of these licenses.
 */

/// <reference path="vertx3-eventbus-ts-client.d.ts" />
import SockJs = require("sockjs-client");
// import an interface from a modern module
import { IEventBus } from 'Vertx';

enum EventBusState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
}

class MessageType {
    public static REPLY:string="reply";
    public static SEND:string = "send";
    public static PUBLISH:string = "publish";
    public static REGISTER:string = "register";
    public static UNREGISTER:string = "unregister";
}


var _instance:EventBusImpl;

export = EventBusImpl;

class EventBusImpl implements IEventBus {

    private static _instance:EventBusImpl;
    private static sockJSConn:__SockJSClient.SockJSClass;
    private static state:EventBusState = EventBusState.CONNECTING;
        
    private options: any;
    private pingInterval: number = 5000;
    private pingTimerID:number;

    private handlers = {};
    private replyHandlers = {};
    private defaultHeaders = null;

   /**
    * EventBus
    *
    * @param url
    * @param options
    * @constructor
   */
    constructor(url: string, options?: any) {
        if (! _instance) {
            _instance = this;
            EventBusImpl.sockJSConn = new SockJs(url, null, options);

            EventBusImpl.sockJSConn.onopen = function() {
                _instance.sendPing();
                _instance.pingTimerID = setInterval(_instance.sendPing, _instance.pingInterval);
                EventBusImpl.state = EventBusState.OPEN;
                _instance.onopen();
            };
            
            
            EventBusImpl.sockJSConn.onclose = function() {
                EventBusImpl.state = EventBusState.CLOSED;
                if (_instance.pingTimerID) clearInterval(_instance.pingTimerID);
                _instance.onclose();
            };
            
            EventBusImpl.sockJSConn.onmessage = function(e) {
                var json = JSON.parse(e.data);

                // define a reply function on the message itself
                if (json.replyAddress) {
                    Object.defineProperty(json, MessageType.REPLY, {
                        value: function(message, headers, callback) {
                            _instance.send(json.replyAddress, message, headers, callback);
                        }
                    });
                }

                if (_instance.handlers[json.address]) {
                    // iterate all registered handlers
                    var handlers = _instance.handlers[json.address];
                    for (var i = 0; i < handlers.length; i++) {
                        if (json.type === 'err') {
                            handlers[i]({ failureCode: json.failureCode, failureType: json.failureType, message: json.message });
                        } else {
                            handlers[i](null, json);
                        }
                    }
                } else if (_instance.replyHandlers[json.address]) {
                    // Might be a reply message
                    var handler = _instance.replyHandlers[json.address];
                    delete _instance.replyHandlers[json.address];
                    if (json.type === 'err') {
                        handler({ failureCode: json.failureCode, failureType: json.failureType, message: json.message });
                    } else {
                        handler(null, json);
                    }
                } else {
                    if (json.type === 'err') {
                        self.onerror(json);
                    } else {
                        try {
                            console.warn('No handler found for message: ', json);
                        } catch (e) {
                            // dev tools are disabled so we cannot use console on IE
                        }
                    }
                }
            }
        }
    }
    
    public getInstance(url?:string, options?:any): IEventBus {
        if (! EventBusImpl._instance ) {
            EventBusImpl._instance = new EventBusImpl(url, options);
        }
        return EventBusImpl._instance;
    }

    private makeUUID():string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(a, b) {
            return b = Math.random() * 16, (a == 'y' ? b & 3 | 8 : b | 0).toString(16);
        });
    }

    private mergeHeaders(defaultHeaders:any, headers:any):any {
        if (defaultHeaders) {
            if (!headers) {
                return defaultHeaders;
            }
            for (var headerName in defaultHeaders) {
                if (defaultHeaders.hasOwnProperty(headerName)) {
                    // user can overwrite the default headers
                    if (typeof headers[headerName] === 'undefined') {
                        headers[headerName] = defaultHeaders[headerName];
                    }
                }
            }
        }
        return headers || {};
    }
    
    private onopen(){
        return;
    }
    
    private onclose(){
        return;
    }
  
    private onerror(err) {
        try {
            console.error(err);
        } catch (e) {}
    };

    private sendPing() {
        EventBusImpl.sockJSConn.send(JSON.stringify({ type: 'ping' }));
    };

    /**
     * Send a message
     *
     * @param {String} address
     * @param {Object} message
     * @param {Object} [headers]
     * @param {Function} [callback]
     */  
    send(address:string, message:any, headers:any, callback:Function) {
        // are we ready?
        EventBusImpl.checkStatus();

        if (typeof headers === 'function') {
            callback = headers;
            headers = {};
        }

        var envelope:any = {
            type: MessageType.SEND,
            address: address,
            headers: _instance.mergeHeaders(this.defaultHeaders, headers),
            body: message
        };

        if (callback) {
            var replyAddress = _instance.makeUUID();
            envelope.replyAddress = replyAddress;
            this.replyHandlers[replyAddress] = callback;
        }

        EventBusImpl.sockJSConn.send(JSON.stringify(envelope));
    };

    /**
    * Publish a message
    *
    * @param {String} address
    * @param {Object} message
    * @param {Object} [headers]
   */
    publish(address:string, message:any, headers:any) {
        // are we ready?
        EventBusImpl.checkStatus();

        EventBusImpl.sockJSConn.send(JSON.stringify({
            type: MessageType.PUBLISH,
            address: address,
            headers: _instance.mergeHeaders(this.defaultHeaders, headers),
            body: message
        }));
    };

    /**
     * Register a new handler
     *
     * @param {String} address
     * @param {Object} [headers]
     * @param {Function} callback
     */
    registerHandler(address:string, headers:any, callback:Function) {
        // are we ready?
        EventBusImpl.checkStatus();

        if (typeof headers === 'function') {
            callback = headers;
            headers = {};
        }

        // ensure it is an array
        if (!this.handlers[address]) {
            this.handlers[address] = [];
            // First handler for this address so we should register the connection
            EventBusImpl.sockJSConn.send(JSON.stringify({
                type: MessageType.REGISTER,
                address: address,
                headers: _instance.mergeHeaders(this.defaultHeaders, headers)
            }));
        }

        this.handlers[address].push(callback);
    };

    /**
     * Unregister a handler
     *
     * @param {String} address
     * @param {Object} [headers]
     * @param {Function} callback
     */
    unregisterHandler(address:string, headers:any, callback:Function) {
        // are we ready?
        EventBusImpl.checkStatus();

        var handlers = this.handlers[address];

        if (handlers) {

            if (typeof headers === 'function') {
                callback = headers;
                headers = {};
            }

            var idx = handlers.indexOf(callback);
            if (idx != -1) {
                handlers.splice(idx, 1);
                if (handlers.length === 0) {
                    // No more local handlers so we should unregister the connection
                    EventBusImpl.sockJSConn.send(JSON.stringify({
                        type: MessageType.UNREGISTER,
                        address: address,
                        headers: _instance.mergeHeaders(this.defaultHeaders, headers)
                    }));

                    delete this.handlers[address];
                }
            }
        }
    };

    /**
     * Closes the connection to the EvenBus Bridge.
     */
    close() {
        EventBusImpl.state = EventBusState.CLOSING;
        EventBusImpl.sockJSConn.close();
    };
    
    private static checkStatus():void {
        if (EventBusImpl.state != EventBusState.OPEN) {
            throw new Error('INVALID_STATE_ERR');
        }
    }
}