import { Scene, Camera, FontLoader, Font, TextBufferGeometry, Vector3, MeshPhongMaterial, Mesh, Sphere, Plane, Group, BoxBufferGeometry, Box3, Raycaster, Object3D } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';
import { ModelManager } from "./model.js";

/**
 * 타일 홀딩 기능
 */
export class TileHolder {

    private scene: Scene;
    private camera: Camera;
    private control: OrbitControls;
    private modelMgr: ModelManager;

    private fontData: Font;
    private geometry: TextBufferGeometry;
    private material: MeshPhongMaterial;
    private mesh: Mesh;

    private rootGroup: Group;
    private holderRoot: Group;
    private holderObject: Object3D;
    private underLine: Mesh;
    
    public boardSphere: Sphere;

    /**
     * 생성자
     * @param scene 씬 객체
     * @param camera 카메라
     * @param control 카메라 컨트롤러
     */
    constructor(scene: Scene, camera: Camera, control: OrbitControls, modelMgr: ModelManager) {

        this.scene = scene;
        this.camera = camera;
        this.control = control;
        this.modelMgr = modelMgr;
        this.rootGroup = new Group();
        this.scene.add(this.rootGroup);

        // 폰트관련 초기화 처리
        const fontLoader = new FontLoader();
        this.fontData = fontLoader.parse(FontData_Bold_Italic);
        
        // geometry 생성후 중점 이동
        this.geometry = new TextBufferGeometry('Hold:', {
            font: this.fontData,
            size: 8,
            height: 2
        });
        this.geometry.computeBoundingBox();
        const size = new Vector3();
        this.geometry.boundingBox.getSize(size);
        this.geometry.translate(size.x * -0.5, size.y * -0.5, size.z * -0.5);

        // 재질
        this.material = new MeshPhongMaterial({ color: 0x00ff00 });
        this.mesh = new Mesh(this.geometry, this.material);
        this.rootGroup.add(this.mesh);

        this.mesh.position.set(0, 0, 0);

        // 타일 홀더용 루트
        this.holderRoot = new Group();
        this.rootGroup.add(this.holderRoot);

        // 홀더 위치 설정
        const textBounding = new Box3().setFromObject(this.mesh);
        const textSize = new Vector3();
        textBounding.getSize(textSize);
        this.holderRoot.position.y -= 1;
        this.holderRoot.position.x = textSize.x * 0.5 + 10;

        // 언더라인
        const underLineGeometry = new BoxBufferGeometry(size.x, 2, 5);
        this.underLine = new Mesh(underLineGeometry, this.material);
        this.rootGroup.add(this.underLine);
        this.underLine.position.set(0, (size.y * -0.5) - 1.5, 0);
        this.underLine.visible = false;
    }

    /**
     * 위치 업데이트
     */
    update(deltaTime: number) {

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
        result.addScaledVector(direction, this.boardSphere.radius + 10);
        result.y += 20;

        this.rootGroup.position.copy(result);
        this.rootGroup.lookAt(this.control.target);

        if( this.holderObject ) {
            this.holderObject.rotateY(Math.PI * deltaTime * 0.1);
        }

    }

    /**
     * 홀드 텍스트와 픽킹 처리
     */
    pickTest(rayCast: Raycaster): boolean {

        const intersects = rayCast.intersectObjects(this.rootGroup.children, true);
        if( intersects && intersects.length > 0 ) {
            this.underLine.visible = true;
            return true;
        } else {
            this.underLine.visible = false;
            return false;
        }
    }

    /**
     * 타일 객체 홀드
     * @param level 타일 레벨
     * @returns 이전 타일 레벨
     */
    setHoldTile(level: number): number {

        const prevHolderLevel = (this.holderObject) ? this.holderObject.userData['level']: null;

        // 새 홀더 객체
        const sourceObject = this.modelMgr.getModelByLevelNumber(level);
        if( sourceObject ) {

            // 이전에 생성되어 있던 홀더 객체 메모리 해제 처리
            if( this.holderObject ) {
                this.disposeHolderObject();
            }

            this.holderObject = new Object3D();
            
            sourceObject.traverse((child) => {
                if( child instanceof Mesh ) {

                    let cursorMaterial = null;
                    if( child.material instanceof Array ) {
                        cursorMaterial = [];
                        for(let m = 0; m < child.material.length; m++) {
                            const matCursor = child.material[m].clone();
                            cursorMaterial.push(matCursor);
                        }
                    } else {
                        cursorMaterial = child.material.clone();
                    }

                    const mesh = new Mesh(child.geometry, cursorMaterial);
                    this.holderObject.add(mesh);
                }   
            });

            this.holderRoot.add(this.holderObject);
            this.holderObject.userData['level'] = level; // 타일 레벨 저장
        }

        return prevHolderLevel;
    }

    /**
     * 홀더 객체 메모리 해제
     */
    disposeHolderObject() {

        if( this.holderObject ) {
            this.holderRoot.remove(this.holderObject);
    
            this.holderObject.traverse((child)=>{
    
                if( child instanceof Mesh ) {
    
                    child.geometry.dispose();
                    if( child.material instanceof Array ) {
                        for(let m = 0; m < child.material.length; m++) {
                            child.material[m].dispose();
                        }
                    } else {
                        child.material.dispose();
                    }
    
                }
    
            });
    
            this.holderObject = null;
        }

    }

    /**
     * 객체 가시화 설정
     * @param isVisible 가시화 여부
     */
    setVisible(isVisible: boolean) {
        this.rootGroup.visible = isVisible;
    }
}