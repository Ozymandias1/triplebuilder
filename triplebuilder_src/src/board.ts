import { Scene, BoxBufferGeometry, MeshPhongMaterial, Mesh, Raycaster, Object3D, MeshBasicMaterial, Camera, Box3, Sphere } from "three";
import { ModelManager } from './model';
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export class Tile {
    public object: Object3D;
    public tileW: number;
    public tileH: number;
    public level: number;

    constructor(w: number, h: number, level: number) {

        this.tileW = w;
        this.tileH = h;
        this.level = level;
    }
}

/**
 * 게임판 관리 클래스
 */
export class Board {

    private scene: Scene;
    private modelMgr: ModelManager;
    private camera: Camera;
    private camControl: OrbitControls;
    private tileSize: number;
    private map: Tile[][];
    private plateBase: Mesh;
    private prevPickPlate: Object3D;
    private matSelect: MeshPhongMaterial;
    private matNormal: MeshPhongMaterial;
    
    public plates: Mesh[];

    /**
     * 생성자
     */
    constructor(scene: Scene, modelMgr: ModelManager, camera: Camera, camControl: OrbitControls) {

        this.scene = scene;
        this.modelMgr = modelMgr;
        this.camera = camera;
        this.camControl = camControl;
        this.tileSize = 10;
        this.plates = [];
        this.prevPickPlate = null;
        this.matSelect = new MeshPhongMaterial({color: 0xffff00});
        this.matNormal = new MeshPhongMaterial({color: 0xcccccc});
        
        // 픽킹용 바닥판
        const geometry = new BoxBufferGeometry(this.tileSize, 1, this.tileSize, 1, 1, 1);
        const material = new MeshBasicMaterial();
        this.plateBase = new Mesh(geometry, material);
        
    }

    /**
     * 맵 생성
     * @param width 맵 가로 타일개수
     * @param height 맵 세로 타일개수
     */
    createMap(width: number, height: number) {

        // 가로세로 개수만큼 초기화
        this.map = [];
        for(let w = 0; w < width; w++) {
            this.map[w] = [];
            for(let h = 0; h < height; h++) {
                this.map[w][h] = new Tile(w, h, 0);
            }
        }

        // 레벨에 따른 메시 생성
        for(let w = 0; w < width; w++) {
            for(let h = 0; h < height; h++) {
                const mapData = this.map[w][h];
                const model = this.modelMgr.getModelByLevelNumber(mapData.level);
                if( model ) {
                    mapData.object = model.clone();
                    mapData.object.position.x = w * this.tileSize;
                    mapData.object.position.z = h * this.tileSize;
                    this.scene.add(mapData.object);

                    // 픽킹용 패널
                    const plate = this.plateBase.clone();
                    plate.name = w + '_' + h + '/plate';
                    plate.position.copy(mapData.object.position);
                    plate.updateMatrixWorld(true);
                    plate.userData['linkedTile'] = mapData;
                    this.plates.push(plate);
                }
            }
        }

        // 바운딩을 계산하여 카메라를 이동시킨다.
        const bounding = new Box3();
        bounding.makeEmpty();
        for(let i = 0; i < this.plates.length; i++) {
            bounding.expandByObject(this.plates[i]);
        }

        const sphere = new Sphere();
        bounding.getBoundingSphere(sphere);

        this.camControl.target = sphere.center;
        this.camControl.object.position.set(
            sphere.center.x,
            sphere.center.y + sphere.radius,
            sphere.center.z - sphere.radius
        );
        this.camControl.object.lookAt(sphere.center);
        this.camControl.update();
        this.camControl.minDistance = sphere.radius;
        this.camControl.maxDistance = sphere.radius * 2;
    }

    /**
     * 대상타일 기준으로 3타일 매치가 성사되는지 체크한다.
     * @param tile 타일 객체
     */
    checkTriple(tile: Tile) {
        console.log('생성한 타일 정보', tile);
    }
}