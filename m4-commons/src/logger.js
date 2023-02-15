"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const picocolors_1 = tslib_1.__importDefault(require("picocolors"));
const Log = (name) => ({
    i: (...args) => console.info(picocolors_1.default.blue(`[INFO|${name}]`), ...args),
    w: (...args) => console.warn(picocolors_1.default.yellow(`[WARN|${name}]`), ...args),
    e: (...args) => console.info(picocolors_1.default.red(`[ERRR|${name}]`), ...args),
    d: (...args) => console.info(`[DEBG|${name}]`, ...args),
    cr: (returnCode = 1) => (...args) => {
        console.info(`[DEBG|${name}]`, ...args);
        globalThis?.process.exit(returnCode);
    },
});
exports.default = Log;
