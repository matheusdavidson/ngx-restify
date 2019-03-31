import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

/**
 * Public Restify API
 *
 * @export
 * @interface RApi
 */
export interface RApi {

    //
    // Blueprints
    set(id: string, model: any, path: any, primaryKey: string): Observable<any>;
    find(filters: any, path: any): Observable<any>;
    findOne(filters: any, path: any): Observable<any>;
    toggle(id: string, filters: any, path: any): Observable<any>;

    //
    // HTTP
    get(path: string, data: HttpParams): Observable<any>;
    post(path: string, data: any): Observable<any>;
    put(path: string, data: any): Observable<any>;
    delete(path: string): Observable<any>;

    //
    // Chaining
    useNetwork(active: boolean);
    saveNetwork(active: boolean);
    transformNetwork(transformFn: (response: any) => any);
    ttl(value: number);
    useCache(active: boolean);
    transformCache(transformFn: (response: any) => any);
    key(name: string);
    where(field: string, operator: string, value: any);
}
