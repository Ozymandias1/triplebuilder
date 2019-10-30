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
    PCFSoftShadowMap,
    BoxBufferGeometry,
    Vector3,
    Quaternion,
    Object3D,
    Material,
    Clock,
    Math as THREEMATH,
    Box3,
    BoxHelper
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {FileDragDrop} from './fileDragDrop';
import {ModelLoader, URLData} from './modelLoader';
import './ammojsDeclare';

/**
 * WebGL 코어
 */
export class Core {

    private scene: Scene;
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private control: OrbitControls;
    private grid: GridHelper;
    private clock: Clock;
    
    private hemiLight: HemisphereLight;
    private dirLight: DirectionalLight;

    private fileDragDropHandler: FileDragDrop;
    private modelLoader: ModelLoader;

    // 에디팅
    private prevSelectHelper: BoxHelper;

    private collisionConfiguration : Ammo.btDefaultCollisionConfiguration;
    private dispatcher: Ammo.btCollisionDispatcher;
    private broadPhase: Ammo.btDbvtBroadphase;
    private solver: Ammo.btSequentialImpulseConstraintSolver;
    private physicsWorld: Ammo.btDiscreteDynamicsWorld;
    private transformAux1: Ammo.btTransform;
    private tempBtVec3_1: Ammo.btVector3;
    private rigidBodies: Array<Object3D>;
    private physicsMargin: number;

    // 테스트용 변수
    private savedRigidBody: Array<Ammo.btRigidBody>;
    private savedVelocity: Array<Vector3>;

    /**
     * 생성자
     */
    constructor() {

        this.clock = new Clock();

        // 렌더러
        this.renderer = new WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
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

        this.dirLight = new DirectionalLight( 0xffffff, 0.6 );
        this.dirLight.color.setHSL( 0.1, 1, 0.95 );
        this.dirLight.position.set( - 1, 1.75, 1 );
        this.dirLight.position.multiplyScalar( 30 );
        this.scene.add( this.dirLight );

        const shadowMapDist = 100;
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
        this.control.rotateSpeed = 0.5;
        
        // 바닥 그리드
        //this.grid = new GridHelper(100, 100, 0xff0000, 0x000000);
        //this.scene.add(this.grid);
        // // 바닥평면
        // const planeGeometry = new PlaneGeometry(100, 100, 1, 1);
        // planeGeometry.rotateX(Math.PI * -0.5);
        // const planeMaterial = new MeshPhongMaterial({
        //     color: 0xcccccc
        // });
        // const plane = new Mesh(planeGeometry, planeMaterial);
        // plane.castShadow = false;
        // plane.receiveShadow = true;
        // this.scene.add(plane);

        // 파일 드래그앤드랍 핸들러, 경로 문제로 보류
        //this.fileDragDropHandler = new FileDragDrop(this);
        // 모델 로더
        this.modelLoader = new ModelLoader(this.scene);
        // 물리요소 초기화
        this.initPhysics();


        // 창크기변경 이벤트 처리 등록
        window.addEventListener('resize', this.onResize.bind(this), false);

        // 렌더링 루프 시작
        this.render();
    }

