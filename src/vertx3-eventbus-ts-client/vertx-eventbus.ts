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
/// <reference path="../../typings/main.d.ts" />
import * as SockJS from 'sockjs-client';
import * as Vertx from 'vertx.io-eventbus';

enum EventBusState{
       CONNECTING,
       OPEN,
       CLOSING,
       CLOSED
}

interface Handler {
    [index:string]:any;
}

export default class EventBus implements Vertx {
    
    private static _url:string;
    private static _uniqueInstance:EventBus;
    private static _socket:__SockJSClient.SockJSClass;
    private defaultHeaders: {[key:string]:string};
    private pingInterval:number = 55000;
    private pingTimerID:NodeJS.Timer;
    private static state:EventBusState;
    private handlers:Array<Handler>;
    private replyHandlers:Array<Handler>;
    
    
    constructor(options?:any, private callbackOnOpen?:Function, private callbackOnClose?:Function){
        if (EventBus._url){
                
                    EventBus.state = EventBusState.CONNECTING;
                    EventBus._socket =new SockJS(EventBus._url);
                    if (options && options.vertxbus_ping_interval){
                        this.pingInterval = options.vertxbus_ping_interval;
                    }
                    
                    EventBus._socket.onopen = function(){
                        this.pingTimerID = setInterval(function(){
                            EventBus._socket.send(JSON.stringify("{type:\'ping\'}"));
                        }, this.pingInterval);
                        EventBus.state = EventBusState.OPEN;
                    };
                    
                    EventBus._socket.onclose = function() {
                        EventBus.state=EventBusState.CLOSED;
                        if (this.pingTimerID){
                            clearInterval(this.pingTimerID);
                            this.onClose(callbackOnClose);
                        }
                    };
                    
                    EventBus._socket.onmessage = function (e:any) {
                        let json = JSON.parse(e.data);
                        if (json.replyAddress){
                            Object.defineProperty(json, 'reply', {
                                value: function (message, headers, callback) {
                                    this.send(json.replyAddress, message, headers, callback);
                                }
                            });
                        }
                        
                        if (this.handlers[json.address]) {
                            var handlers = this.handlers[json.address];
                            for (var i = 0; i < handlers.length; i++) {
                            if (json.type === 'err') {
                                handlers[i]({failureCode: json.failureCode, failureType: json.failureType, message: json.message});
                            } else {
                                handlers[i](null, json);
                            }
                            }
                        } else if (this.replyHandlers[json.address]) {
                            var handler = this.replyHandlers[json.address];
                            delete this.replyHandlers[json.address];
                            if (json.type === 'err') {
                                handler({failureCode: json.failureCode, failureType: json.failureType, message: json.message});
                            } else {
                                handler(null, json);
                            }
                        } else {
                            if (json.type === 'err') {
                                this.onerror(json);
                            } else {
                                try {
                                    console.warn('No handler found for message: ', json);
                                } catch (e) {
                                    // dev tools are disabled so we cannot use console on IE
                                }
                            }
                        }
                        
                    };
                    
        }
    }
    
    public static getInstance(url?:string, options?:any, callbackOnOpen?:Function, callbackOnClose?:Function) : EventBus {
        if (EventBus._url==null){
            EventBus._url = url;
            EventBus._uniqueInstance = new EventBus(options, callbackOnOpen, callbackOnClose);
        }
        return EventBus._uniqueInstance;
    }
    
    public makeUUID():string {
         return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
                .replace(/[xy]/g,function (a, b) {
                                    return b = Math.random() * 16, (a == 'y' ? b & 3 | 8 : b | 0).toString(16);
                                }
                );
    }
    
    public mergeHeaders(defaultHeaders:any , headers:any ): any {
        if (defaultHeaders && !headers){
            return defaultHeaders;
        }
        for(var headerName in defaultHeaders) {
            if (headers[headerName]===undefined){
                headers[headerName]=defaultHeaders[headerName];
            }
        }
        return headers || {};        
    }
    
    public sendPing():void {
        EventBus._socket.send(JSON.stringify("{type:\'ping\'}"));
    }
    
    public send(address:string, message:any, headers?:any, callback?:Function) : void {
        
        this.checkEventBusOpen();
        
        var _callback:Function;
        if (headers instanceof Function) {
            _callback = headers;
            headers = {};
        }
        
        var envelope = {
            type: 'send',
            address: address,
            headers: this.mergeHeaders(this.defaultHeaders, headers),
            body: message,
            replyAddress
        };
        
        if (callback) {
            var replyAddress = this.makeUUID();
            envelope.replyAddress = replyAddress;
            this.replyHandlers[replyAddress] = callback;
        }
        
        EventBus._socket.send(JSON.stringify(envelope));
    }
    
    public publish(address:string, message:any, headers?:any): void {
        this.checkEventBusOpen();
        EventBus._socket.send(
               JSON.stringify({
                   type: 'publish',
                   address: address,
                   headers: this.mergeHeaders(this.defaultHeaders, headers),
                   body: message
               })
        );
    }
    
    public registerHandler(address:string, headers:any, callback:Function):void {
        
        this.checkEventBusOpen();
        
        if (headers instanceof Function) {
            callback = headers;
            headers = {};
        }
        
        if (!this.handlers[address]){
            this.handlers[address] = [];
            EventBus._socket.send(
                JSON.stringify({
                    type: 'register',
                    address: address,
                    headers: this.mergeHeaders(this.defaultHeaders, headers)
                })
            );
        }
        this.handlers[address].push(callback);
    }
    
    public unregisterHandler(address:string, headers:any, callback:Function):void {
      this.checkEventBusOpen();
      if (headers instanceof Function) {
          callback = headers;
          headers = {};
      }
        
      var idx = this.handlers.indexOf(callback);
      if (idx != -1) {
        this.handlers.splice(idx, 1);
        if (this.handlers.length === 0) {
          EventBus._socket.send(JSON.stringify({
            type: 'unregister',
            address: address,
            headers: this.mergeHeaders(this.defaultHeaders, headers)
          }));
          delete this.handlers[address];
        }
      }
    }
    
    public onerror(err:Error):void {
       try{
           console.error(err);
       } catch(e){}
    }
    
    public close() : void {
        EventBus.state = EventBusState.CLOSING;
        EventBus._socket.close();
    }
    
    
    private onOpen(callback?:Function):any{
        if (callback){
            return setTimeout(callback, 0);
        }
        return;        
    }
    
    private onClose(callback?:Function):any{
        if (callback){
            return setTimeout(callback, 0);
        }
        return;        
    }
    
    private checkEventBusOpen():void{
        EventBus.state = EventBusState.OPEN;
        if (EventBus.state != EventBusState.OPEN ) {
            throw new Error('INVALID_STATE_ERR');
        }
    }
    
}