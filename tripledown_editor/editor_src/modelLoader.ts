import {
    Scene
} from 'three';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';

interface URLData {
    objUrl: string;
    mtlUrl: string;
}

/**
 * 모델 로더 클래스
 */
export class ModelLoader {
    
    private scene: Scene;

    /**
     * 생성자
     */
    constructor(scene: Scene) {
        this.scene = scene;
    }

    load(option: URLData) {

        try {

            const mtlLoader = new MTLLoader();
            const objLoader = new OBJLoader();

            mtlLoader.load(option.mtlUrl, (materials) => {

                materials.preload();

                objLoader.setMaterials(materials).load(option.objUrl, (object) => {
                    this.scene.add(object);
                }, (progress) => {

                }, (err) => {
                    throw err;
                });

            }, (progress) => {
            }, (err) => {
                throw err;
            });

        } catch (err) {
            console.error(err);
        }
    }
}