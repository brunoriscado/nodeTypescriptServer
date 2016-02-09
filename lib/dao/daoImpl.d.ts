/// <reference path="dao.d.ts" />
export declare class InMemoryUserDAO implements DAO.DAO<Model.IUser> {
    private id;
    private users;
    constructor();
    create(user: Model.IUser): Model.IUser;
    read(id: number): Model.IUser;
    update(user: Model.IUser): boolean;
    delete(id: number): boolean;
}
