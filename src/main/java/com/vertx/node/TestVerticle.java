package com.vertx.node;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.Json;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This gets started by the MainVerticle.
 * It configures the event bus bridge and install the REST routes.
 */
public class TestVerticle extends AbstractVerticle {

    private static final String SERVICE_PING = "ping";
    private static final String SERVICE_ADDRESS = "TEST-SERVICE";
    private final Logger LOGGER = LoggerFactory.getLogger(TestVerticle.class);

    @Override
    public void start() {

        final Router router = Router.router(vertx);
        router.route("/eventbus/*").handler(createSocketJSHandler());

        vertx.eventBus().consumer(SERVICE_ADDRESS, event -> {
            System.out.println("A event into the service address... ");
            event.reply(Json.encode("{\"time\":\""+System.currentTimeMillis()+"\"}"));
        });

        vertx.eventBus().consumer(SERVICE_PING, event -> {
            System.out.println("incoming ping... ");
            event.reply(Json.encode("{\"pong\":\""+System.currentTimeMillis()+"\"}"));
        });

        vertx.createHttpServer()
                .requestHandler(router::accept)
                .listen(8089);
    }

    private SockJSHandler createSocketJSHandler() {

        PermittedOptions permittedOptions = new PermittedOptions().setAddress(SERVICE_ADDRESS);
        BridgeOptions options = new BridgeOptions()
                .addInboundPermitted(permittedOptions)
                .addOutboundPermitted(permittedOptions);
        return SockJSHandler.create(vertx).bridge(options, event -> {
                                            LOGGER.info("A socket was created");
                                            event.complete(true);
                                    });
    }

}
