import { Raycaster, Mesh, LineSegments, Math as THREEMATH, EdgesGeometry, Object3D, LineBasicMaterial, Scene, Vector2, Camera, Color } from "three";
import { Board, Tile } from "./board";
import { ModelManager } from "./model";
import * as TWEEN from '@tweenjs/tween.js';
import { ScoreManager } from "./score";
import { SoundManager } from "./soundManager";
import { TileHolder } from "./tileHolder";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GameTimer } from "./gameTimer";

export class GameLogic {

    private scene: Scene;
    private camera: Camera;
    private control: OrbitControls;
    private board: Board;
    private modelMgr: ModelManager;
    private scoreMgr: ScoreManager;
    private soundMgr: SoundManager;
    private gameTimer: GameTimer;
    private cursor: Object3D;
    private tileHolder: TileHolder;

    // 픽킹
    private rayCast: Raycaster;
    private mousePos: Vector2;
    private mouseDownPos: Vector2;
    private pointerDownBinder: any;
    private pointerMoveBinder: any;
    private pointerUpBinder: any;
    private isSpawning: boolean;
    
    private restartPointerUpBinder: any;

    constructor(scene: Scene, camera: Camera, control: OrbitControls, board: Board, modelMgr: ModelManager, scoreMgr: ScoreManager, soundMgr: SoundManager, gameTimer: GameTimer) {

        this.scene = scene;
        this.camera = camera;
        this.control = control;
        this.board = board;
        this.modelMgr = modelMgr;
        this.scoreMgr = scoreMgr;
        this.soundMgr = soundMgr;
        this.gameTimer = gameTimer;
        this.isSpawning = false;

        // 픽킹요소 초기화
        this.rayCast = new Raycaster();
        this.mousePos = new Vector2();
        this.mouseDownPos = new Vector2();

        this.pointerDownBinder = this.onPointerDown.bind(this);
        this.pointerMoveBinder = this.onPointerMove.bind(this);
        this.pointerUpBinder = this.onPointerUp.bind(this);
        this.restartPointerUpBinder = this.restartPointerUp.bind(this);
    }

    /**
     * 기능 활성화
     */
    enable() {
        window.addEventListener('pointerdown', this.pointerDownBinder, false);
        window.addEventListener('pointermove', this.pointerMoveBinder, false);
        window.addEventListener('pointerup', this.pointerUpBinder, false);
    }

