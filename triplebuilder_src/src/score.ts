import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';
import * as FontData_Bold from './Open_Sans_Bold.json';
import { Font, FontLoader, TextBufferGeometry, Scene, MeshPhongMaterial, Mesh, Vector3, Sphere, Quaternion, PerspectiveCamera, Camera, Spherical, Plane, Box3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ScorePopup } from './scorePopup';
import { Tile } from './board.js';

/**
 * 점수 관리 클래스
 */
export class ScoreManager {

    private scene: Scene;
    private camera: Camera;
    private control: OrbitControls;

    private fontData: Font;
    private geometries: Record<string, TextBufferGeometry>;

    private popupFontData: Font;
    private popupGeometries: Record<string, TextBufferGeometry>;
    private sharedPopupMaterial: MeshPhongMaterial;
    private popupObjList: ScorePopup[];

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
        this.popupFontData = fontLoader.parse(FontData_Bold);

        // 사용할 텍스트 Geometry를 미리 생성해 놓는다.
        // 점수표시용
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
        
        // 팝업 점수용
        const popupTextList = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.popupGeometries = {};
        popupTextList.forEach( text => {
            const geometry = new TextBufferGeometry(text, {
                font: this.popupFontData,
                size: 2,
                height: 1
            });

            // 중점
            geometry.computeBoundingBox();
            const size = new Vector3();
            geometry.boundingBox.getSize(size);
            geometry.translate( size.x * -0.5, size.y * -0.5, size.z * -0.5 );

            this.popupGeometries[text] = geometry;

        });

        // 팝업 효과 공유 재질
        this.sharedPopupMaterial = new MeshPhongMaterial({
            color: 0x996633,
            specular: 0x050505,
            shininess: 100
        });

        // 팝업 객체 리스트
        this.popupObjList = [];

        // 테스트
        const material = new MeshPhongMaterial({ color: 0x0000ff });
        let mesh = new Mesh(this.geometries['Score:'], material);
        this.scene.add(mesh);
        this.test = mesh;

        // // 팝업 테스트
        // mesh = new Mesh(this.popupGeometries['3'], material);
        // this.scene.add(mesh);
        // mesh.position.set(10, 10, 10);
        
    }

    /**
     * 점수 관련 초기화
     */
    reset() {

        this.score = 0;

    }

    /**
     * 타일레벨로 점수를 추가한다.
     * @param tile 레벨
     */
    addScore(tile: Tile) {

        if( 1 <= tile.level && tile.level <= 9 ) {

            const addScore = this.scoreTable[tile.level-1]
            this.score += addScore;

            // 팝업 효과 생성
            // 점수를 문자열로 변환하여 geometry 배열을 전달한다.
            const strScore = addScore.toString();
            const geometryArray = [];
            for(let i = 0; i < strScore.length; i++) {
                geometryArray.push(this.popupGeometries[strScore[i]]);
            }

            // 팝업효과 생성 위치 계산
            const box = new Box3().setFromObject(tile.object);
            const center = new Vector3(), size = new Vector3();
            box.getCenter(center);
            box.getSize(size);

            const spawnLocation = new Vector3();
            spawnLocation.copy(center);
            spawnLocation.y += (size.y * 0.5);

            // 팝업 효과 생성
            const popup = new ScorePopup(this.scene, geometryArray, this.sharedPopupMaterial, spawnLocation);
            this.popupObjList.push(popup);
        }
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

        // 팝업 객체리스트를 역순으로 순회하며 애니메이션이 완료된 객체는 제거한다.
        const popupObjCount = this.popupObjList.length;
        for(let i = popupObjCount-1; i >= 0; i--) {
            if( this.popupObjList[i].isDone ) {
                this.popupObjList[i].dispose();
                this.popupObjList.splice(i, 1);
            }
        }
    }
}