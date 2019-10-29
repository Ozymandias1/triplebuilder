import {
    Scene,
    Mesh,
    BufferGeometry,
    Box3,
    Vector3
} from 'three';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';

/**
 * 모델 로드용 URL데이터
 */
export interface URLData {
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

        return new Promise( (resolve, reject) => {

            try {

                const mtlLoader = new MTLLoader();
                const objLoader = new OBJLoader();
    
                mtlLoader.setPath(option.dirPath).load(option.mtlName, (materials) => {
    
                    materials.preload();
    
                    objLoader.setMaterials(materials).setPath(option.dirPath).load(option.objName, (object) => {
                        
                        // 로드된 객체를 그룹으로부터 분리하고 중점이동후 씬에 바로 추가한다.
                        const result = [];
                        const childCount = object.children.length;
                        for(let i = 0; i < childCount; i++) {
                            const child = <Mesh>object.children[0];
                            child.castShadow = true;
                            child.receiveShadow = true;
    
                            const geometry = <BufferGeometry>child.geometry;
                            geometry.scale(5, 5, 5);
                            geometry.computeBoundingBox();
    
                            const center = new Vector3();
                            geometry.boundingBox.getCenter(center);
                            geometry.translate(-center.x, -center.y, -center.z);
                            child.position.copy(center);
    
                            this.scene.add(child);
                            result.push(child);
                        }

                        resolve(result);
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
                reject(err);
            }
        });
    }
}