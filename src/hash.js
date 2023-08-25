'use strict';
const crypto = require('crypto');

const make = (options) => {
    const getHash = (name, data) => {
        const serialized = name + JSON.stringify(data || '');
        var shasum = crypto.createHash('sha1');
        shasum.update(serialized);
        return shasum.digest('hex');
    };

    return {
        getHash,
    };
};

module.exports = {
    make,
};
