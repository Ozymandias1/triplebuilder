import { Scene, BoxBufferGeometry, MeshPhongMaterial, Mesh, Raycaster, Object3D, MeshBasicMaterial, Camera, Box3, Sphere, Vector3 } from "three";
import { ModelManager } from './model';
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ScoreManager } from "./score";

export class Tile {
    public object: Mesh;
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
    private curtain: Mesh;
    private scoreMgr: ScoreManager;
    
    public pickPlates: Mesh[];
    public floorPlates: Mesh[];
    public mapWidth: number;
    public mapHeight: number;

    /**
     * 생성자
     */
    constructor(scene: Scene, modelMgr: ModelManager, camera: Camera, camControl: OrbitControls, scoreMgr: ScoreManager) {

        this.scene = scene;
        this.modelMgr = modelMgr;
        this.camera = camera;
        this.camControl = camControl;
        this.scoreMgr = scoreMgr;
        this.tileSize = 10;
        this.pickPlates = [];
        this.floorPlates = [];
        this.mapWidth = -1;
        this.mapHeight = -1;
        this.prevPickPlate = null;
        this.matSelect = new MeshPhongMaterial({color: 0xffff00});
        this.matNormal = new MeshPhongMaterial({color: 0xcccccc});
        
        // 픽킹용 바닥판
        const geometry = new BoxBufferGeometry(this.tileSize, 1, this.tileSize, 1, 1, 1);
        const material = new MeshBasicMaterial();
        this.plateBase = new Mesh(geometry, material);
        
    }

    /**
     * 리소스 메모리 해제
     */
    dispose() {
        // 픽킹용 바닥판 제거
        for(let i = 0; i < this.pickPlates.length; i++) {
            this.pickPlates[i] = null;
        }
        this.pickPlates = [];

        // 생성되어 있는 타일 제거
        for(let w = 0; w < this.mapWidth; w++) {
            for(let h = 0; h < this.mapHeight; h++) {
                const mapData = this.map[w][h];
                if( mapData.object ) {
                    this.scene.remove(mapData.object);
                    
                    mapData.object.geometry.dispose();
                    if (mapData.object.material instanceof Array) {
                        for (let m = 0; m < mapData.object.material.length; m++) {
                            mapData.object.material[m].dispose();
                        }
                    } else {
                        mapData.object.material.dispose();
                    }
                }
            }
        }

        // 바닥판 제거
        for(let i = 0; i < this.floorPlates.length; i++) {
            const plate = this.floorPlates[i];
            this.scene.remove(plate);
            
            plate.geometry.dispose();
            if( plate.material instanceof Array ) {
                for(let m = 0; m < plate.material.length; m++) {
                    plate.material[m].dispose();
                }
            } else {
                plate.material.dispose();
            }

        }

        // 커튼 제거
        if( this.curtain ) {
            this.scene.remove(this.curtain);
            this.curtain.geometry.dispose();
            (<MeshPhongMaterial>this.curtain.material).dispose();
            this.curtain = null;
        }
    }

