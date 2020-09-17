import { Scene, Camera, Font, FontLoader, TextBufferGeometry, Vector3, MeshPhongMaterial, Mesh, Sphere, Plane, BoxBufferGeometry, Raycaster, Vector2, Box3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';

/**
 * 게임 시작 처리 클래스
 */
export class GameStarter {

    private scene: Scene;
    private camera: Camera;
    private control: OrbitControls;

    private fontData: Font;
    private text: Mesh;
    private underLine: Mesh;
    
    private rayCast: Raycaster;
    private mousePos: Vector2;
    private mouseDownPos: Vector2;
    private pointerDownBinder: any;
    private pointerMoveBinder: any;
    private pointerUpBinder: any;
    private pickSphere: Sphere;

    private onStart: Function;

    public boardSphere: Sphere;
    /**
     * 생성자
     */
    constructor(scene: Scene, camera: Camera, control: OrbitControls, onStart: Function) {

        this.scene = scene;
        this.camera = camera;
        this.control = control;
        this.onStart = onStart;

        // 폰트관련 초기화 처리
        const fontLoader = new FontLoader();
        this.fontData = fontLoader.parse(FontData_Bold_Italic);

        // 문자열 geometry 생성
        const geometry = new TextBufferGeometry('Game Start', {
            font: this.fontData,
            size: 10,
            height: 5
        });
        geometry.computeBoundingBox();
        const size = new Vector3();
        geometry.boundingBox.getSize(size);
        geometry.translate(size.x * -0.5, size.y * -0.5, size.z * -0.5);

        const material = new MeshPhongMaterial({ color: 0x00ff00 });
        this.text = new Mesh(geometry, material);
        this.scene.add(this.text);

        // 픽킹시 가시화할 텍스트 밑줄 객체
        const underLineGeometry = new BoxBufferGeometry(size.x, 2, 5);
        this.underLine = new Mesh(underLineGeometry, material);
        this.text.add(this.underLine);
        this.underLine.position.set(0, (size.y * -0.5) - 1.5, 0);
        this.underLine.visible = false;
        
        // 픽킹요소 초기화
        this.rayCast = new Raycaster();
        this.mousePos = new Vector2();
        this.mouseDownPos = new Vector2();

        // 픽킹관련 포인터 이벤트 등록
        this.pointerDownBinder = this.onPointerDown.bind(this);
        this.pointerMoveBinder = this.onPointerMove.bind(this);
        this.pointerUpBinder = this.onPointerUp.bind(this);

        window.addEventListener('pointerdown', this.pointerDownBinder, false);
        window.addEventListener('pointermove', this.pointerMoveBinder, false);
        window.addEventListener('pointerup', this.pointerUpBinder, false);
    }

    /**
     * 업데이트
     */
    update(deltaTime: number){

        const camForward = new Vector3();
        this.camera.getWorldDirection(camForward);
        const target = this.control.target.clone();
        target.addScaledVector(camForward, this.boardSphere.radius);

        const plane = new Plane().setFromNormalAndCoplanarPoint(new Vector3(0, 1, 0), this.boardSphere.center);
        const project = new Vector3();
        plane.projectPoint(target, project);

        const direction = new Vector3().subVectors(project, this.control.target);
        direction.normalize();

        const result = this.control.target.clone();
        result.addScaledVector(direction, this.boardSphere.radius + 15);
        //result.y += 20;

        this.text.position.copy(result);
        this.text.lookAt(this.control.target);

        this.pickSphere = new Sphere();
        new Box3().setFromObject(this.text).getBoundingSphere(this.pickSphere);
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

        if( this.pickSphere ) {
            // ray 계산
            this.mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.mousePos.y = -( event.clientY / window.innerHeight ) * 2 + 1;
            this.rayCast.setFromCamera( this.mousePos, this.camera );
    
            // 보드판에 픽킹 처리를 한다.
            //const intersects = this.rayCast.intersectObjects([this.text]);            
            //if( intersects && intersects.length > 0 ) {
            const target = new Vector3();
            if(this.rayCast.ray.intersectSphere(this.pickSphere, target)) {
                this.underLine.visible = true;
            } else {
                this.underLine.visible = false;
            }
        } else {
            this.underLine.visible = false;
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

                if( this.underLine.visible ) {

                    // 포인터 이벤트 제거
                    window.removeEventListener('pointerdown', this.pointerDownBinder);
                    window.removeEventListener('pointermove', this.pointerMoveBinder);
                    window.removeEventListener('pointerup', this.pointerUpBinder);

                    // 텍스트 숨기기
                    this.text.visible = false;

                    // 콜백 호출
                    this.onStart();
                }

            }
        }
    }
}