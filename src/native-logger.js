'use strict';

function info(...args) {
    console.log(...args);
}

function error(...args) {
    console.error(...args);
}

function debug(...args) {
    console.log(...args);
}

module.exports = {
    info,
    error,
    debug,
};
