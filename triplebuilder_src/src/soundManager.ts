import { Audio, AudioListener, Camera, AudioLoader } from "three";

/**
 * 사운드 관리자
 */
export class SoundManager {
    
    private camera: Camera;
    private listener: AudioListener;
    private sounds: Record<string, Audio>;

    /**
     * 생성자
     */
    constructor(camera: Camera) {
        this.camera = camera;

        // 오디오 리스너 생성
        this.listener = new AudioListener();
        this.camera.add(this.listener);

        // 위치를 가지는 오디오는 아니므로 non-positional 오디오 생성
        const scope = this;
        this.sounds = {};
        const audioLoader = new AudioLoader();
        // 배경음악
        audioLoader.load('sounds/BGM.wav', (buffer: any) =>{
            
            const sound = new Audio(scope.listener);
            sound.setBuffer(buffer);
            sound.setLoop(true); // 배경음은 반복재생
            sound.setVolume(0.25);
            
            scope.sounds['BGM'] = sound;

        }, null, (err: any) => {
            console.error(err);
        });
        // 건물 생성
        audioLoader.load('sounds/CreateBuilding.wav', (buffer: any) =>{
            
            const sound = new Audio(scope.listener);
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.25);

            scope.sounds['CreateBuilding'] = sound;

        }, null, (err: any) => {
            console.error(err);
        });
        // 스코어취득
        audioLoader.load('sounds/Score.wav', (buffer: any) =>{
            
            const sound = new Audio(scope.listener);
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.25);
            
            scope.sounds['Score'] = sound;

        }, null, (err: any) => {
            console.error(err);
        });
        
        setTimeout(() => {
            // 일단 테스트로 배경음을 클래스 인스턴스 생성시점에서 3초후 재생
            scope.playSound('BGM');
        }, 3000);
        const binder = null;
    }

    /**
     * 마우스 이동
     */
    onMouseMove(event) {

    }
    
    /**
     * 사운드재생
     * @param key 재생할 사운드 키값
     */
    playSound(key: string) {
        if(this.sounds.hasOwnProperty(key)) {
            this.sounds[key].play();
        }
    }
}