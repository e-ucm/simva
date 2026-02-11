export class Allocator {
    simlet_id: number;
    allocator_id: number;
    allocator_type: string;
    createdAt: Date;
    updatedAt: Date;

    static getType(){
        return 'default';
    }
    
    static getName(){
        return 'Default Allocator';
    }

    static getDescription(){
        return 'A basic allocator that allocate to the first session.';
    }

    static async getUtils(username : string){
        return {};
    }

    async getDetails(){
        return {};
    }

    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.allocator_id = data.allocator_id;
        this.allocator_type = data.allocator_type;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    printInfo() {
        console.log({allocator : this}, `Allocator ID: ${this.allocator_id}, Type: ${this.allocator_type}`);
    }
}