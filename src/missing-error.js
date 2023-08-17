'use strict';

class StepMissingError extends Error {
    constructor(name) {
        super('Step is not defined');

        this.name = name;
    }

}

module.exports = StepMissingError;
