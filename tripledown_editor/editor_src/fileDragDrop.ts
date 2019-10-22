export class FileDragDrop {
    constructor() {
        
        document.addEventListener('dragover', this.onDragOver.bind(this), false);
        document.addEventListener('drop', this.onDrop.bind(this), false);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {
        console.log('FileDragDrop.ts', event.dataTransfer.files);
        event.preventDefault();
    }
}