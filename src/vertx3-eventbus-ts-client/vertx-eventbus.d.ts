declare var vertx:Vertx;

declare module 'vertx.io-eventbus' {
    export= vertx;
}

interface Vertx { 
    sendPing():void ;
    send(address:string, message:any, headers?:any, callback?:Function) : void;
    publish(address:string, message:any, headers?:any): void;
    registerHandler(address:string, headers:any, callback:Function):void;
    unregisterHandler(address:string, headers:any, callback:Function):void;
    close():void;
}