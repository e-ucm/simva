export class ActivityMappingResult<T> {
    map: Map<number, T>;

    constructor(data: Map<number, T>) {
        this.map = data;
    }

    get(key: number) {
        return this.map.get(key);
    }

    set(key: number, value: T) {
		this.map.set(key, value);
	}

    toJSON(): Record<string, T> {
        return Object.fromEntries(this.map || []);
    }
}