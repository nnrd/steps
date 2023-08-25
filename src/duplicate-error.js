'use strict';

class StepDuplicateError extends Error {
    constructor(name) {
        super('Step is already defined');

        this.name = name;
    }
}

module.exports = StepDuplicateError;