    /**
     * 맵 생성
     * @param width 맵 가로 타일개수
     * @param height 맵 세로 타일개수
     */
    createMap(width: number, height: number) {
        this.dispose();

        this.mapWidth = width;
        this.mapHeight = height;

        // 가로세로 개수만큼 초기화
        this.map = [];
        for(let w = 0; w < width; w++) {
            this.map[w] = [];
            for(let h = 0; h < height; h++) {
                this.map[w][h] = new Tile(w, h, 0);

                // 바닥판생성, 0레벨 판으로 깔린다.
                const model = this.modelMgr.getModelByLevelNumber(0);
                model.position.x = w * this.tileSize;
                model.position.z = h * this.tileSize;
                this.scene.add(model);
                this.floorPlates.push(model);
                
                // 픽킹용 패널
                const plate = this.plateBase.clone();
                plate.name = w + '_' + h + '/plate';
                plate.position.copy(model.position);
                plate.updateMatrixWorld(true);
                plate.userData['linkedTile'] = this.map[w][h];
                this.pickPlates.push(plate);
            }
        }

        // 타일 레벨에 따른 메시 생성
        for(let w = 0; w < width; w++) {
            for(let h = 0; h < height; h++) {
                const mapData = this.map[w][h];
                const model = this.modelMgr.getModelByLevelNumber(mapData.level);
                if( model ) {
                    // mapData.object = model;
                    // mapData.object.position.x = w * this.tileSize;
                    // mapData.object.position.z = h * this.tileSize;
                    // this.scene.add(mapData.object);

                    // // 픽킹용 패널
                    // const plate = this.plateBase.clone();
                    // plate.name = w + '_' + h + '/plate';
                    // plate.position.copy(mapData.object.position);
                    // plate.updateMatrixWorld(true);
                    // plate.userData['linkedTile'] = mapData;
                    // this.pickPlates.push(plate);
                    // mapData.object = null;
                }
            }
        }

        // 바운딩을 계산하여 카메라를 이동시킨다.
        const bounding = new Box3();
        bounding.makeEmpty();
        for(let i = 0; i < this.pickPlates.length; i++) {
            bounding.expandByObject(this.pickPlates[i]);
        }

        const sphere = new Sphere();
        bounding.getBoundingSphere(sphere);
        this.scoreMgr.sphere = sphere.clone();

        this.camControl.target = sphere.center;
        this.camControl.object.position.set(
            sphere.center.x,
            sphere.center.y + sphere.radius,
            sphere.center.z + sphere.radius
        );
        this.camControl.object.lookAt(sphere.center);
        this.camControl.update();
        this.camControl.minDistance = sphere.radius;
        this.camControl.maxDistance = sphere.radius * 2;

        // 바닥판옆면을 가리기 위한 커튼 설치
        const curtainHeight = 50;
        const boundingSize = new Vector3(), boundingCenter = new Vector3();
        bounding.getSize(boundingSize);
        bounding.getCenter(boundingCenter);
        const curtainGeometry = new BoxBufferGeometry(boundingSize.x, curtainHeight, boundingSize.z);
        const curtainMaterial = new MeshPhongMaterial({ 
            color: 0xcccccc 
        });
        this.curtain = new Mesh(curtainGeometry, curtainMaterial);
        this.curtain.position.x = boundingCenter.x;
        this.curtain.position.y = -(boundingSize.y * 0.25) - (curtainHeight * 0.5);
        this.curtain.position.z = boundingCenter.z;
        this.scene.add(this.curtain);
    }

