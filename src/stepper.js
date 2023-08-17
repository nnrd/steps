'use strict';

const StepRunningError = require('./running-error');
const DummyDriver = require('./dummy-driver');
const DummyLogger = require('./native-logger');

const DEFAULT_LOCK_PREFIX = 'STEP';
const DEFAULT_LOCK_DELIMITER = '/';
const DEFAULT_NAME_DELIMITER = '/';

const create = (options) => {
    const driver = options?.driver || DummyDriver;
    const logger = options?.logger || DummyLogger;
    const lockPrefix = options?.lockPrefix || DEFAULT_LOCK_PREFIX;
    const lockDelimiter = options?.lockDelimiter || DEFAULT_LOCK_DELIMITER;
    const nameDelimiter = options?.lockDelimiter || DEFAULT_NAME_DELIMITER;

    const make = (namePrefix = '') => {
        const steps = [];

        const composeLockName = (name, hash) => `${lockPrefix}${lockDelimiter}${name}${lockDelimiter}${hash}`;
        const composeStepName = (name) => namePrefix ? `${namePrefix}${nameDelimiter}${name}` : name;


        const add = (stepName, stepFn) => {
            const name = composeStepName(stepName);
            logger.debug('NAME', name);

            const fn = async (data) => {
                const hash = driver.getHash(name, data);
                logger.debug('HASH', hash);

                return await driver.withLock(composeLockName(name, hash), async() => {
                    const existingRun = await driver.getRun(name, hash);

                    if (existingRun.isDone()) {
                        return existingRun.getOutput();

                    } else if (existingRun.isRunning()) {
                        throw new StepRunningError(name, hash);
                    } else { // New or Failed
                        try {
                            const vars = await existingRun.getVars();
                            const output = await stepFn(data, make(name), vars);
                            await existingRun.markDone(output);
                            return output;
                        } catch(error) {
                            await existingRun.markFailed(error);
                            throw error;
                        }
                    }
                });
            };

            steps.push(fn);
        };

        const chain = async (data) => {
            for(const step of steps) {
                data = await step(data);
            }

            return data;
        };

        const batch = async (data) => {
            return await Promise.all(steps.map(fn => fn(data)));
        };

        return {
            add,
            chain,
            batch,
        };
    };

    return {
        make,
    };
};

module.exports = {
    create,
};
