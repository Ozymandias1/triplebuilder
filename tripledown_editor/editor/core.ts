import {
    Vector3
} from 'three';

export class Core {
    constructor() {
        console.log('Core.constructor');
    }
};

const core = new Core();
const point = new Vector3(0, 1, 2);
console.log('core', core);
console.log('test point', point);