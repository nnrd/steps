'use strict';
const crypto = require('crypto');
const DummyLogger = require('./dummy-logger');

const make = (options) => {
    const logger = options?.logger || DummyLogger;

    const getHash = (name, data) => {
        const serialized = name + JSON.stringify(data || '');
        var shasum = crypto.createHash('sha1');
        shasum.update(serialized);
        return shasum.digest('hex');
    };

    const withLock = (name, fn) => {
        return fn();
    };

    const getRun = (name, hash) => {
        return {
            isDone() {
                return false;
            },

            isRunning() {
                return false;
            },

            markDone(output) {
                return true;
            },

            markFailed(error) {
                logger.error(error);
                return true;
            },

            getVars() {
                return {};
            },
        };
    };

    return {
        getHash,
        withLock,
        getRun,
    };
};

module.exports = {
    make,
};
