export class ActivityMappingResult<T = any> {

    map: Map<number, T>;

    constructor(data: Map<number, T>) {
        this.map = data;
    }

    toJSON(): Record<string, any> {
        return Object.fromEntries(this.map || []);
    }
}