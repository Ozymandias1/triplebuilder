import {Core} from './core';
import * as path from 'path';

interface DragedFile extends File {
    path: string;
}

export class FileDragDrop {

    private core: Core;

    constructor(core: Core) {
        
        this.core = core;

        document.addEventListener('dragover', this.onDragOver.bind(this), false);
        document.addEventListener('drop', this.onDrop.bind(this), false);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {

        if( event.dataTransfer.files.length > 0 ) {
            const objFile = <DragedFile>event.dataTransfer.files[0];
            
            const dirName = path.dirname(objFile.path);
            const fileNameOnly = path.basename(objFile.path, '.obj');

            this.core.loadModel({
                dirPath: dirName + '\\',
                objName: fileNameOnly + '.obj',
                mtlName: fileNameOnly + '.mtl'
            }, null);
            
        }
        event.preventDefault();
    }
}