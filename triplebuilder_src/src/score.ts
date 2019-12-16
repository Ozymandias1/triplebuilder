import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';
import * as FontData_Bold from './Open_Sans_Bold.json';
import { Font, FontLoader, TextBufferGeometry, Scene, MeshPhongMaterial, Mesh, Vector3, Sphere, Quaternion, PerspectiveCamera, Camera, Spherical, Plane, Box3, Group } from 'three';
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

    private resultScoreRoot: Group;
    private resultScoreSharedMaterial: MeshPhongMaterial;
    private resultScoreInterval: number;

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
        // this.scoreTable.push(5);
        // this.scoreTable.push(10);
        // this.scoreTable.push(20);
        // this.scoreTable.push(35);
        // this.scoreTable.push(55);
        // this.scoreTable.push(80);
        // this.scoreTable.push(110);
        // this.scoreTable.push(145);
        // this.scoreTable.push(200);        
        this.scoreTable.push(50);
        this.scoreTable.push(100);
        this.scoreTable.push(200);
        this.scoreTable.push(350);
        this.scoreTable.push(550);
        this.scoreTable.push(800);
        this.scoreTable.push(1100);
        this.scoreTable.push(1450);
        this.scoreTable.push(2000);

        // 폰트 데이터를 로드하고 준비시킨다.
        const fontLoader = new FontLoader();
        this.fontData = fontLoader.parse(FontData_Bold_Italic);
        this.popupFontData = fontLoader.parse(FontData_Bold);

        // 사용할 텍스트 Geometry를 미리 생성해 놓는다.
        // 점수표시용
        this.resultScoreInterval = 0;
        const textList = [ 'Score:', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ];
        this.geometries = {};
        textList.forEach( (text, i) => {
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
            if( 0 < i ) {
                this.resultScoreInterval = Math.max(this.resultScoreInterval, size.x);
            }
        });
        
        // 팝업 점수용
        const popupTextList = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x'];
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

            // 콤보배율용 'x'는 좀더 작게 처리
            if( text === 'x' ) {
                geometry.scale(0.75, 0.75, 0.75);
            }

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

        // 누적점수
        this.resultScoreSharedMaterial = new MeshPhongMaterial({ color: 0x0000ff });
        this.resultScoreRoot = new Group();
        this.scene.add(this.resultScoreRoot);

        this.updateScoreMesh();        
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
     * @param comboRatio 콤보배율
     */
    addScore(tile: Tile, comboRatio: number) {

        if( 1 <= tile.level && tile.level <= 9 ) {

            const addScore = this.scoreTable[tile.level-1]
            this.score += (addScore * comboRatio);

            // 팝업 효과 생성
            // 점수를 문자열로 변환하여 geometry 배열을 전달한다.
            const strScore = addScore.toString();
            const geometryArray = [];
            for(let i = 0; i < strScore.length; i++) {
                geometryArray.push(this.popupGeometries[strScore[i]]);
            }

            // 콤보 배율처리
            if( comboRatio > 1.0 ) {
                const strCombo = parseInt(comboRatio.toString()).toString();

                geometryArray.push(this.popupGeometries['x']);
                for(let i = 0; i < strCombo.length; i++) {
                    geometryArray.push(this.popupGeometries[strCombo[i]]);
                }
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

            this.updateScoreMesh();
        }
    }

    /**
     * 누적점수 가시화 객체를 업데이트 한다.
     */
    updateScoreMesh() {

        // 이전 자식 객체 제거
        const childCount = this.resultScoreRoot.children.length;
        for(let i = 0; i < childCount; i++) {
            const child = this.resultScoreRoot.children[0];
            this.resultScoreRoot.remove(child);
        }

        // Score 객체 추가
        let mesh = new Mesh(this.geometries['Score:'], this.resultScoreSharedMaterial);
        this.resultScoreRoot.add(mesh);
        mesh.position.set(0, 0, 0);

        // Score 바운딩 계산
        const bBox = this.geometries['Score:'].boundingBox.clone();
        const scoreCenter = new Vector3(), scoreSize = new Vector3();
        bBox.getCenter(scoreCenter);
        bBox.getSize(scoreSize);

        // 시작지점 공백용사이즈를 '0'으로 계산
        const whiteSpaceSize = new Vector3();
        this.geometries['0'].boundingBox.getSize(whiteSpaceSize);

        // 점수 문자화를 하고 0번쨰부터 n번째까지 가시화 객체로 생성한다.
        const strScore = this.score.toString();
        for(let i = 0; i < strScore.length; i++) {

            // 생성
            mesh = new Mesh(this.geometries[strScore[i]], this.resultScoreSharedMaterial);
            this.resultScoreRoot.add(mesh);

            // 위치 설정
            mesh.position.x = scoreCenter.x + (scoreSize.x * 0.5) + whiteSpaceSize.x + (this.resultScoreInterval * i);
            bBox.expandByObject(mesh);
        }

        // 위치 조정
        let minX = Number.MAX_VALUE, maxX = Number.MIN_VALUE, halfX = null;
        for(let i = 1; i < this.resultScoreRoot.children.length; i++) {
            const child = <Mesh>this.resultScoreRoot.children[i];
            
            const currBox = child.geometry.boundingBox.clone();
            currBox.translate(child.position);
            
            minX = Math.min(minX, currBox.min.x);
            maxX = Math.max(maxX, currBox.max.x);
        }
        halfX = (maxX - minX) * 0.5;
        for(let i = 0; i < this.resultScoreRoot.children.length; i++) {
            const child = this.resultScoreRoot.children[i];
            child.translateX(-halfX);
        }


    }

    /**
     * 업데이트
     */
    update(deltaTime: number) {

        if( this.sphere ) {

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
            result.y += 10;

            this.resultScoreRoot.position.copy(result);
            this.resultScoreRoot.lookAt(this.control.target);
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