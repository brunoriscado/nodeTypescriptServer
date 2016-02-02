var Model;
(function (Model) {
    class User {
        constructor(firstname, lastname, age) {
            this._firstname = firstname;
            this._lastname = lastname;
            this._age = age;
        }
        get firstname() {
            return this._firstname;
        }
        get lastname() {
            return this._lastname;
        }
        get age() {
            return this._age;
        }
    }
    Model.User = User;
})(Model || (Model = {}));

//# sourceMappingURL=../../../maps/src/ts/model/model.js.map
