package com.vertx.node;

import io.vertx.core.json.Json;

import java.util.UUID;

/**
 * Created by jose on 25/03/16.
 */
public class TestModel {

    private String uuid;
    private long   time;

    public TestModel(){
        this.uuid = UUID.randomUUID().toString();
        this.time = System.currentTimeMillis();
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public long getTime() {
        return time;
    }

    public void setTime(long time) {
        this.time = time;
    }

    public String toJson(){
        return Json.encode(this);
    }
}
