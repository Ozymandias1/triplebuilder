import { Scene, BoxBufferGeometry, MeshPhongMaterial, Mesh, Raycaster } from "three";
import * as TWEEN from '@tweenjs/tween.js';

/**
 * 게임판 관리 클래스
 */
export class Board {

    private scene: Scene;
    private boards: Array<Mesh>;
    private prevPickObject: Mesh;

    /**
     * 생성자
     */
    constructor(scene: Scene) {

        this.scene = scene;
        this.boards = [];
        this.prevPickObject = null;
 
        // 바닥판 생성
        const geometry = new BoxBufferGeometry(10, 1, 10, 1, 1, 1);
        const material = new MeshPhongMaterial({
            color: 0xcccccc
        });
        // 10x10 보드 생성
        for(let h = 0; h < 10; h++) {
            for(let w = 0; w < 10; w++) {
                const board = new Mesh(geometry, material);
                board.name = w + '_' + h + '/board';
                board.position.x = w * 10;
                board.position.z = h * 10;
                board.castShadow = true;
                board.receiveShadow = true;
                this.scene.add(board);

                const plate = board.clone();
                plate.name = w + '_' + h + '/plate';
                plate.position.copy(board.position);
                plate.updateMatrixWorld(true);
                plate.userData['sourceObject'] = board;
                this.boards.push(plate);
            }
        }
        
    }

    /**
     * 픽킹 이벤트 처리
     */
    public processPickEvent(rayCast: Raycaster) {

        const intersects = rayCast.intersectObjects(this.boards);
        if( intersects && intersects.length > 0 ) {

            // 이전객체 위치 되돌림
            if( this.prevPickObject ){
                new TWEEN.default.Tween(this.prevPickObject.position)
                .to({
                    y: 0
                }, 100)
                .easing(TWEEN.default.Easing.Quadratic.Out)
                .start();
                this.prevPickObject = null;
            }

            const target = intersects[0].object.userData['sourceObject'];
            // target.position.y = 1;

            new TWEEN.default.Tween(target.position)
            .to({
                y: 1
            }, 100)
            .easing(TWEEN.default.Easing.Quadratic.Out)
            .start();

            this.prevPickObject = target;
        }

    }
}