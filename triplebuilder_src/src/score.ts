import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';
import { Font, FontLoader, TextBufferGeometry, Scene, MeshPhongMaterial, Mesh, Vector3, Sphere, Quaternion, PerspectiveCamera, Camera, Spherical, Plane } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * 점수 관리 클래스
 */
export class ScoreManager {

    private scene: Scene;
    private camera: Camera;
    private control: OrbitControls;
    private fontData: Font;
    private geometries: Record<string, TextBufferGeometry>;
    private scoreTable: number[];
    private score: number;

    public sphere: Sphere;

    private test: any;
    /**
     * 생성자
     */
    constructor(scene: Scene, camera: Camera, control: OrbitControls) {
        
        this.scene = scene;
        this.camera = camera;
        this.control = control;
        this.score = 0;

        // 점수 테이블, 총 타일레벨은 10이지만 0레벨은 점수가 없으므로 9개만 세팅
        this.scoreTable = [];
        this.scoreTable.push(5);
        this.scoreTable.push(10);
        this.scoreTable.push(20);
        this.scoreTable.push(35);
        this.scoreTable.push(55);
        this.scoreTable.push(80);
        this.scoreTable.push(110);
        this.scoreTable.push(145);
        this.scoreTable.push(200);

        // 폰트 데이터를 로드하고 준비시킨다.
        const fontLoader = new FontLoader();
        this.fontData = fontLoader.parse(FontData_Bold_Italic);

        // 사용할 텍스트 Geometry를 미리 생성해 놓는다.
        const textList = [ 'Score:', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ];
        this.geometries = {};
        textList.forEach( text => {
            const geometry = new TextBufferGeometry(text, {
                font: this.fontData,
                size: 10,
                height: 5
            });

            // geometry의 바운딩을 계산하여 중점으로 이동
            geometry.computeBoundingBox();
            const size = new Vector3();
            geometry.boundingBox.getSize(size);
            geometry.translate( size.x * -0.5, size.y * -0.5, size.z * -0.5 );

            this.geometries[text] = geometry;
        });

        // 테스트
        const material = new MeshPhongMaterial({ color: 0x0000ff });
        const mesh = new Mesh(this.geometries['Score:'], material);
        this.scene.add(mesh);
        this.test = mesh;
    }

    /**
     * 점수 관련 초기화
     */
    reset() {

        this.score = 0;

    }

    /**
     * 타일레벨로 점수를 추가한다.
     * @param level 레벨
     */
    addScore(level: number) {

        if( 1 <= level && level <= 9 ) {

            this.score += this.scoreTable[level-1];

        }
        console.log(this.score);
    }

    /**
     * 업데이트
     */
    update(deltaTime: number) {

        if( this.sphere ) {

            // this.test.position.x = this.sphere.center.x;
            // this.test.position.y = this.sphere.center.y;
            // this.test.position.z = this.sphere.center.z - this.sphere.radius;

            // const quat = new Quaternion().setFromUnitVectors(this.camera.up, new Vector3(0, 1, 0));
            // const offset = this.camera.position.clone();
            // offset.sub(this.control.target);
            // offset.applyQuaternion(quat);
            // const spherical = new Spherical().setFromVector3(offset);
            // //spherical.theta *= -1.0;
            // spherical.theta = Math.atan2(this.camera.position.z, this.camera.position.x) * -1.0;
            // spherical.phi = Math.PI * 0.5;

            // offset.setFromSpherical(spherical);
            // this.test.position.copy(this.control.target).add(offset);
            // this.test.lookAt(this.control.target);

            const camForward = new Vector3();
            this.camera.getWorldDirection(camForward);
            const target = this.control.target.clone();
            target.addScaledVector(camForward, this.sphere.radius);

            const plane = new Plane().setFromNormalAndCoplanarPoint(new Vector3(0, 1, 0), this.sphere.center);
            const project = new Vector3();
            plane.projectPoint(target, project);

            const direction = new Vector3().subVectors(project, this.control.target);
            direction.normalize();

            const result = this.control.target.clone();
            result.addScaledVector(direction, this.sphere.radius + 10);

            this.test.position.copy(result);
            this.test.lookAt(this.control.target);
        }

    }
}