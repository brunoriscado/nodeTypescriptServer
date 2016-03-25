/// <reference path="vertx3-ts-client.d.ts" />
import SockJs = require("sockjs-client");
// import an interface from a modern module
import { IEventBus } from 'EventBus';


export module Vertx {

    enum EventBusState {
        CONNECTING,
        OPEN,
        CLOSING,
        CLOSED
    }
    
    var MessageType = {
            REPLY:"reply",
            SEND: "send",
            PUBLISH: "publish",
            REGISTER: "register",
            UNREGISTER: "unregister"
    };
    

    export class EventBusImpl implements IEventBus {

        private static _instance: EventBusImpl;
        private static sockJSConn: __SockJSClient.SockJSClass;
        private static state: EventBusState = EventBusState.CONNECTING;

        
        private static pingInterval: number = 5000;
        private static pingTimerID: number;

        private options: any;
        private handlers = {};
        private replyHandlers = {};
        private defaultHeaders = null;
        
        private onOpen:Function;
        private onMessage:Function;
        private onClose:Function;


        constructor(url: string, options?: any, onOpen?:Function, onMessage?:Function, onClose?:Function) {

            if (! EventBusImpl._instance ) {
                EventBusImpl._instance = this;
                EventBusImpl._instance.onOpen = onOpen;
                EventBusImpl._instance.onMessage = onMessage;
                EventBusImpl._instance.onClose = onClose;
                EventBusImpl.sockJSConn = new SockJs(url, null, options);
                EventBusImpl.sockJSConn.onopen = function() {
                    EventBusImpl.sendPing();
                    EventBusImpl.pingTimerID = setInterval(EventBusImpl.sendPing, EventBusImpl.pingInterval);
                    EventBusImpl.state = EventBusState.OPEN;
                    if (onOpen) {
                        EventBusImpl._instance.onOpen=onOpen;    
                        EventBusImpl._instance.onOpen();
                    }
                    
                };

                EventBusImpl.sockJSConn.onclose = function() {
                    EventBusImpl.state = EventBusState.CLOSED;
                    if (EventBusImpl.pingTimerID) clearInterval(EventBusImpl.pingTimerID);
                    if (onClose) {
                        EventBusImpl._instance.onClose=onClose;
                        EventBusImpl._instance.onClose();    
                    }
                    
                };

                EventBusImpl.sockJSConn.onmessage = function(e) {
                    var json = JSON.parse(e.data);
                    // define a reply function on the message itself
                    if (json.replyAddress) {
                        Object.defineProperty(json, MessageType.REPLY, {
                            value: function(message, headers, callback) {
                                EventBusImpl._instance.send(json.replyAddress, message, headers, callback);
                            }
                        });
                    }

                    if (EventBusImpl._instance.handlers[json.address]) {
                        // iterate all registered handlers
                        var handlers = EventBusImpl._instance.handlers[json.address];
                        for (var i = 0; i < handlers.length; i++) {
                            if (json.type === 'err') {
                                handlers[i]({ failureCode: json.failureCode, failureType: json.failureType, message: json.message });
                            } else {
                                handlers[i](null, json);
                            }
                        }
                    } else if (EventBusImpl._instance.replyHandlers[json.address]) {
                        // Might be a reply message
                        var handler = EventBusImpl._instance.replyHandlers[json.address];
                        delete EventBusImpl._instance.replyHandlers[json.address];
                        if (json.type === 'err') {
                            handler({ failureCode: json.failureCode, failureType: json.failureType, message: json.message });
                        } else {
                            handler(null, json);
                        }
                    } else {
                        if (json.type === 'err') {
                            EventBusImpl._instance.onError(json);
                        } else {
                            try {
                                console.warn('No handler found for message: ', json);
                            } catch (e) {
                                // dev tools are disabled so we cannot use console on IE
                            }
                        }
                    }
                    
                    if (EventBusImpl._instance.onMessage) {
                        EventBusImpl._instance.onMessage(e);
                    }
                }
            }
        }

