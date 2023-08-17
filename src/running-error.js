'use strict';

class StepRunningError extends Error {
    constructor(name, hash) {
        super('Step is already running');

        this.name = name;
        this.hash = hash;
    }

}

module.exports = StepRunningError;
