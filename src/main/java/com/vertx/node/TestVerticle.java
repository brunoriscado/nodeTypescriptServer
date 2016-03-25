package com.vertx.node;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.Json;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.sockjs.BridgeOptions;
import io.vertx.ext.web.handler.sockjs.PermittedOptions;
import io.vertx.ext.web.handler.sockjs.SockJSHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * This gets started by the MainVerticle.
 * It configures the event bus bridge and install the REST routes.
 */
public class TestVerticle extends AbstractVerticle {

    public static final String TEST_REGEX = "^TEST.*";
    public static final String TEST_SERVICE = "TEST-SERVICE";
    public static final String TEST_HANDLER = "TEST-HANDLER";


    private final Logger LOGGER = LoggerFactory.getLogger(TestVerticle.class);

    @Override
    public void start() {

        final Router router = Router.router(vertx);
        router.route("/eventbus/*").handler(createSocketJSHandler());

        vertx.eventBus().consumer(TEST_SERVICE, event -> {
            System.out.println("A event into the service address... ");
            event.reply(Json.encode("{\"time\":\""+System.currentTimeMillis()+"\"}"));
        });

        // Send a message every second
        vertx.setPeriodic(1000, v -> {
            vertx.eventBus().send(TEST_HANDLER, testHandler());
            System.out.println("booom... "+System.currentTimeMillis());
        });

        vertx.createHttpServer()
                .requestHandler(router::accept)
                .listen(8089);
    }

    private JsonArray testHandler() {
        JsonArray test_handler = new JsonArray();
        for (int i=0 ; i<10; i++) {
            test_handler.add(new TestModel().toJson());
        }
        return test_handler;
    }

    private SockJSHandler createSocketJSHandler() {

        PermittedOptions permittedOptions = new PermittedOptions().setAddressRegex(TEST_REGEX);
        BridgeOptions options = new BridgeOptions()
                .addInboundPermitted(permittedOptions)
                .addOutboundPermitted(permittedOptions);

        return SockJSHandler.create(vertx).bridge(options, event -> {
                                            LOGGER.info("A socket was created");
                                            event.complete(true);
                                    });
    }


}
