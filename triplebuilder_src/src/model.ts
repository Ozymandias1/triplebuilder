import { Mesh, Scene } from "three";
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

export class Model {

    private scene: Scene;

    /**
     * 생성자
     */
    constructor(scene: Scene) {

        this.scene = scene;

        // 기본 모델들 로드
        const scope = this;
        const objUrls = [
            'models/Level0.obj',
            'models/Level1.obj',
            'models/Level2.obj'
        ];
        let offset = 0;
        new MTLLoader().load(
            'models/materials.mtl',
            function( materials ) {

                materials.preload();

                objUrls.forEach(url => {
                    // Level0
                    new OBJLoader().setMaterials(materials).load(
                        url,
                        function (object) {
                            object.position.x = offset;
                            object.position.z = offset;
                            object.scale.set(10,10,10);
                            offset += 5;

                            // 객체 그림자 On
                            object.traverse( child => {
                                if( child instanceof Mesh ) {
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            });

                            scope.scene.add(object);
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
}