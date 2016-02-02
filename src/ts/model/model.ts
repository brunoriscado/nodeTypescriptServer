module Model {
    export interface Identifiable {
        id?: number;
    }

    export interface IUser extends Identifiable {
        firstname: string;
        lastname: string;
        age: number;
    }

    export class User implements IUser {
        private _firstname: string;
        private _lastname: string;
        private _age: number;

        constructor(firstname: string, lastname: string, age: number) { 
            this._firstname = firstname;
            this._lastname = lastname;
            this._age = age;
        }

        public get firstname() {
            return this._firstname;
        }

        public get lastname() {
            return this._lastname;
        }
        
        public get age() {
            return this._age;
        }
    }
}