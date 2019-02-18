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
    post(path: string): Observable<any>;
    put(path: string): Observable<any>;
    delete(path: string): Observable<any>;
}
