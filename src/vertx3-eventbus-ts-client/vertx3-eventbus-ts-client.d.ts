declare module 'Vertx' {

    interface IEventBus {
        /**
         * Send a message
         *
         * @param {String} address
         * @param {Object} message
         * @param {Object} [headers]
         * @param {Function} [callback]
         */
        send(address: string, message: any, headers: any, callback: Function): void;
        /**
        * Publish a message
        *
        * @param {String} address
        * @param {Object} message
        * @param {Object} [headers]
    */
        publish(address: string, message: any, headers: any): void;
        /**
         * Register a new handler
         *
         * @param {String} address
         * @param {Object} [headers]
         * @param {Function} callback
         */
        registerHandler(address: string, headers: any, callback: Function): void;
        /**
         * Unregister a handler
         *
         * @param {String} address
         * @param {Object} [headers]
         * @param {Function} callback
         */
        unregisterHandler(address: string, headers: any, callback: Function): void;
        /**
         * Closes the connection to the EvenBus Bridge.
         */
        close(): void;
    }
}
