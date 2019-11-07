import { Raycaster, Mesh, LineSegments, Math as THREEMATH, EdgesGeometry, Object3D, LineBasicMaterial, Scene, Vector2, Camera } from "three";
import { Board, Tile } from "./board";
import { ModelManager } from "./model";

export class GameLogic {

    private scene: Scene;
    private camera: Camera;
    private board: Board;
    private modelMgr: ModelManager;
    private cursor: Object3D;

    // 픽킹
    private rayCast: Raycaster;
    private mousePos: Vector2;
    private mouseDownPos: Vector2;

    constructor(scene: Scene, camera: Camera, board: Board, modelMgr: ModelManager) {

        this.scene = scene;
        this.camera = camera;
        this.board = board;
        this.modelMgr = modelMgr;

        // 픽킹요소 초기화
        this.rayCast = new Raycaster();
        this.mousePos = new Vector2();
        this.mouseDownPos = new Vector2();
        window.addEventListener('pointerdown', this.onPointerDown.bind(this), false);
        window.addEventListener('pointermove', this.onPointerMove.bind(this), false);
        window.addEventListener('pointerup', this.onPointerUp.bind(this), false);
    }

    /**
     * 포인터 다운 이벤트 처리
     * @param event 마우스 이벤트
     */
    onPointerDown(event: PointerEvent) {
        if( event.button === 0 ) { // 좌클릭, 1-터치
            this.mouseDownPos.x = event.screenX;
            this.mouseDownPos.y = event.screenY;
        }
    }

    /**
     * 포인터 이동 이벤트 처리
     */
    onPointerMove(event: PointerEvent) {

        // ray 계산
        this.mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mousePos.y = -( event.clientY / window.innerHeight ) * 2 + 1;
        this.rayCast.setFromCamera( this.mousePos, this.camera );

        // 보드판에 픽킹 처리를 한다.
        const intersects = this.rayCast.intersectObjects(this.board.plates);
        if( intersects && intersects.length > 0 ) {

            const pickObject = intersects[0].object;
            const tile = <Tile>pickObject.userData['linkedTile'];
            if( tile ) {

                if( this.cursor ) {
                    this.cursor.position.copy(tile.object.position);
                }

            }
        }

    }

    /**
     * 포인터 업 이벤트
     * @param event 포인터 이벤트
     */
    onPointerUp(event: PointerEvent) {

        if( event.button === 0 ) {

            // 마우스 좌클릭의 경우 화면회전도 겸하므로
            // 포인터 다운 좌표와 업좌표사이 거리가 5.0픽셀 이하인경우 처리
            const currPointerUpPos = new Vector2(event.screenX, event.screenY);
            if( currPointerUpPos.distanceTo(this.mouseDownPos) < 5.0 ) {

                if( this.cursor ) {
                    // 테스트
                    const cloneObject = this.cursor.userData['sourceObject'].clone();
                    cloneObject.position.copy(this.cursor.position);
                    this.scene.add(cloneObject);
                    this.disposeCursor();

                    console.warn('타일요소를 복제해서 생성하면서 맵데이터에 반영하고, 픽킹처리불가능 해볼것');
                }
            }

        }
    }

    /**
     * 커서 객체 생성
     */
    createCursor() {

        const sourceObject = this.modelMgr.getModelByLevel(THREEMATH.randInt(1, 3));

        // 원본 객체를 돌며 Geometry를 취득한후 EdgesGeometry생성
        if( sourceObject ) {

            this.disposeCursor();
            this.cursor = new Object3D();
            this.cursor.name = 'Cursor';

            sourceObject.traverse((child) => {
                if( child instanceof Mesh ) {
                    const edgeGeometry = new EdgesGeometry(child.geometry);
                    const edgeMaterial = new LineBasicMaterial({color: 0x000000});
                    const edge = new LineSegments(edgeGeometry, edgeMaterial);
                    this.cursor.add(edge);
                }
            });

            this.scene.add(this.cursor);
            this.cursor.userData['sourceObject'] = sourceObject;

        }
    }
    
    /**
     * 커서 객체 메모리 해제
     */
    disposeCursor() {
        if( this.cursor ) {
            this.scene.remove(this.cursor);
            for(let i = 0; i < this.cursor.children.length; i++) {
                const child = <LineSegments>this.cursor.children[i];
                child.geometry.dispose();
                (<any>child.material).dispose();
            }
            this.cursor = null;
        }
    }
}