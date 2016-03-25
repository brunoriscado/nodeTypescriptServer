package com.vertx.node;

import org.junit.Assert;
import org.junit.Test;

import java.util.regex.Pattern;

/**
 * Created by jose on 25/03/16.
 */
public class TestRegex {

    @Test
    public void testReguexSocket() {
        Pattern pattern = Pattern.compile(TestVerticle.TEST_REGEX);
        Assert.assertTrue(pattern.matcher(TestVerticle.TEST_SERVICE).matches());
        Assert.assertTrue(pattern.matcher(TestVerticle.TEST_HANDLER).matches());
    }

}
