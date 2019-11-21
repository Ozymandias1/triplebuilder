import { Mesh, Scene, BoxBufferGeometry, MeshPhongMaterial, StringKeyframeTrack, Object3D, Box3, Vector3 } from "three";
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

/**
 * 모델 관리 클래스
 */
export class ModelManager {

    private scene: Scene;
    private models: Record<string, Object3D>;

    /**
     * 생성자
     */
    constructor(scene: Scene, onReady?: Function) {

        this.scene = scene;
        this.models = {};

        // 건물 타일 로드
        const scope = this;
        new MTLLoader().load(
            'models/buildingtiles.mtl',
            function( materials ) {
                materials.preload();

                new OBJLoader().setMaterials(materials).load(
                    'models/buildingtiles.obj',
                    function(object) {
                        
                        // 객체 그림자 On
                        object.traverse( child => {
                            if( child instanceof Mesh ) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });

                        // 자식객체의 이름(레벨)을 분석하여 모델 스토리지에 저장
                        for(let i = 0; i < object.children.length; i++) {
                            const child = object.children[i];
                            const name = child.name.toLowerCase();
                            scope.models[name] = child;
                        }
                        
                        if( onReady ) {
                            onReady();
                        }
                    }
                );
            }
        );
    }

    /**
     * 레벨번호에 해당하는 모델을 반환
     * @param levelNo 레벨 번호
     */
    getModelByLevelNumber(levelNo: number) {

        const key = 'level' + levelNo;
        if( this.models.hasOwnProperty(key) ) {
            return this.models[key];
        } else {
            return null;
        }

    }

    test() {
    }
}