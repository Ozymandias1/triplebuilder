import { Scene, Camera, Font, TextBufferGeometry, Vector3, MeshPhongMaterial, Group, Mesh, Sphere, FontLoader, Plane, Box3, Box3Helper, Color } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';
import { GameLogic } from "./gamelogic.js";

/**
 * 게임 시간 표시
 */
export class GameTimer {

    private scene: Scene;
    private camera: Camera;
    private control: OrbitControls;

    private fontData: Font;
    private geometries: Record<string, TextBufferGeometry>;
    private sharedMaterial: MeshPhongMaterial;
    private longestInterval: number;
    private remainTime: number;
    private timeCheck: number;
    private rootGroup: Group;
    private gameLogic: GameLogic;
    public sphere: Sphere;
    public isPlaying: boolean;
    public gameOverText: Mesh;

    /**
     * 생성자
     */
    constructor(scene: Scene, camera: Camera, control: OrbitControls) {

        this.scene = scene;
        this.camera = camera;
        this.control = control;
        this.remainTime = 300;
        this.timeCheck = 0;
        this.isPlaying = false;

        // 폰트 데이터
        const fontLoader = new FontLoader();
        this.fontData = fontLoader.parse(FontData_Bold_Italic);

        // geometry 생성
        this.longestInterval = 0;
        this.geometries = {};
        const textList = ['Time:', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ];
        textList.forEach( (text, i) =>{
            const geometry = new TextBufferGeometry(text, {
                font: this.fontData,
                size: 2.5,
                height: 2
            });

            // geometry의 바운딩을 계산하여 중점으로 이동
            geometry.computeBoundingBox();
            const size = new Vector3();
            geometry.boundingBox.getSize(size);
            geometry.translate( size.x * -0.5, size.y * -0.5, size.z * -0.5 );

            this.geometries[text] = geometry;
            if( 0 < i ) {
                this.longestInterval = Math.max(this.longestInterval, size.x);
            }
        });

        // 공유재질
        this.sharedMaterial = new MeshPhongMaterial({
            color: 0x00ff00,
            specular: 0x00ff00,
            shininess: 100
        });

        // 루트 그룹
        this.rootGroup = new Group();
        this.scene.add(this.rootGroup);

        // 시간표시 가시화 객체 업데이트
        this.updateTimeMesh();

        this.initGameOverText();
    }

    /**
     * 게임 오버 텍스트 표시
     */
    initGameOverText() {
        const geometry = new TextBufferGeometry('GameOver', {
            font: this.fontData,
            size: 10,
            height: 2
        });

        // geometry의 바운딩을 계산하여 중점으로 이동
        geometry.computeBoundingBox();
        const size = new Vector3();
        geometry.boundingBox.getSize(size);
        geometry.translate( size.x * -0.5, size.y * -0.5, size.z * -0.5 );

        const material = new MeshPhongMaterial({
            color: 0xff0000,
            specular: 0xff0000,
            shininess: 100
        });

        this.gameOverText = new Mesh(geometry, material);
        this.scene.add(this.gameOverText);
        this.gameOverText.visible = false;
    }

    /**
     * 시간표시 가시화 객체 업데이트
     */
    updateTimeMesh() {

        // 이전 가시화 객체 제거
        const childCount = this.rootGroup.children.length;
        for(let c = 0; c < childCount; c++) {
            const child = this.rootGroup.children[0];
            this.rootGroup.remove(child);
        }

        // 'Time:' 객체
        let mesh = new Mesh(this.geometries['Time:'], this.sharedMaterial);
        this.rootGroup.add(mesh);
        mesh.position.set(0, 0, 0);

        // Time 바운딩 계산
        const bBox = this.geometries['Time:'].boundingBox.clone();
        const center = new Vector3(), size = new Vector3();
        bBox.getCenter(center);
        bBox.getSize(size);

        // 공백처리
        const whiteSpace = new Vector3();
        this.geometries['0'].boundingBox.getSize(whiteSpace);

        // 남은 시간을 문자화하고 0번째부터 n번째까지 가시화 객체로 생성
        const strTime = this.remainTime.toString();
        for(let i = 0; i < strTime.length; i++) {

            // 생성
            mesh = new Mesh(this.geometries[strTime[i]], this.sharedMaterial);
            this.rootGroup.add(mesh);

            // 위치 설정
            mesh.position.x = center.x + (size.x * 0.5) + whiteSpace.x + (this.longestInterval * i);
        
            bBox.expandByObject(mesh);
        }

        // 위치 조정
        let minX = Number.MAX_VALUE, maxX = Number.MIN_VALUE, halfX = null;
        for(let i = 1; i < this.rootGroup.children.length; i++) {
            const child = <Mesh>this.rootGroup.children[i];
            
            const currBox = child.geometry.boundingBox.clone();
            currBox.translate(child.position);
            
            minX = Math.min(minX, currBox.min.x);
            maxX = Math.max(maxX, currBox.max.x);
        }
        halfX = (maxX - minX) * 0.5;
        for(let i = 0; i < this.rootGroup.children.length; i++) {
            const child = this.rootGroup.children[i];
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
            result.y -= 2.5;

            this.rootGroup.position.copy(result);
            this.rootGroup.lookAt(this.control.target);

            if( this.isPlaying ) {
                this.timeCheck += deltaTime;
                if( this.timeCheck >= 1.0 ) {
                    this.timeCheck = 0;
    
                    this.remainTime--;
                    if( this.remainTime >= 0 ) {
                        this.updateTimeMesh();
                    } else {
                        // 게임 오버 처리
                        this.isPlaying = false;
                        this.gameLogic.doGameOver();
                    }

                    // 시간 색상 처리
                    if( this.remainTime <= 30 ) {
                        this.sharedMaterial.color = new Color(0xff0000);
                    } else if( this.remainTime <= 60 ) {
                        this.sharedMaterial.color = new Color(0xffad3a);
                    } else {
                        this.sharedMaterial.color = new Color(0x00ff00);
                    }
                }
            }

            if( this.gameOverText && this.gameOverText.visible ) {
                this.gameOverText.position.copy(result);
                this.gameOverText.position.y += 25;
                this.gameOverText.lookAt(this.control.target);
            }
        }
    }

    /**
     * 가시화 설정
     */
    setVisible(isVisible: boolean) {
        this.rootGroup.visible = isVisible;
    }

    /**
     * 게임로직 인스턴스 설정
     */
    setGameLogic(logic: GameLogic) {
        this.gameLogic = logic;
    }
    
    /**
     * 시간표시 관련 리셋 처리
     */
    reset() {
        this.isPlaying = true;
        this.remainTime = 300;
        this.timeCheck = 0;
        this.gameOverText.visible = false;
    }
}