    /**
     * 물리엔진 초기화
     */
    private initPhysics() {

        this.collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadPhase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.broadPhase, this.solver, this.collisionConfiguration);        
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -7.8, 0));

        this.rigidBodies = [];
        this.physicsMargin = 0.01;
        this.transformAux1 = new Ammo.btTransform();
        this.tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);

        // 바닥판 생성
		var pos = new Vector3();
        var quat = new Quaternion();
        pos.set( 0, - 0.5, 0 );
        quat.set( 0, 0, 0, 1 );

        const mass = 0;
        const groundWidth = 1000, groundHeight = 1000, groundThickness = 1;
        const ground = new Mesh(
            new BoxBufferGeometry(groundWidth, groundThickness, groundHeight, 1, 1, 1),
            new MeshPhongMaterial({ color: 0xffffff })
        );
        const groundShape = new Ammo.btBoxShape( new Ammo.btVector3( groundWidth * 0.5, groundThickness * 0.5, groundHeight * 0.5));
        groundShape.setMargin(this.physicsMargin);
        this.createRigidBody(ground, groundShape, mass, pos, quat, null, null );
        ground.receiveShadow = true;

        // // 테스트 객체
        // var bridgeMass = 100;
        // var bridgeHalfExtents = new Vector3( 7, 0.2, 1.5 );
        // pos.set( 0, 10.2, 0 );
        // quat.set( 0, 0, 0, 1 );
        // this.createPhysicsObject( bridgeMass, bridgeHalfExtents, pos, quat, new MeshPhongMaterial({color:0xB3B865}) );

        // for(let i = 0; i < 500; i++) {
        //     var boxMass = 100;
        //     var boxHalfExtends = new Vector3( 2.5, 2.5, 2.5 );
        //     pos.set( THREEMATH.randFloatSpread(100), THREEMATH.randFloat(10, 100), THREEMATH.randFloatSpread(100) );
        //     quat.set( 0, 0, 0, 1 );
        //     this.createPhysicsObject( boxMass, boxHalfExtends, pos, quat, new MeshPhongMaterial({color:0xB3B865}) );
        // }

    }

    private createPhysicsObject( 
        mass: number, 
        halfExtents: Vector3,
        pos: Vector3, 
        quat: Quaternion, 
        material: Material){
        
        const object = new Mesh( new BoxBufferGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ), material );
        object.position.copy( pos );
        object.quaternion.copy( quat );
        
        object.userData.mass = mass;
        object.castShadow = true;
        object.receiveShadow = true;

        const shape = this.createConvexHullPhysicsShape( (<any>object.geometry).attributes.position.array );
        shape.setMargin( this.physicsMargin );

        const physicsBody = this.createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

        const btVecUserData = new Ammo.btVector3(0, 0, 0);
        btVecUserData.threeObject = object;
        physicsBody.setUserPointer( btVecUserData );
    }

    private createPhysicsObjectByMesh(
        mesh: Mesh,
        mass: number
    ) {

        mesh.userData.mass = mass;

        const shape = this.createConvexHullPhysicsShape( (<any>mesh.geometry).attributes.position.array );
        shape.setMargin( this.physicsMargin );

        const physicsBody = this.createRigidBody( mesh, shape, mesh.userData.mass, null, null, mesh.userData.velocity, mesh.userData.mass.angularVelocity );
        
        const btVecUserData = new Ammo.btVector3(0, 0, 0);
        btVecUserData.threeObject = mesh;
        physicsBody.setUserPointer( btVecUserData );

    }

    private createConvexHullPhysicsShape( coords: Array<number> ): Ammo.btConvexHullShape {

        const shape = new Ammo.btConvexHullShape();
        for(let i = 0; i < coords.length; i+=3) {
            this.tempBtVec3_1.setValue(coords[i], coords[i+1], coords[i+2]);
            const lastOne = (i >= (coords.length - 3));
            shape.addPoint( this.tempBtVec3_1, lastOne );
        }

        return shape;

    }

    private createRigidBody(
        object: Mesh,
        physicsShape: Ammo.btCollisionShape,
        mass: number,
        pos: Vector3,
        quat: Quaternion,
        vel: Ammo.btVector3,
        angVel: Ammo.btVector3 
    ) {
        if ( pos ) {

            object.position.copy( pos );

        } else {

            pos = object.position;

        }
        if ( quat ) {

            object.quaternion.copy( quat );

        } else {

            quat = object.quaternion;

        }

        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
        var motionState = new Ammo.btDefaultMotionState( transform );

        var localInertia = new Ammo.btVector3( 0, 0, 0 );
        physicsShape.calculateLocalInertia( mass, localInertia );

        var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
        var body = new Ammo.btRigidBody( rbInfo );
        body.setFriction( 0.5 );
        
        if ( vel ) {

            body.setLinearVelocity( new Ammo.btVector3( vel.x(), vel.y(), vel.z() ) );

        }
        if ( angVel ) {

            body.setAngularVelocity( new Ammo.btVector3( angVel.x(), angVel.y(), angVel.z() ) );

        }
        
        object.userData.physicsBody = body;
        object.userData.collided = false;
        this.scene.add( object );

        if ( mass > 0 ) {

            this.rigidBodies.push( object );

            // Disable deactivation
            body.setActivationState( 4 );

        }

        this.physicsWorld.addRigidBody( body );

        return body;
    }

    updatePhysics(deltaTime: number) {

        this.physicsWorld.stepSimulation( deltaTime, 10 );
        
        for ( var i = 0, il = this.rigidBodies.length; i < il; i ++ ) {

            var objThree = this.rigidBodies[ i ];
            var objPhys = objThree.userData.physicsBody;
            var ms = objPhys.getMotionState();

            if ( ms ) {

                ms.getWorldTransform( this.transformAux1 );
                var p = this.transformAux1.getOrigin();
                var q = this.transformAux1.getRotation();
                objThree.position.set( p.x(), p.y(), p.z() );
                objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

                objThree.userData.collided = false;

            }

        }
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

        const deltaTime = this.clock.getDelta();
        this.updatePhysics(deltaTime);

        this.renderer.render(this.scene, this.camera);

    }

    /**
     * 모델 로드
     */
    public loadModel(option: URLData, onLoad: Function) {

        this.savedRigidBody = [];
        this.savedVelocity = [];

        const scope = this;
        this.modelLoader.load(option).then( (result: Array<Mesh> ) => {
            // console.log('core.loadModel succeeded.', result);

            // 중점
            const listBoxData = [];
            for(let i = 0; i < result.length; i++) {
                scope.createPhysicsObjectByMesh(result[i], 100);
                
                scope.physicsWorld.removeRigidBody( result[i].userData.physicsBody );
                scope.savedRigidBody.push(result[i].userData.physicsBody);

                const velocity = result[i].position.clone();
                velocity.normalize();
                velocity.multiplyScalar(10);
                scope.savedVelocity.push(velocity);

                // 리스트박스용 데이터
                listBoxData.push({
                    uuid: result[i].uuid,
                    displayText: result[i].name
                });
            }

            if( onLoad ) {
                onLoad(listBoxData);
            }
        }).catch( (err) => {
            console.error('core.loadModel failed.', err);
        });
    }

    /**
     * 객체 선택
     * @param uuid 객체 고유식별자
     */
    public selectObject(uuid: string) {

        const findObj = this.scene.getObjectByProperty('uuid', uuid);
        if( findObj ) {

            // 이전 헬퍼 제거
            if( this.prevSelectHelper ) {
                this.scene.remove(this.prevSelectHelper);
            }

            // 새 헬퍼 생성
            const helper = new BoxHelper(findObj, new Color(0xffff00));
            this.scene.add(helper);

            this.prevSelectHelper = helper;
        }
    }

    public test() {

        // 모델링 중점 계산

        for(let i = 0; i < this.savedRigidBody.length; i++) {
            const rigidBody = this.savedRigidBody[i];
            const velocity = this.savedVelocity[i];

            this.physicsWorld.addRigidBody(rigidBody);
            rigidBody.setLinearVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
            rigidBody.setAngularVelocity(new Ammo.btVector3(velocity.x, velocity.y, velocity.z));
        }
    }
};

//const core = new Core();