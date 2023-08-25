'use strict';

const StepRunningError = require('./running-error');
const StepMissingError = require('./missing-error');
const StepDuplicateError = require('./duplicate-error');
const Hash = require('./hash');
const DummyDriver = require('./dummy-driver');
const DummyLogger = require('./dummy-logger');
const NativeLogger = require('./native-logger');

const DEFAULT_LOCK_PREFIX = 'STEP';
const DEFAULT_LOCK_DELIMITER = '/';
const DEFAULT_NAME_DELIMITER = '/';

const create = (options) => {
    const logger = options?.logger || (options?.debug ? NativeLogger : DummyLogger);
    const driver = options?.driver || DummyDriver.make({logger});
    const hasher = options?.hash || Hash.make();
    const lockPrefix = options?.lockPrefix || DEFAULT_LOCK_PREFIX;
    const lockDelimiter = options?.lockDelimiter || DEFAULT_LOCK_DELIMITER;
    const nameDelimiter = options?.lockDelimiter || DEFAULT_NAME_DELIMITER;

    const beforeStepHook = options?.hooks?.beforeStep;
    const afterStepHook = options?.hooks?.afterStep;
    const aroundStepHook = options?.hooks?.aroundStep;

    const beforeExecHook = options?.hooks?.beforeExec;
    const afterExecHook = options?.hooks?.afterExec;
    const aroundExecHook = options?.hooks?.aroundExec;


    const make = (namePrefix = '', rootHash = '') => {
        const steps = [];
        const stepsLookup = new Map;

        const composeLockName = (name, hash) => `${lockPrefix}${lockDelimiter}${name}${lockDelimiter}${hash}`;
        const composeStepName = (name) => namePrefix ? `${namePrefix}${nameDelimiter}${name}` : name;

        const get = async (names, data) => {
            const name = names.join(nameDelimiter);
            const hash = hasher.getHash(name, data);
            const stepRun = await driver.getRun(name, hash);
            return stepRun;
        };

        const add = (stepName, stepFn) => {
            const name = composeStepName(stepName);

            if (stepsLookup.has(name)) {
                throw new StepDuplicateError(name);
            }

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

                            if (beforeStepHook) await beforeStepHook(name, data, hash, rootHash, vars);

                            //logger.debug('START', name, hash, rootHash);
                            const output = aroundStepHook
                                  ? await aroundStepHook(async () => await stepFn(data, make(name, rootHash), vars), name, data, hash, rootHash, vars)
                                  : await stepFn(data, make(name, rootHash), vars);
                            //logger.debug('DONE', name, hash, rootHash);

                            if (afterStepHook) await afterStepHook(name, data, hash, rootHash, vars, output);

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
            stepsLookup.set(name, fn);
        };

        const addFile = (stepName, fileName) => {
            const stepFn = require(fileName);
            return add(stepName, stepFn);
        };

        const chain = async (data) => {
            const input = data;
            if (beforeExecHook) await beforeExecHook(namePrefix, data);

            if (aroundExecHook) {
                await aroundExecHook(async () => {
                    for(const step of steps) {
                        data = await step(data);
                    }
                    return data;
                }, namePrefix, data);
            } else {
                for(const step of steps) {
                    data = await step(data);
                }
            }

            if (afterExecHook) await afterExecHook(namePrefix, input, data);

            return data;
        };

        const batch = async (data) => {
            if (beforeExecHook) await beforeExecHook(namePrefix, data);
            let result;
            if (aroundExecHook) {
                result = await aroundExecHook(async () => await Promise.all(steps.map(fn => fn(data))), namePrefix, data);
            } else {
                result = await Promise.all(steps.map(fn => fn(data)));
            }
            if (afterExecHook) await afterExecHook(namePrefix, data, result);
            return result;
        };

        const run = async (stepName, data) => {
            const name = composeStepName(stepName);
            const stepFn = stepsLookup.get(name);
            if (stepFn) {
                if (beforeExecHook) await beforeExecHook(name, data);
                let result;
                if (aroundExecHook) {
                    result = await aroundExecHook(async () => await stepFn(data), namePrefix, data);
                } else {
                    result = await stepFn(data);
                }
                if (afterExecHook) await afterExecHook(name, data, result);

                return result;
            }

            throw new StepMissingError(name);
        };

        return {
            add,
            addFile,
            chain,
            batch,
            run,
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
