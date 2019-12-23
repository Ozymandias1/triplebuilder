import { Scene, Camera, Font, TextBufferGeometry, Vector3, MeshPhongMaterial, Group, Mesh } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';

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
    private rootGroup: Group;


    /**
     * 생성자
     */
    constructor(scene: Scene, camera: Camera, control: OrbitControls) {

        this.scene = scene;
        this.camera = camera;
        this.control = control;

        // geometry 생성
        this.geometries = {};
        const textList = ['Time:', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ];
        textList.forEach( (text, i) =>{
            const geometry = new TextBufferGeometry(text, {
                font: this.fontData,
                size: 5,
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
            
        }

    }
}