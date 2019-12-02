import { Mesh, Scene, BoxBufferGeometry, MeshPhongMaterial, StringKeyframeTrack, Object3D, Box3, Vector3, MeshPhysicalMaterial, Material } from "three";
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

import * as TWEEN from '@tweenjs/tween.js';
/**
 * 모델 관리 클래스
 */
export class ModelManager {

    private scene: Scene;
    private models: Record<string, Mesh>;

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
                            scope.models[name] = <Mesh>child;
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
            // 모델의 Geometry와 Material정보로 새 Mesh를 생성하여 반환한다.
            if( this.models[key].material instanceof Array ) {
                
                const source = (this.models[key].material as MeshPhongMaterial[]);
                const materials = [];
                for(let i = 0; i < source.length; i++) {
                    const material = new MeshPhongMaterial();
                    material.copy( source[i] );
                    materials.push(material);
                }

                const newMesh = new Mesh( this.models[key].geometry, materials );
                newMesh.castShadow = true;
                newMesh.receiveShadow = true;
                return newMesh;

            } else {

                const material = new MeshPhongMaterial();
                material.copy( <MeshPhongMaterial>this.models[key].material );

                const newMesh = new Mesh( this.models[key].geometry, material );
                newMesh.castShadow = true;
                newMesh.receiveShadow = true;
                return newMesh;

            }
        } else {
            return null;
        }

    }
}