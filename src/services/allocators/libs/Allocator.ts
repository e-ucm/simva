export class Allocator {
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
}