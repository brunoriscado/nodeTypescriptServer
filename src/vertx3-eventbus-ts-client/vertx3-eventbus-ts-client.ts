/// <reference path="../../typings/main.d.ts" />

import * as SockJS from 'sockjs-client';
import * as Vertx from 'vertx.io-eventbus';

module EventBus {

    enum EventBusState{
        CONNECTING,
        OPEN,
        CLOSING,
        CLOSED
    }

    class Handler {
        constructor(public id:string, public callback:Function){}
    }
    
    class Envelope {
        constructor(type:string, address?:string, headers?:Array<{key:string, any}>,
                    body?:any){}
    }
    
    export default class VertxImpl implements Vertx {

        private static _instance:Vertx;
        
        private static state:EventBusState = EventBusState.CLOSED;
        private static sockJSConn:__SockJSClient.SockJSClass;
        private static defaultHeaders:Array<{key:string, any}>
        
        private static handlers:Array<Handler>=new Array();
        private static replyHandlers:Array<Handler>=new Array();
        
        
        
        constructor(url:string){
            if (VertxImpl.state == EventBusState.CLOSED) {
                
                
            }
        }
        
        public sendPing():void {
            //VertxImpl._instance.send(JSON.stringify({type:'ping'}));
            let _fullMessage = this.factoryMessage('send', undefined, undefined, JSON.stringify({type:'ping'}));
        }
        public send(address?:string, message?:any, headers?:Array<{key:string, any}>, callback?:Function) : void {
            this.checkStatus();
            let _envelope:Envelope = this.factoryMessage('send',address,headers, message);
            if (callback){
                let _handler:Handler = new Handler(this.makeUUID(),callback);
                VertxImpl.replyHandlers.push(_handler);
            }
            VertxImpl.sockJSConn.send(JSON.stringify(_envelope));
        }
        
        public publish(address:string, message:any, headers?:any): void {
            this.checkStatus();
            let _envelope = this.factoryMessage('publish', address, headers, message);
            VertxImpl.sockJSConn.send(JSON.stringify(_envelope));
        }
        
        public registerHandler(address:string, headers:Array<{key:string, any}>, callback:Function):void {
            this.checkStatus();
            let _handler 
            if (! VertxImpl.handlers[address]) {
                VertxImpl.handlers[address] = callback;                
                let _envelope = this.factoryMessage
        
            }
            VertxImpl.handlers[address].push(callback);
            
        }
        
        public unregisterHandler(address:string, headers:any, callback:Function):void {}
        public close():void {}
        

        
        private factoryMessage(type:string, address?:string, headers?:Array<{key:string, any}>, body?:any): Envelope {
            let _headers:Array<{key:string, any}> = this.mergeHeaders(VertxImpl.defaultHeaders, headers);
            let envelope = new Envelope(type, address, _headers, body);
            return envelope;
        }
        
        private checkStatus(){
            if (VertxImpl.state != EventBusState.OPEN) {
                throw new Error('INVALID_STATE_ERR');
            }
        }
        
        private mergeHeaders(defaultHeaders?:Array<{key:string, any}>, headers?:Array<{key:string, any}>): Array<{key:string, any}> {
            if (defaultHeaders && !headers){
                return defaultHeaders
            }
            for (let headerName in defaultHeaders){
                if (!(headers[headerName])) {
                    headers[headerName] = defaultHeaders[headerName];
                }
            }
            return headers || [] ;            
        }
        
        private makeUUID():string {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (a, b) {
            return b = Math.random() * 16, (a == 'y' ? b & 3 | 8 : b | 0).toString(16);
            });
        }
        
        
        
    }
    
    
    
    
    
 
    
}