export class ActivityMappingResult<T> {
    map: Map<number, T>;

    constructor(data: Map<number, T>) {
        this.map = data;
    }

    get(key: number) {
        return this.map.get(key);
    }

    toJSON(): Record<string, T> {
        return Object.fromEntries(this.map || []);
    }
}