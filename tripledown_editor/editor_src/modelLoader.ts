import {
    Scene,
    Mesh
} from 'three';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';

interface URLData {
    dirPath: string;
    objName: string;
    mtlName: string;
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

    /**
     * OBJ 모델 로드
     * @param option 모델 경로 데이터
     */
    load(option: URLData) {

        try {

            const mtlLoader = new MTLLoader();
            const objLoader = new OBJLoader();

            mtlLoader.setPath(option.dirPath).load(option.mtlName, (materials) => {

                materials.preload();

                objLoader.setMaterials(materials).setPath(option.dirPath).load(option.objName, (object) => {

                    object.traverse( (child) => {
                        if( child instanceof Mesh ) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    object.scale.set(5,5,5);

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