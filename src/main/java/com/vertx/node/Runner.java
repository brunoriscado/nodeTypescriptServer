package com.vertx.node;

import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import io.vertx.service.ServiceVerticleFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.CountDownLatch;

/**
 * Created by jose on 10/02/16.
 */
public class Runner {

    private static final Logger LOGGER = LoggerFactory.getLogger(Runner.class);

    public static void main(String[] args) throws Exception {
        LOGGER.info("Runner started");
        DeploymentOptions deploymentOptions =  new DeploymentOptions();
        VertxOptions vertxOptions = new VertxOptions();
        Vertx vertx = Vertx.vertx(vertxOptions);
        vertx.registerVerticleFactory(new ServiceVerticleFactory());
        CountDownLatch latch = new CountDownLatch(1);
        vertx.deployVerticle("service:com.vertx.node.TestVerticle", deploymentOptions, result -> {
            if (result.succeeded()) {
                latch.countDown();
            }
            else {
                LOGGER.error("Error starting DMP-Manager", result.cause());
                throw new RuntimeException(result.cause());
            }
        });
        latch.await();
    }
}
