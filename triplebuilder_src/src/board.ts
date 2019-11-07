import { Scene, BoxBufferGeometry, MeshPhongMaterial, Mesh, Raycaster, Object3D, MeshBasicMaterial } from "three";
import { ModelManager } from './model';
import * as TWEEN from '@tweenjs/tween.js';

export class Tile {
    public object: Object3D;
    public tileW: number;
    public tileH: number;
    public level: number;

    constructor(w: number, h: number, level: number) {

        this.tileW = w;
        this.tileH = h;
        this.level = level;
    }
}

/**
 * 게임판 관리 클래스
 */
export class Board {

    private scene: Scene;
    private modelMgr: ModelManager;
    private tileSize: number;
    private map: Tile[][];
    private plateBase: Mesh;
    private prevPickPlate: Object3D;
    private matSelect: MeshPhongMaterial;
    private matNormal: MeshPhongMaterial;
    
    public plates: Mesh[];

    /**
     * 생성자
     */
    constructor(scene: Scene, modelMgr: ModelManager) {

        this.scene = scene;
        this.modelMgr = modelMgr;
        this.tileSize = 10;
        this.plates = [];
        this.prevPickPlate = null;
        this.matSelect = new MeshPhongMaterial({color: 0xffff00});
        this.matNormal = new MeshPhongMaterial({color: 0xcccccc});
        
        // 픽킹용 바닥판
        const geometry = new BoxBufferGeometry(this.tileSize, 1, this.tileSize, 1, 1, 1);
        const material = new MeshBasicMaterial();
        this.plateBase = new Mesh(geometry, material);

 
        // // 바닥판 생성
        // const geometry = new BoxBufferGeometry(this.tileSize, 1, this.tileSize, 1, 1, 1);
        // const material = new MeshPhongMaterial({
        //     color: 0xcccccc
        // });
        // // 10x10 보드 생성
        // for(let h = 0; h < 10; h++) {
        //     for(let w = 0; w < 10; w++) {
        //         const board = new Mesh(geometry, material);
        //         board.name = w + '_' + h + '/board';
        //         board.position.x = w * this.tileSize;
        //         board.position.z = h * this.tileSize;
        //         board.castShadow = true;
        //         board.receiveShadow = true;
        //         this.scene.add(board);

        //         const plate = board.clone();
        //         plate.name = w + '_' + h + '/plate';
        //         plate.position.copy(board.position);
        //         plate.updateMatrixWorld(true);
        //         plate.userData['sourceObject'] = board;
        //         this.boards.push(plate);
        //     }
        // }
        
    }

    /**
     * 맵 생성
     * @param width 맵 가로 타일개수
     * @param height 맵 세로 타일개수
     */
    createMap(width: number, height: number) {

        // 가로세로 개수만큼 초기화
        this.map = [];
        for(let w = 0; w < width; w++) {
            this.map[w] = [];
            for(let h = 0; h < height; h++) {
                this.map[w][h] = new Tile(w, h, 0);
            }
        }

        // 레벨에 따른 메시 생성
        for(let w = 0; w < width; w++) {
            for(let h = 0; h < height; h++) {
                const mapData = this.map[w][h];
                const model = this.modelMgr.getModelByLevelNumber(mapData.level);
                if( model ) {
                    mapData.object = model.clone();
                    mapData.object.position.x = w * this.tileSize;
                    mapData.object.position.z = h * this.tileSize;
                    this.scene.add(mapData.object);

                    // 픽킹용 패널
                    const plate = this.plateBase.clone();
                    plate.name = w + '_' + h + '/plate';
                    plate.position.copy(mapData.object.position);
                    plate.updateMatrixWorld(true);
                    plate.userData['linkedTile'] = mapData;
                    this.plates.push(plate);
                }
            }
        }

    }

    // /**
    //  * 픽킹 이벤트 처리
    //  */
    // public processPickEvent(rayCast: Raycaster) {

    //     const intersects = rayCast.intersectObjects(this.plates);
    //     if( intersects && intersects.length > 0 ) {

    //         if( this.prevPickPlate && this.prevPickPlate.uuid === intersects[0].object.uuid ) {

    //         } else {
    //             // 이전객체 위치 되돌림
    //             if( this.prevPickPlate ){
    //                 const plateTarget = this.prevPickPlate.userData['linkedTile'];
    //                 new TWEEN.default.Tween(plateTarget.position)
    //                 .to({
    //                     y: 0
    //                 }, 100)
    //                 .easing(TWEEN.default.Easing.Quadratic.Out)
    //                 .start();
    //                 plateTarget.material = this.matNormal;
    //                 this.prevPickPlate = null;
    //             }
    
    //             const target = intersects[0].object.userData['linkedTile'];
    
    //             const tweenData = { ratio: 0.0 };
    //             new TWEEN.default.Tween(tweenData)
    //             .to({
    //                 ratio: 1.0
    //             }, 100)
    //             .easing(TWEEN.default.Easing.Quadratic.Out)
    //             .onUpdate((data: any) =>{
    //                 target.position.y = data.ratio;
    //             })
    //             .start();
    //             target.material = this.matSelect;

    //             this.prevPickPlate = intersects[0].object;
    //         }
    //     } else {
    //         // 이전객체 위치 되돌림
    //         if( this.prevPickPlate ){
    //             const plateTarget = this.prevPickPlate.userData['linkedTile'];
    //             new TWEEN.default.Tween(plateTarget.position)
    //             .to({
    //                 y: 0
    //             }, 100)
    //             .easing(TWEEN.default.Easing.Quadratic.Out)
    //             .start();
    //             plateTarget.material = this.matNormal;
    //             this.prevPickPlate = null;
    //         }
    //     }

    // }
}