        /**
         * Create or get an instance
         *
         * @param {String} url
         * @param {Object} options
         */
        public static getInstance(url?: string, options?: any, onOpen?:Function, onMessage?:Function, onClose?:Function): IEventBus {
            if (! EventBusImpl._instance ) {
                EventBusImpl._instance = new EventBusImpl(url, options, onOpen,onMessage, onClose);
            }
            return (<IEventBus> EventBusImpl._instance);
        };

        /**
         * Send a message
         *
         * @param {String} address
         * @param {Object} message
         * @param {Object} [headers]
         * @param {Function} [callback]
         */
        send(address: string, message: any, headers?: any, callback?: Function): void {
            // are we ready?
            EventBusImpl.checkStatus();

            if (!headers) headers = {};

            var envelope: any = {
                type: MessageType.SEND,
                address: address,
                headers: EventBusImpl.mergeHeaders(EventBusImpl._instance.defaultHeaders, headers),
                body: message
            };

            if (callback) {
                var replyAddress = EventBusImpl.makeUUID();
                envelope.replyAddress = replyAddress;
                EventBusImpl._instance.replyHandlers[replyAddress] = callback;
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
        publish(address: string, message: any, headers?: any): void {
            // are we ready?
            EventBusImpl.checkStatus();

            if (!headers) headers = {};

            EventBusImpl.sockJSConn.send(JSON.stringify({
                type: MessageType.PUBLISH,
                address: address,
                headers: EventBusImpl.mergeHeaders(EventBusImpl._instance.defaultHeaders, headers),
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
        registerHandler(address: string, headers: any, callback: Function): void {
            // are we ready?
            EventBusImpl.checkStatus();

            if (!headers) headers = {};

            // ensure it is an array
            if ( ! EventBusImpl._instance.handlers[address] ) {
                EventBusImpl._instance.handlers[address] = [];
                // First handler for this address so we should register the connection
                EventBusImpl.sockJSConn.send(JSON.stringify({
                    type: MessageType.REGISTER,
                    address: address,
                    headers: EventBusImpl.mergeHeaders(EventBusImpl._instance.defaultHeaders, headers)
                }));
            }

            EventBusImpl._instance.handlers[address].push(callback);
        };

        /**
         * Unregister a handler
         *
         * @param {String} address
         * @param {Object} [headers]
         * @param {Function} callback
         */
        unregisterHandler(address: string, headers: any, callback: Function): void {
            // are we ready?
            EventBusImpl.checkStatus();

            var handlers = EventBusImpl._instance.handlers[address];

            if (handlers) {

                if (!headers) headers = {};

                var idx = handlers.indexOf(callback);
                if (idx != -1) {
                    handlers.splice(idx, 1);
                    if (handlers.length === 0) {
                        // No more local handlers so we should unregister the connection
                        EventBusImpl.sockJSConn.send(JSON.stringify({
                            type: MessageType.UNREGISTER,
                            address: address,
                            headers: EventBusImpl.mergeHeaders(EventBusImpl._instance.defaultHeaders, headers)
                        }));

                        delete EventBusImpl._instance.handlers[address];
                    }
                }
            }
        };
        /**
         * Closes the connection to the EvenBus Bridge.
         */
        close(): void {
            EventBusImpl.state = EventBusState.CLOSING;
            EventBusImpl.sockJSConn.close();
            EventBusImpl.state = EventBusState.CLOSED;
            if (EventBusImpl._instance.onClose){
                EventBusImpl._instance.onClose();    
            }
        };
        
        
        onError(e:any) : void {
            console.error(JSON.stringify(e));
            throw new Error(e);
        };
        

        private static checkStatus(): void {
            if (EventBusImpl.state != EventBusState.OPEN) {
                throw new Error('INVALID_STATE_ERR');
            }
        }


        private static sendPing() {
            EventBusImpl.sockJSConn.send(JSON.stringify({ type: 'ping' }));
        };


        private static makeUUID(): string {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(a, b) {
                return b = Math.random() * 16, (a == 'y' ? b & 3 | 8 : b | 0).toString(16);
            });
        }

        private static mergeHeaders(defaultHeaders: any, headers: any): any {
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
    }
}

