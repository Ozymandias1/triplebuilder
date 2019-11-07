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

    constructor(scene: Scene, camera: Camera, board: Board, modelMgr: ModelManager) {

        this.scene = scene;
        this.camera = camera;
        this.board = board;
        this.modelMgr = modelMgr;

        // 픽킹요소 초기화
        this.rayCast = new Raycaster();
        this.mousePos = new Vector2();
        window.addEventListener('pointermove', this.onPointerMove.bind(this), false);
    }

    /**
     * 마우스 픽킹 이벤트 처리
     */
    onPointerMove(event: MouseEvent) {

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
                    console.log('gamelogic.ts onPointerMove called.');
                }

            }
        }

    }

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