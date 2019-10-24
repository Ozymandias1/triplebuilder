declare namespace Ammo {

    export class btDefaultCollisionConfiguration{        
    }

    export class btCollisionDispatcher {
        constructor(config: btDefaultCollisionConfiguration);
    }

    export class btDbvtBroadphase{}

    export class btSequentialImpulseConstraintSolver{}

    export class btDiscreteDynamicsWorld{
        constructor(
            dispatcher: btCollisionDispatcher,
            broadPhase: btDbvtBroadphase,
            solver: btSequentialImpulseConstraintSolver,
            config: btDefaultCollisionConfiguration
        );
        setGravity(gravity:btVector3);
        addRigidBody(body: btRigidBody);
        stepSimulation( deltaTime: number, arg: number);
    }

    export class btVector3 {
        x(): number;
        y(): number;
        z(): number;
        
        constructor(
            x: number,
            y: number,
            z: number
        );

        setValue(
            x: number,
            y: number,
            z: number
        );

        threeObject: any;
    }

    export class btQuaternion{
        x(): number;
        y(): number;
        z(): number;
        w(): number;

        constructor(
            x: number,
            y: number,
            z: number,
            w: number
        );
    }

    export class btTransform{
        setIdentity();
        setOrigin(origin: btVector3);
        setRotation(rotation: btQuaternion);
        getOrigin(): btVector3;
        getRotation(): btQuaternion;
    }

    export class btDefaultMotionState{
        constructor(state: btTransform);
    }

    export class btRigidBodyConstructionInfo {
        constructor(
            mass: number,
            motionState: btDefaultMotionState,
            physicsShape: btCollisionShape,
            localInertia: btVector3
        );
    }

    export class btRigidBody {
        constructor(rbInfo: btRigidBodyConstructionInfo);
        setFriction(friction:number);
        setLinearVelocity(vel: btVector3);
        setAngularVelocity(vel: btVector3);
        setActivationState(state: number);
        setUserPointer(data: any);
    }

    // Shapes
    export class btCollisionShape{
        setMargin(margin: number);
        calculateLocalInertia(mass: number, inertia: btVector3);
    }
    export class btConvexShape extends btCollisionShape {}
    export class btConvexInternalShape extends btConvexShape{}
    export class btPolyhedralConvexShape extends btConvexInternalShape{}
    export class btBoxShape extends btPolyhedralConvexShape{
        constructor(size: btVector3);
    }
    export class btPolyhedralConvexAabbCachingShape extends btPolyhedralConvexShape{}
    export class btConvexHullShape extends btPolyhedralConvexAabbCachingShape {
        addPoint(point: btVector3, isLast: boolean);
    }
}