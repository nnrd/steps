'use strict';
const DummyLogger = require('./dummy-logger');

const make = (options) => {
    const logger = options?.logger || DummyLogger;

    const withLock = (name, fn) => {
        return fn();
    };

    return {
        withLock,
    };
};

module.exports = {
    make,
};
