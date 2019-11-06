import { Scene, BoxBufferGeometry, MeshPhongMaterial, Mesh, Raycaster, Object3D } from "three";
import { ModelManager } from './model';
import * as TWEEN from '@tweenjs/tween.js';

class Tile {
    public object: Object3D;
    public tileW: number;
    public tileH: number;

    constructor(w: number, h: number) {

        this.tileW = w;
        this.tileH = h;
    }
}

/**
 * 게임판 관리 클래스
 */
export class Board {

    private scene: Scene;
    private modelMgr: ModelManager;
    // private boards: Array<Mesh>;
    // private prevPickObject: Mesh;
    private tileSize: number;
    private map: Tile[][];

    /**
     * 생성자
     */
    constructor(scene: Scene, modelMgr: ModelManager) {

        this.scene = scene;
        this.modelMgr = modelMgr;
        // this.boards = [];
        // this.prevPickObject = null;

        this.tileSize = 10;
 
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
                this.map[w][h] = new Tile(w, h);
            }
        }

    }

    // /**
    //  * 픽킹 이벤트 처리
    //  */
    // public processPickEvent(rayCast: Raycaster) {

    //     const intersects = rayCast.intersectObjects(this.boards);
    //     if( intersects && intersects.length > 0 ) {

    //         // 이전객체 위치 되돌림
    //         if( this.prevPickObject ){
    //             new TWEEN.default.Tween(this.prevPickObject.position)
    //             .to({
    //                 y: 0
    //             }, 100)
    //             .easing(TWEEN.default.Easing.Quadratic.Out)
    //             .start();
    //             this.prevPickObject = null;
    //         }

    //         const target = intersects[0].object.userData['sourceObject'];
    //         // target.position.y = 1;

    //         new TWEEN.default.Tween(target.position)
    //         .to({
    //             y: 1
    //         }, 100)
    //         .easing(TWEEN.default.Easing.Quadratic.Out)
    //         .start();

    //         this.prevPickObject = target;
    //     }

    // }
}