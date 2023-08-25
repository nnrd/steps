'use strict';

const DummyStorageHandler = require('./src/dummy-storage-handler');
const DummyLockHandler = require('./src/dummy-lock-handler');
const StepperFactory = require('./src/stepper');

module.exports = {
    DummyStorageHandler,
    DummyLockHandler,
    StepperFactory,
};
