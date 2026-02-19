export class ActivityCompletion {
    /**
     * ID of the activity completion record
     */
    activity_id: number;

    /**
     * ID of the participant associated with this completion record
     */
    participant_id: number;

    /**
     * Completion status (e.g., 'completed', 'incomplete')
     */
    status: string;

    /**
     * Result score (if applicable)
     */
    result: number;

    /**
     * Timestamp of when the activity was completed
     */
    completed_at: Date;

    /**
     * Creates a new ActivityCompletion instance
     * @param {any} data - Raw data object containing completion record properties
     * @description Initializes activity completion data including status, result, and timestamps.
     */
    constructor(data: any) {
        this.activity_id = data.activity_id;
        this.participant_id = data.participant_id;
        this.status = data.status;
        this.result = data.result;
        this.completed_at = new Date(data.completed_at);
    }
}