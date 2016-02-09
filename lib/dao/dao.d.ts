/// <reference path="../model/model.d.ts" />
declare module DAO {
    interface DAO<T extends Model.Identifiable> {
        create(t: T): T;
        read(id: number): T;
        update(t: T): boolean;
        delete(id: number): boolean;
    }
}
