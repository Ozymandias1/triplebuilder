"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = require("three");
class Core {
    constructor() {
        console.log('Core.constructor');
    }
}
exports.Core = Core;
;
const core = new Core();
const point = new three_1.Vector3(0, 1, 2);
console.log('core', core);
console.log('test point', point);
//# sourceMappingURL=core.js.map