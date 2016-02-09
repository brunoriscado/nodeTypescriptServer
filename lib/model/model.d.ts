declare module Model {
    interface Identifiable {
        id?: number;
    }
    interface IUser extends Identifiable {
        firstname: string;
        lastname: string;
        age: number;
    }
    class User implements IUser {
        private _firstname;
        private _lastname;
        private _age;
        constructor(firstname: string, lastname: string, age: number);
        firstname: string;
        lastname: string;
        age: number;
    }
}