    /**
     * 대상타일 기준으로 3타일 매치가 성사되는지 체크한다.
     * @param tile 타일 객체
     */
    checkTriple(tile: Tile) {

        if( tile.level === 0 ) {
            return;
        }

        let matched = [tile];

        // 대상타일 기준 상하좌우체크
        // 상단
        const topTile = (tile.tileH > 0) ? this.map[tile.tileW][tile.tileH-1]: null;
        if( topTile && topTile.level === tile.level ) {
            if( matched.indexOf(topTile) === -1 ) {
                matched.push(topTile);
            }
        }
        // 하단
        const bottomTile = (tile.tileH < this.mapHeight-1) ? this.map[tile.tileW][tile.tileH+1]: null;
        if( bottomTile && bottomTile.level === tile.level ) {
            if( matched.indexOf(bottomTile) === -1 ) {
                matched.push(bottomTile);
            }
        }
        // 좌측
        const leftTile = (tile.tileW > 0) ? this.map[tile.tileW-1][tile.tileH] : null;
        if( leftTile && leftTile.level === tile.level ) {
            if( matched.indexOf(leftTile) === -1 ) {
                matched.push(leftTile);
            }
        }
        // 우측
        const rightTile = (tile.tileW < this.mapWidth-1) ? this.map[tile.tileW+1][tile.tileH] : null;
        if( rightTile && rightTile.level === tile.level ) {
            if( matched.indexOf(rightTile) === -1 ) {
                matched.push(rightTile);
            }
        }
        // 좌상단타일은 상단이나 좌측타일이 같을경우만 처리
        const leftTopTile = (tile.tileW > 0 && tile.tileH > 0 ) ? this.map[tile.tileW-1][tile.tileH-1] : null;
        if( leftTopTile && leftTopTile.level === tile.level ) {

            if( leftTopTile.level === topTile.level || leftTopTile.level === leftTile.level ) {
                if( matched.indexOf(leftTopTile) === -1 ) {
                    matched.push(leftTopTile);
                }
            }
        }
        // 우상단타일은 상단이나 우측 타일이 같을 경우만 처리
        const rightTopTile = (tile.tileW < this.mapWidth-1 && tile.tileH > 0) ? this.map[tile.tileW+1][tile.tileH-1] : null;
        if( rightTopTile && rightTopTile.level === tile.level ) {
            
            if( rightTopTile.level === topTile.level || rightTopTile.level === rightTile.level ) {
                if( matched.indexOf(rightTopTile) === -1 ) {
                    matched.push(rightTopTile);
                }
            }
        }
        // 좌하단타일은 좌측이나 하단 타일이 같을 경우만
        const leftBottomTile = (tile.tileW > 0 && tile.tileH < this.mapHeight-1) ? this.map[tile.tileW-1][tile.tileH+1] : null;
        if( leftBottomTile && leftBottomTile.level === tile.level ) {

            if( leftBottomTile.level === leftTile.level || leftBottomTile.level === bottomTile.level ) {
                if( matched.indexOf(leftBottomTile) === -1 ) {
                    matched.push(leftBottomTile);
                }
            }
        }
        // 우하단타일은 우측이나 하단 타일이 같을 경우만
        const rightBottomTile = (tile.tileW < this.mapWidth-1 && tile.tileH < this.mapHeight-1) ? this.map[tile.tileW+1][tile.tileH+1] : null;
        if( rightBottomTile && rightBottomTile.level === tile.level ) {

            if( rightBottomTile.level === rightTile.level || rightBottomTile.level === bottomTile.level ) {
                if( matched.indexOf(rightBottomTile) === -1 ) {
                    matched.push(rightBottomTile);
                }
            }
        }
        // 대상타일 기준 상하좌우 2간격 거리 체크
        const topDoubleTile = (tile.tileH-1 > 0) ? this.map[tile.tileW][tile.tileH-2]: null;
        if( topDoubleTile && topDoubleTile.level === tile.level && topDoubleTile.level === topTile.level ) {
            if( matched.indexOf(topDoubleTile) === -1 ) {
                matched.push(topDoubleTile);
            }
        }
        const bottomDoubleTile = (tile.tileH+1 < this.mapHeight-1) ? this.map[tile.tileW][tile.tileH+2]: null;
        if( bottomDoubleTile && bottomDoubleTile.level === tile.level && bottomDoubleTile.level === bottomTile.level ) {
            if( matched.indexOf(bottomDoubleTile) === -1 ) {
                matched.push(bottomDoubleTile);
            }
        }
        const leftDoubleTile = (tile.tileW-1 > 0) ? this.map[tile.tileW-2][tile.tileH] : null;
        if( leftDoubleTile && leftDoubleTile.level === tile.level && leftDoubleTile.level === leftTile.level ) {
            if( matched.indexOf(leftDoubleTile) === -1 ) {
                matched.push(leftDoubleTile);
            }
        }
        const rightDoubleTile = (tile.tileW+1 < this.mapWidth-1) ? this.map[tile.tileW+2][tile.tileH] : null;
        if( rightDoubleTile && rightDoubleTile.level === tile.level && rightDoubleTile.level === rightTile.level ) {
            if( matched.indexOf(rightDoubleTile) === -1 ) {
                matched.push(rightDoubleTile);
            }
        }

        // 매치된 타일 처리
        if( matched.length >= 3 ) {
            let newLevelNumber = tile.level;
            newLevelNumber++;
            const zeroTile = this.modelMgr.getModelByLevelNumber(0);
            const levelUpTileSource = this.modelMgr.getModelByLevelNumber(newLevelNumber);
            if( levelUpTileSource ) { // 레벨업 타일이 있다면 다른 타일들을 제거하고 새 타일로 교체함

                // 제거
                for(let i = 0; i < matched.length; i++) {
                    if( matched[i].tileW === tile.tileW && matched[i].tileH === tile.tileH ) { 

                        // 대상타일은 제거후 생성
                        levelUpTileSource.position.copy(matched[i].object.position);
                        this.deleteTileObject(<Mesh>matched[i].object, tile, () =>{
                            // 대상타일 제거가 완료되면 레벨업 타일을 생성
                            levelUpTileSource.position.y = -30;
                            this.scene.add(levelUpTileSource);
                            // 생성 애니메이션 처리
                            new TWEEN.default.Tween(levelUpTileSource.position)
                            .to({
                                y:0
                            }, 250)
                            .easing(TWEEN.default.Easing.Quadratic.Out)
                            .onComplete(()=>{
                                matched[i].object = levelUpTileSource;
                                matched[i].level = newLevelNumber;
                                
                                // 매치된 타일처리후에 매치된것이 있을수 있으므로
                                this.checkTriple(matched[i]);
                            })
                            .start();
                        });

                    } else {

                        // 대상타일이 아닌것은 0레벨 타일로 교체
                        const emptyTile = zeroTile;
                        emptyTile.position.copy(matched[i].object.position);
                        this.scene.add(emptyTile);

                        this.deleteTileObject(<Mesh>matched[i].object, tile);
                        matched[i].object = emptyTile;
                        matched[i].level = 0;
                    }
                }

            } else { // 최대레벨이 3매치가 성사되었다면

                // 매치된 타일 전체를 제거하고, 빈타일로 만든다.
                for(let i = 0; i < matched.length; i++) {
                    const emptyTile = zeroTile;
                    emptyTile.position.copy(matched[i].object.position);
                    this.scene.add(emptyTile);

                    this.deleteTileObject(<Mesh>matched[i].object, tile);
                    matched[i].object = emptyTile;
                    matched[i].level = 0;
                }
                console.warn('최대레벨 타일 매치됨.');
            }
        }
    }

