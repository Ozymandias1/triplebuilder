import {
    Color,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

/**
 * WebGL 코어
 */
export class Core {

    private scene: Scene;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private control: OrbitControls;
    private grid: GridHelper;

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
        document.body.appendChild(this.renderer.domElement);

        // 씬 객체
        this.scene = new Scene();
        this.scene.background = new Color(0xcccccc);

        // 카메라
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1000);
        this.camera.position.set(0, 50, -50);
        this.camera.lookAt(0, 0, 0);

        // 카메라 컨트롤러
        this.control = new OrbitControls(this.camera, this.renderer.domElement);
        this.control.enableDamping = false;
        this.control.enableKeys = false;
        this.control.screenSpacePanning = false;

        // // lights

		// 		var light = new THREE.DirectionalLight( 0xffffff );
		// 		light.position.set( 1, 1, 1 );
		// 		scene.add( light );

		// 		var light = new THREE.DirectionalLight( 0x002288 );
		// 		light.position.set( - 1, - 1, - 1 );
		// 		scene.add( light );

		// 		var light = new THREE.AmbientLight( 0x222222 );
        // 		scene.add( light );
        
        // 바닥 그리드
        this.grid = new GridHelper(100, 100, 0xff0000, 0x000000);
        this.scene.add(this.grid);

        // 창크기변경 이벤트 처리 등록
        window.addEventListener('resize', this.onResize.bind(this), false);

        this.render();
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
};

const core = new Core();