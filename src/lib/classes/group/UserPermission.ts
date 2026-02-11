export class UserPermission {
    username: string;
    permission: string;

    constructor(data: any) {
        this.username = data.username;
        this.permission = data.permission;
    }
}