    /**
     * 제거 대상 타일 객체를 애니메이션을 적용하여 제거한다.
     * @param target 제거 대상
     * @param tile 애니메이션 목표 대상 타일
     */
    deleteTileObject(target: Mesh, tile: Tile, onComplete?: Function) {

        // 제거하면서 점수 처리
        this.scoreMgr.addScore(tile.level);

        // 투명 처리를 할것이므로 재질을 복제처리한다.
        if (target.material instanceof Array) {

            for (let i = 0; i < target.material.length; i++) {
                const clonedMaterial = target.material[i];
                clonedMaterial.transparent = true;
            }

        } else {

            const clonedMaterial = target.material;
            clonedMaterial.transparent = true;

        }

        // 애니메이션 처리
        new TWEEN.default.Tween({
            opacity: 1.0
        }).to({
            opacity: 0.0
        }, 250)
        .easing(TWEEN.default.Easing.Quadratic.Out)
        .onUpdate((data)=>{

            // 재질투명도 조절
            if (target.material instanceof Array) {
                for (let i = 0; i < target.material.length; i++) {
                    const material = target.material[i];
                    material.opacity = data.opacity;
                }
            } else {
                target.material.opacity = data.opacity;
            }
        })
        .onComplete((data)=>{
            // 애니메이션이 완료되면 씬에서 제거하고 재질의 메모리를 해제
            this.scene.remove(target);

            if (target.material instanceof Array) {
                for (let i = 0; i < target.material.length; i++) {
                    const material = target.material[i];
                    material.dispose();
                }
            } else {
                target.material.dispose();
            }

            if( onComplete ) {
                onComplete();
            }
        })
        .start();
    }
}