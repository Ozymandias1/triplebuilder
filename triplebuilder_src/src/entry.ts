import { Core } from './core';

//export { Core };
window.onload = () =>{
    const app = new Core(function(){
        app.createGame(10, 10);
    });
};