    /**
     * 기능 비활성화
     */
    disable() {
        this.disposeCursor();
        window.removeEventListener('pointerdown', this.pointerDownBinder);
        window.removeEventListener('pointermove', this.pointerMoveBinder);
        window.removeEventListener('pointerup', this.pointerUpBinder);
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
        const intersects = this.rayCast.intersectObjects(this.board.pickPlates);
        if( intersects && intersects.length > 0 && !this.isSpawning ) {

            const pickObject = intersects[0].object;
            const tile = <Tile>pickObject.userData['linkedTile'];
            if( tile.level === 0 ) {

                if( this.cursor ) {
                    this.cursor.position.copy(pickObject.position);
                    this.cursor.userData['pickedTile'] = tile;
                    this.scene.add(this.cursor);
                }

            } else {
                if( this.cursor ) {
                    this.cursor.userData['pickedTile'] = null;
                    this.cursor.position.copy(pickObject.position);
                    this.scene.add(this.cursor);
                    this.scene.remove(this.cursor);
                }
            }
        } else {
            if( this.cursor ) {
                this.cursor.userData['pickedTile'] = null;
                this.scene.remove(this.cursor);
            }
        }

        // 홀더 마우스 오버 처리
        this.tileHolder.pickTest(this.rayCast);
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

                // 홀드 기능이 먼저 작동되었는지 체크
                if( this.tileHolder.pickTest(this.rayCast) ) {
                    
                    // 타일에 홀드할 타일레벨 설정
                    const prevLevel = this.tileHolder.setHoldTile(this.cursor.userData['level']);
                    // 새 커서 생성
                    this.createCursor(prevLevel);

                } else if( this.cursor && this.cursor.userData['pickedTile'] && this.cursor.userData['pickedTile'].level === 0 ) {
                    const targetTile = this.cursor.userData['pickedTile'];
                    // 타일의 레벨을 커서객체 레벨로 설정
                    targetTile.level = this.cursor.userData['level'];
                    
                    // 커서객체 메모리해제
                    const cloneObject = this.cursor.userData['sourceObject'];
                    cloneObject.position.copy(this.cursor.position);
                    this.scene.add(cloneObject);
                    this.disposeCursor();

                    // 타일에 설정되어있던 이전 타일 객체를 제거하고 복제한 새 모델을 할당
                    this.scene.remove(targetTile.object);
                    targetTile.object = cloneObject;

                    // 애니메이션 처리
                    this.isSpawning = true;
                    targetTile.object.position.y = -30;
                    new TWEEN.default.Tween(targetTile.object.position)
                    .to({
                        y: 0
                    }, 500)
                    .easing(TWEEN.default.Easing.Quadratic.Out)
                    .onComplete(()=>{
                        // 3타일 매치 체크
                        this.board.checkTriple(targetTile, 1);
                        this.createCursor();
                        this.onPointerMove(event);
                        this.isSpawning = false;
                        
                        // 게임오버 체크
                        this.checkGameOver();
                    })
                    .start();

                    // 사운드재생
                    this.soundMgr.playSound('CreateBuilding');
                }
            }
        }
    }

    /**
     * 커서 객체 생성
     */
    createCursor(level?: number) {

        if( !level ) {
            //level = 1;//
            //level = this.getRandomTileNumber([40.0, 30.0, 20.0, 10.0]) + 1;
            level = this.getRandomTileNumber([30, 20, 14, 12, 10, 6, 4, 3, 1]) + 1;
        }
        const sourceObject = this.modelMgr.getModelByLevelNumber(level);

        // 원본 객체의 정보를 통해 새 객체 생성
        if( sourceObject ) {

            this.disposeCursor();
            this.cursor = new Object3D();
            this.cursor.name = 'Cursor';

            sourceObject.traverse((child) => {
                if( child instanceof Mesh ) {

                    let cursorMaterial = null;
                    if( child.material instanceof Array ) {
                        cursorMaterial = [];
                        for(let m = 0; m < child.material.length; m++) {
                            const matCursor = child.material[m].clone();
                            matCursor.transparent = true;
                            matCursor.opacity = 0.5;
                            cursorMaterial.push(matCursor);
                        }
                    } else {
                        cursorMaterial = child.material.clone();
                        cursorMaterial.transparent = true;
                        cursorMaterial.opacity = 0.5;
                    }

                    const mesh = new Mesh(child.geometry, cursorMaterial);
                    this.cursor.add(mesh);
                }   
            });

            this.scene.add(this.cursor);
            this.cursor.userData['sourceObject'] = sourceObject;
            this.cursor.userData['level'] = level;
        }
    }

    /**
     * 확률을 적용하여 랜덤 타일 번호를 계산한다.
     * https://docs.unity3d.com/kr/530/Manual/RandomNumbers.html
     */
    getRandomTileNumber(ratios: number[]): number {

        let total = 0;

        for(let i = 0; i < ratios.length; i++) {
            total += ratios[i];
        }

        let randomPoint = this.getRandomRange(0.0, 1.0) * total;
        for(let i = 0; i < ratios.length; i++) {
            if( randomPoint < ratios[i] ) {
                return i;
            } else {
                randomPoint -= ratios[i];
            }
        }

        return ratios.length-1;
    }

    /**
     * 최소, 최대를 포함하여 최소~최대사이의 난수 반환
     * @param min 최소
     * @param max 최대
     */
    getRandomRange(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
    
    /**
     * 커서 객체 메모리 해제
     */
    disposeCursor() {
        if( this.cursor ) {
            // this.scene.remove(this.cursor);
            // for(let i = 0; i < this.cursor.children.length; i++) {
            //     const child = <LineSegments>this.cursor.children[i];
            //     child.geometry.dispose();
            //     (<any>child.material).dispose();
            // }
            // this.cursor = null;
            this.scene.remove(this.cursor);
            this.cursor.traverse((child)=>{
                if( child instanceof Mesh ) {
                    child.geometry.dispose();
                    if( child.material instanceof Array ) {
                        for(let m = 0; m < child.material.length; m++){
                            child.material[m].dispose();
                        }
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
    
    /**
     * 타일 홀더 인스턴스 설정
     */
    setTileHolder(holder: TileHolder) {
        this.tileHolder = holder;
    }

    /**
     * 게임오버 체크
     */
    checkGameOver() {
        
        const zeroCount = this.board.getTileCountByLevel(0);
        if( zeroCount === 0 ) {

            this.doGameOver();
        }
    }

    /**
     * 게임오버 처리
     */
    doGameOver() {
            
        this.control.autoRotate = true;
        this.control.enabled = false;

        // 홀드 텍스트 숨기기
        this.tileHolder.setVisible(false);

        // 하이스코어 업데이트
        this.scoreMgr.saveHighScore();

        // 시간 중지
        this.gameTimer.isPlaying = false;
        this.gameTimer.gameOverText.visible = true;

        this.disable();

        window.addEventListener('pointerup', this.restartPointerUpBinder, false);
    }

    /**
     * 재시작관련 포인터 처리
     */
    restartPointerUp(event: PointerEvent) {

        if( confirm('Restart Game?') ) {

            window.removeEventListener('pointerup', this.restartPointerUpBinder);

            this.control.autoRotate = false;
            this.control.enabled = true;

            this.tileHolder.disposeHolderObject();
            this.tileHolder.setVisible(true);

            this.gameTimer.reset();

            this.scoreMgr.setScore(0);

            // 보드판 초기화
            this.board.createMap(this.board.mapWidth, this.board.mapHeight);
            this.createCursor();

            this.enable();
        }
    }
}