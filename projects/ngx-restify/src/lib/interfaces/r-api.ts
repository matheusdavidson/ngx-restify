import { Observable } from 'rxjs';

/**
 * Public Restify API
 *
 * @export
 * @interface RApi
 */
export interface RApi {
    //
    // HTTP
    get(path: string): Observable<any>;
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
}
