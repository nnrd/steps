'use strict';
const crypto = require('crypto');

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
            console.error(error);
            return true;
        },

        getVars() {
            return {};
        },
    };
};

module.exports ={
    getHash,
    withLock,
    getRun,
};
