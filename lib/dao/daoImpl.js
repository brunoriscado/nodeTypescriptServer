/// <reference path="dao.ts" />
class InMemoryUserDAO {
    constructor() {
        this.id = 1;
        this.users = {
            0: { id: 0, firstname: 'first', lastname: 'last', age: 42 }
        };
    }
    create(user) {
        user.id = this.id;
        this.id++;
        this.users[user.id] = user;
        return user;
    }
    read(id) {
        return this.users[id];
    }
    update(user) {
        if (this.users[user.id] === null) {
            return false;
        }
        this.users[user.id] = user;
        return true;
    }
    delete(id) {
        if (this.users[id] === null) {
            return false;
        }
        this.users[id] = null;
        return true;
    }
}
exports.InMemoryUserDAO = InMemoryUserDAO;
//# sourceMappingURL=daoImpl.js.map