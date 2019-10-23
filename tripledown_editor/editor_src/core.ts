import {
    Color,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    HemisphereLight,
    DirectionalLight,
    PlaneGeometry,
    MeshPhongMaterial,
    Mesh,
    PCFSoftShadowMap
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {FileDragDrop} from './fileDragDrop';
import {ModelLoader} from './modelLoader';

/**
 * WebGL 코어
 */
export class Core {

    private scene: Scene;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private control: OrbitControls;
    private grid: GridHelper;
    
    private hemiLight: HemisphereLight;
    private dirLight: DirectionalLight;

    private fileDragDropHandler: FileDragDrop;
    private modelLoader: ModelLoader;

    /**
     * 생성자
     */
    constructor() {

        // 렌더러
        this.renderer = new WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMapType = PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // 씬 객체
        this.scene = new Scene();
        this.scene.background = new Color(0xcccccc);

        // 라이트
        this.hemiLight = new HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        this.hemiLight.color.setHSL( 0.6, 1, 0.6 );
        this.hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        this.hemiLight.position.set( 0, 50, 0 );
        this.scene.add( this.hemiLight );

        this.dirLight = new DirectionalLight( 0xffffff, 1 );
        this.dirLight.color.setHSL( 0.1, 1, 0.95 );
        this.dirLight.position.set( - 1, 1.75, 1 );
        this.dirLight.position.multiplyScalar( 30 );
        this.scene.add( this.dirLight );

        const shadowMapDist = 10;
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
        this.control.enableDamping = false;
        this.control.enableKeys = false;
        this.control.screenSpacePanning = false;
        
        // 바닥 그리드
        this.grid = new GridHelper(100, 100, 0xff0000, 0x000000);
        this.scene.add(this.grid);
        // 바닥평면
        const planeGeometry = new PlaneGeometry(100, 100, 1, 1);
        planeGeometry.rotateX(Math.PI * -0.5);
        const planeMaterial = new MeshPhongMaterial({
            color: 0xcccccc
        });
        const plane = new Mesh(planeGeometry, planeMaterial);
        plane.castShadow = false;
        plane.receiveShadow = true;
        this.scene.add(plane);

        // 창크기변경 이벤트 처리 등록
        window.addEventListener('resize', this.onResize.bind(this), false);

        this.render();

        // 파일 드래그앤드랍 핸들러, 경로 문제로 보류
        //this.fileDragDropHandler = new FileDragDrop(this);
        // 모델 로더
        this.modelLoader = new ModelLoader(this.scene);
    }

    /**
     * 창크기 변경 이벤트 처리
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

        this.renderer.render(this.scene, this.camera);

    }

    /**
     * 모델 로드
     */
    public loadModel(option) {
        this.modelLoader.load(option);
    }
};

//const core = new Core();