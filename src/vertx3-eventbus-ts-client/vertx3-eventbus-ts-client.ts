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


var _instance:EvenBusImpl;

export = EvenBusImpl;

class EvenBusImpl implements IEventBus {

    public static _instance:EvenBusImpl;
    private  options: any;
    private pingInterval: number = 5000;
    private pingTimerID;
    public sockJSConn: any;
    private state:EventBusState = EventBusState.CONNECTING;
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
        _instance = this;
        this.sockJSConn = new SockJs(url, null, options);

        this.sockJSConn.onopen = function() {
            _instance.sendPing();
            _instance.pingTimerID = setInterval(_instance.sendPing, _instance.pingInterval);
            _instance.state = EventBusState.OPEN;
            _instance.onopen();
        };
        
        
        this.sockJSConn.onclose = function() {
            _instance.state = EventBusState.CLOSED;
            if (_instance.pingTimerID) clearInterval(_instance.pingTimerID);
            _instance.onclose();
        };
        
        this.sockJSConn.onmessage = function(e) {
            var json = JSON.parse(e.data);

            // define a reply function on the message itself
            if (json.replyAddress) {
                Object.defineProperty(json, 'reply', {
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

    makeUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(a, b) {
            return b = Math.random() * 16, (a == 'y' ? b & 3 | 8 : b | 0).toString(16);
        });
    }

    mergeHeaders(defaultHeaders, headers) {
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
    
    onopen(){
        return;
    }
    
    onclose(){
        return;
    }
  
    onerror(err) {
        try {
            console.error(err);
        } catch (e) {}
    };

    sendPing() {
        _instance.sockJSConn.send(JSON.stringify({ type: 'ping' }));
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
        if (this.state != EventBusState.OPEN) {
            throw new Error('INVALID_STATE_ERR');
        }

        if (typeof headers === 'function') {
            callback = headers;
            headers = {};
        }

        var envelope:any = {
            type: 'send',
            address: address,
            headers: _instance.mergeHeaders(this.defaultHeaders, headers),
            body: message
        };

        if (callback) {
            var replyAddress = _instance.makeUUID();
            envelope.replyAddress = replyAddress;
            this.replyHandlers[replyAddress] = callback;
        }

        this.sockJSConn.send(JSON.stringify(envelope));
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
        if (this.state != EventBusState.OPEN) {
            throw new Error('INVALID_STATE_ERR');
        }

        this.sockJSConn.send(JSON.stringify({
            type: 'publish',
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
        if (this.state != EventBusState.OPEN) {
            throw new Error('INVALID_STATE_ERR');
        }

        if (typeof headers === 'function') {
            callback = headers;
            headers = {};
        }

        // ensure it is an array
        if (!this.handlers[address]) {
            this.handlers[address] = [];
            // First handler for this address so we should register the connection
            this.sockJSConn.send(JSON.stringify({
                type: 'register',
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
        if (this.state != EventBusState.OPEN) {
            throw new Error('INVALID_STATE_ERR');
        }

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
                    this.sockJSConn.send(JSON.stringify({
                        type: 'unregister',
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
        this.state = EventBusState.CLOSING;
        this.sockJSConn.close();
    };
}