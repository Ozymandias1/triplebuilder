import { TextBufferGeometry, MeshPhongMaterial, Vector3, Mesh, Scene, Box3, Group } from "three";
import * as TWEEN from '@tweenjs/tween.js';

/**
 * 점수 팝업 효과 클래스
 */
export class ScorePopup {

    private scene: Scene;
    private group: Group;
    private tween: TWEEN.default.Tween;
    
    public isDone: boolean;

    /**
     * 생성자
     */
    constructor(scene: Scene, geometries: TextBufferGeometry[], material: MeshPhongMaterial, position: Vector3) {
        
        this.scene = scene;
        this.isDone = false;

        // geometry 배열 개수만큼 객체 생성
        this.group = new Group();
        const prevBox = new Box3().makeEmpty();
        for(let i = 0; i < geometries.length; i++) {

            const mesh = new Mesh(geometries[i], material);
            if( prevBox.isEmpty() ) {
                // 바운딩박스가 유효하지 않으면 현재 번째 바운딩 계산
                prevBox.setFromObject(mesh);
            } else {
                // 바운딩박스가 유효하면 이전 바운딩의 옆으로 이동                
                const prevCenter = new Vector3(), prevSize = new Vector3();
                prevBox.getCenter(prevCenter);
                prevBox.getSize(prevSize);

                const currBox = new Box3().setFromObject(mesh);
                const currCenter = new Vector3(), currSize = new Vector3();
                currBox.getCenter(currCenter);
                currBox.getSize(currSize);

                // 위치계산
                let targetX = 0;
                targetX = prevCenter.x + (prevSize.x * 0.5) + (currSize.x * 0.5);
                mesh.position.x = targetX;

                prevBox.setFromObject(mesh);
            }
            this.group.add(mesh);
        }
        // 자식 객체들 중점 이동
        const box = new Box3().setFromObject(this.group);
        const center = new Vector3();
        box.getCenter(center);
        for(let i = 0; i < this.group.children.length; i++) {
            const child = this.group.children[i];
            child.position.x -= center.x;
        }
        this.scene.add(this.group);
        this.group.position.copy(position);

        // 초기위치에서 +10정도까지 애니메이션 처리
        const targetHeight = this.group.position.y + 5;
        this.tween = new TWEEN.default.Tween(this.group.position)
        .to({
            y: targetHeight
        }, 500)
        .easing(TWEEN.default.Easing.Quadratic.Out)
        .onComplete( this.onAnimationComplete.bind(this) )
        .start();
    }

    /**
     * 애니메이션 종료
     */
    onAnimationComplete() {
        this.isDone = true;
    }

    /**
     * 메모리 해제
     */
    dispose() {
        this.tween.stop();
        this.tween = null;

        this.scene.remove(this.group);
    }
}