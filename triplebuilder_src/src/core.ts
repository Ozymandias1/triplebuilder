import { Clock, Color, DirectionalLight, HemisphereLight, Mesh, MeshPhongMaterial, PCFSoftShadowMap, PerspectiveCamera, PlaneBufferGeometry, Scene, WebGLRenderer, Raycaster, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Board } from './board';
import { ModelManager } from './model';
import { GameLogic } from './gamelogic';
import * as TWEEN from '@tweenjs/tween.js';

/**
 * 엔진 코어
 */
export class Core {
    // 변수
    private renderer: WebGLRenderer;
    private scene: Scene;
    private camera: PerspectiveCamera;
    private control: OrbitControls;
    private clock: Clock;

    private hemiLight: HemisphereLight;
    private dirLight: DirectionalLight;

    // 로직
    private model: ModelManager;
    private board: Board;
    private gameLogic: GameLogic;
    

    /**
     * 생성자
     */
    constructor() {

        this.clock = new Clock();

        // 렌더러 생성
        this.renderer = new WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // 씬객체
        this.scene = new Scene();
        this.scene.background = new Color(0xcccccc);

        // 라이트
        this.hemiLight = new HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        this.hemiLight.color.setHSL( 0.6, 1, 0.6 );
        this.hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        this.hemiLight.position.set( 0, 50, 0 );
        this.scene.add( this.hemiLight );

        this.dirLight = new DirectionalLight( 0xffffff, 0.6 );
        this.dirLight.color.setHSL( 0.1, 1, 0.95 );
        this.dirLight.position.set( 1, 1.75, -1 );
        this.dirLight.position.multiplyScalar( 30 );
        this.scene.add( this.dirLight );

        // 디렉셔널 라이트 그림자 설정
        const shadowMapDist = 100;
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.left = -shadowMapDist;
        this.dirLight.shadow.camera.right = shadowMapDist;
        this.dirLight.shadow.camera.top = shadowMapDist;
        this.dirLight.shadow.camera.bottom = -shadowMapDist;
        this.dirLight.shadow.camera.far = 3500;
        this.dirLight.shadow.bias = -0.00001;
        
        // 카메라
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1000);
        this.camera.position.set(0, 50, -50);
        this.camera.lookAt(0, 0, 0);

        // 카메라 컨트롤러
        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        this.control.enableDamping = true;
        this.control.dampingFactor = 0.05;
        this.control.enableKeys = false;
        this.control.screenSpacePanning = false;
        this.control.rotateSpeed = 0.5;
        this.control.enablePan = false;
        this.control.maxPolarAngle = Math.PI / 2;

        // // 바닥 그리드
        // const grid = new GridHelper(100, 100, 0xff0000, 0x000000);
        // this.scene.add(grid);
        // // 바닥
        // const groundGeometry = new PlaneBufferGeometry(100, 100, 1, 1);
        // groundGeometry.rotateX(Math.PI * -0.5);
        // const groundMaterial = new MeshPhongMaterial({color: 0xcccccc});
        // const ground = new Mesh(groundGeometry, groundMaterial);
        // ground.castShadow = false;
        // ground.receiveShadow = true;
        // this.scene.add(ground);

        // 창크기변경 이벤트 등록
        window.addEventListener('resize', this.onResize.bind(this), false);

        // 렌더링 루프 시작
        this.render();

        // 모델 인스턴스
        this.model = new ModelManager(this.scene);
        // 게임판 인스턴스
        this.board = new Board(this.scene, this.model, this.camera, this.control);
        // 게임로직
        this.gameLogic = new GameLogic(this.scene, this.camera, this.board, this.model);
    }

    /**
     * 창크기변경 이벤트
     */
    private onResize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

    }

    /**
     * 렌더링 루프
     */
    private render() {
        requestAnimationFrame(this.render.bind(this));

        const deltaTime = this.clock.getDelta();
        TWEEN.default.update();
        this.control.update();

        this.renderer.render(this.scene, this.camera);
    }
}