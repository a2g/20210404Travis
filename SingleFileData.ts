
export class SingleFileData {
    constructor(name: string, isVisible: boolean) {
        this.name = name;
        this.isVisible = isVisible;
        this.tickCount = 0;
    }
    name: string;
    tickCount: number;
    isVisible: boolean;
};
