'use strict';

const StepRunningError = require('./running-error');
const DummyDriver = require('./dummy-driver');
const DummyLogger = require('./dummy-logger');
const NativeLogger = require('./native-logger');

const DEFAULT_LOCK_PREFIX = 'STEP';
const DEFAULT_LOCK_DELIMITER = '/';
const DEFAULT_NAME_DELIMITER = '/';

const create = (options) => {
    const logger = options?.logger || (options?.debug ? NativeLogger : DummyLogger);
    const driver = options?.driver || DummyDriver.make({logger});
    const lockPrefix = options?.lockPrefix || DEFAULT_LOCK_PREFIX;
    const lockDelimiter = options?.lockDelimiter || DEFAULT_LOCK_DELIMITER;
    const nameDelimiter = options?.lockDelimiter || DEFAULT_NAME_DELIMITER;

    const make = (namePrefix = '', rootHash = '') => {
        const steps = [];

        const composeLockName = (name, hash) => `${lockPrefix}${lockDelimiter}${name}${lockDelimiter}${hash}`;
        const composeStepName = (name) => namePrefix ? `${namePrefix}${nameDelimiter}${name}` : name;

        const get = async (names, data) => {
            const name = names.join(nameDelimiter);
            const hash = driver.getHash(name, data);
            const stepRun = await driver.getRun(name, hash);
            return stepRun;
        };

        const add = (stepName, stepFn) => {
            const name = composeStepName(stepName);

            const fn = async (data) => {
                const hash = driver.getHash(name, data);
                if (!rootHash) rootHash = hash;

                return await driver.withLock(composeLockName(name, hash), async() => {
                    const existingRun = await driver.getRun(name, hash, rootHash);

                    if (existingRun.isDone()) {
                        return existingRun.getOutput();

                    } else if (existingRun.isRunning()) {
                        throw new StepRunningError(name, hash);
                    } else { // New or Failed
                        try {
                            const vars = await existingRun.getVars();
                            logger.debug('START', name, hash, rootHash);
                            const output = await stepFn(data, make(name, rootHash || hash), vars);
                            logger.debug('DONE', name, hash, rootHash);
                            const marked = await existingRun.markDone(output);
                            if (!marked) {
                                logger.error({
                                    message: 'Unable to mark step done',
                                    name,
                                    hash,
                                    rootHash,
                                });
                            }
                            return output;
                        } catch(error) {
                            const marked = await existingRun.markFailed(error);
                            if (!marked) {
                                logger.error({
                                    message: 'Unable to mark step failed',
                                    name,
                                    hash,
                                    rootHash,
                                });
                            }
                            throw error;
                        }
                    }
                });
            };

            steps.push(fn);
        };

        const addFile = (stepName, fileName) => {
            const stepFn = require(fileName);
            return add(stepName, stepFn);
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
            addFile,
            chain,
            batch,
            get,
        };
    };

    return {
        make,
    };
};

module.exports = {
    create,
};
