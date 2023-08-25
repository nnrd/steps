'use strict';

class StepMarkError extends Error {
    constructor(name, hash, rootHash, mark) {
        super('Unable to mark step');

        this.name = name;
        this.hash = hash;
        this.rootHash = rootHash;
        this.mark = mark;
    }
}

module.exports = StepMarkError;
