import { Scene, BoxBufferGeometry, MeshPhongMaterial, Mesh } from "three";

/**
 * 게임판 관리 클래스
 */
export class Board {

    private scene: Scene;

    /**
     * 생성자
     */
    constructor(scene: Scene) {

        this.scene = scene;
 
        // 바닥판 생성
        const geometry = new BoxBufferGeometry(10, 1, 10, 1, 1, 1);
        const material = new MeshPhongMaterial({
            color: 0xcccccc
        });
        // 10x10 보드 생성
        for(let h = 0; h < 10; h++) {
            for(let w = 0; w < 10; w++) {
                const board = new Mesh(geometry, material);
                board.position.x = w * 10;
                board.position.z = h * 10;
                board.castShadow = true;
                board.receiveShadow = true;
                this.scene.add(board);
            }
        }
        
    }
}