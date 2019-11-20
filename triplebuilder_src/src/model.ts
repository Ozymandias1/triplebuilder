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
            { key: 'level1', url: 'models/Level1.obj' },
            { key: 'level2', url: 'models/Level2.obj' },
            { key: 'level3', url: 'models/Level3.obj' },
            { key: 'level4', url: 'models/Level4.obj' },
            { key: 'level5', url: 'models/Level5.obj' }
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

                            // 객체 바운딩 계산
                            const bounding = new Box3().setFromObject(object);
                            const size = new Vector3();
                            bounding.getSize(size);
                            const longestLength = Math.max(size.x, size.z);
                            const scaleRatio = 10 / longestLength;

                            // 객체 그림자 On
                            object.traverse( child => {
                                if( child instanceof Mesh ) {
                                    child.geometry.scale(scaleRatio, scaleRatio, scaleRatio);
                                    child.geometry.rotateY(Math.PI);
                                    child.geometry.translate(0, 0.5, 0);
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

    test() {
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
                                //child.geometry.scale(scaleRatio, scaleRatio, scaleRatio);
                                //child.geometry.rotateY(Math.PI);
                                //child.geometry.translate(0, 0.5, 0);
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });

                        // 자식객체 visible 테스트
                        for(let i = 0; i < object.children.length; i++) {
                            const child = object.children[i];
                            if( child.name.toLowerCase() === 'level0' || child.name.toLowerCase() === 'level1' ) {
                                child.visible = true;
                            } else {
                                child.visible = false;
                            }
                        }

                        object.position.set(50, 10, 50);

                        scope.scene.add(object);

                        console.log(object);
                    }
                );
            }
        );
    }
}