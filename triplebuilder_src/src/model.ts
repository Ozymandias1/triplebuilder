import { Mesh, Scene, BoxBufferGeometry, MeshPhongMaterial, StringKeyframeTrack, Object3D } from "three";
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

        // 기본판
        const geometry = new BoxBufferGeometry(10, 1, 10, 1, 1, 1);
        const material = new MeshPhongMaterial({
            color: 0xcccccc
        });
        const mesh = new Mesh(geometry, material);
        // mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.models['level0'] = mesh;
        

        // 기본 모델들 로드
        const scope = this;
        const objUrls = [
            { key: 'level1', url: 'models/Level1.obj'},
            { key: 'level2', url: 'models/Level2.obj'},
            { key: 'level3', url: 'models/Level3.obj'}
        ];
        // let offset = 0;
        new MTLLoader().load(
            'models/materials.mtl',
            function( materials ) {

                materials.preload();

                objUrls.forEach( (element, index) => {
                    new OBJLoader().setMaterials(materials).load(
                        element.url,
                        function (object) {

                            // 객체 그림자 On
                            object.traverse( child => {
                                if( child instanceof Mesh ) {
                                    child.geometry.scale(8.88,8.88,8.88);
                                    child.geometry.rotateY(Math.PI);
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            });

                            // 모델 스토리지에 저장
                            scope.models[element.key] = object;

                            if( Object.keys(scope.models).length === 4 ) {
                                if( onReady ) {
                                    onReady();
                                }
                            }
                        },
                        function (progress){},
                        function(err){
                            if( err ) {
                                console.error(err);
                            }
                        }
                    );
                });

            },
            function( progress ){},
            function(err) {
                if( err ) {
                    console.error(err);
                }
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
}