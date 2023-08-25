'use strict';
const DummyLogger = require('./dummy-logger');

const make = (options) => {
    const logger = options?.logger || DummyLogger;

    /**
     * Get existing step run info or create new one
     *
     * @param {string} name Full name of step
     * @param {string} hash Hash of step input data
     * @param {string?} rootHash Root step hash for substep. For root step should be null. If undefined the run object returned in read-only mode.
     * @returns {}
     */
    const getRun = (name, hash, rootHash) => {
        return {
            /**
             * Check if step run is done successfully
             * @returns {boolean}
             */
            isDone() {
                return false;
            },

            /**
             * Check if step run is running now
             * @returns {boolean}
             */
            isRunning() {
                return false;
            },

            /**
             * Mark step run as successfully done
             * @param {object} output Step execution output result
             * @returns {boolean}
             */
            markDone(output) {
                if (rootHash === undefined) {
                    return false;
                }
                return true;
            },

            /**
             * Mark step run as failed
             * @param {Error} error Error happend while executing step
             * @returns {boolean}
             */
            markFailed(error) {
                logger.debug(error);
                if (rootHash === undefined) {
                    return false;
                }
                return true;
            },

            /**
             * Get step run persistent variable
             * @returns {object}
             */
            getVars() {
                return {};
            },
        };
    };

    return {
        getRun,
    };
};

module.exports = {
    make,
};
