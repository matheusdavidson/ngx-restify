import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, cloneDeep, isFunction, isEmpty, isEqual, omit } from 'lodash';
import { Observable, PartialObserver } from 'rxjs';
import { RConfig } from './interfaces/r-config';
import { RStorage } from './interfaces/r-storage';
import { ROptions } from './interfaces/r-options';
import { RApi } from './interfaces/r-api';

/**
 * Restify
 *
 * @description Handle HTTP request for Rest API's on Angular with RxJS and Caching
 * @export
 * @class Restify
 * @implements {RApi}
 */
export class Restify implements RApi {
    //
    // Config
    private endpoint: string = null;
    private storage: RStorage = null;
    private httpClient: HttpClient;
    private defaultOptions: ROptions = {
        saveNetwork: true,
        query: []
    };

    //
    // Options
    private options: ROptions = this.defaultOptions;

    /**
     * Creates an instance of Restify.
     * @param {RConfig} [config={}]
     * @memberof Restify
     */
    constructor(private config: RConfig = {}) {
        //
        // Merge restify config
        merge(this, this.config);

        //
        // Validate config
        const invalidConfig = this.hasInvalidConfig();
        if (invalidConfig) throw new Error(<string>invalidConfig);

        //
        // Inject things
        // this.http = this.injector.get(HttpClient);
    }

    public set(id: string = null, model: any = {}, path: any = '', primaryKey: string = null): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Define an unique key
        _options.key = _options.key || this.endpoint + path + id;

        //
        // Force options
        _options.useNetwork = true;
        _options.useCache = false;

        //
        // Set data
        const data = {
            model: model,
            id: id,
            primaryKey: primaryKey
        };

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'put', path, _options, data);
        });
    }

    public find(filters: any = {}, path: any = 'find'): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Set data
        const data = filters;

        //
        // Set where query
        data.query = _options.query;

        //
        // Define an unique key
        _options.key = _options.key || this.endpoint + path + `/${JSON.stringify(data)}`;

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'post', path, _options, data);
        });
    }

    public findOne(filters: any = {}, path: any = 'find-one'): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Set data
        const data = filters;

        //
        // Set where query
        data.query = _options.query;

        //
        // Define an unique key
        _options.key = _options.key || this.endpoint + path + `/${JSON.stringify(data)}`;

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'post', path, _options, data);
        });
    }

    public toggle(id: string = null, filters: any = {}, path: string = 'toggle'): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Set path
        const _path = `${id}/${path}`;

        //
        // Set data
        const data = filters;

        //
        // Set where query
        data.query = _options.query;

        //
        // Define an unique key
        _options.key = _options.key || this.endpoint + _path + `/${JSON.stringify(data)}`;

        //
        // Force options
        _options.useNetwork = true;
        _options.useCache = false;

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'post', _path, _options, data);
        });
    }

    public get(path: string = ''): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'get', path, _options);
        });
    }

    public post(path: string = '', data: any = {}): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Define an unique key
        _options.key = _options.key || this.endpoint + path + `/${JSON.stringify(data)}`;

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'post', path, _options, data);
        });
    }

    public put(path: string = '', data: any = {}): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Define an unique key
        _options.key = _options.key || this.endpoint + path + `/${JSON.stringify(data)}`;

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'put', path, _options, data);
        });
    }

    public delete(path: string = ''): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Force options
        _options.useNetwork = true;
        _options.useCache = false;

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'delete', path, _options);
        });
    }

    /**
     * Set whether to use network for first requests
     *
     * @param {boolean} active
     * @returns
     * @memberof Restify
     */
    public useNetwork(active: boolean) {
        this.options.useNetwork = active;
        return this;
    }

    /**
     * Set whether to cache network responses
     *
     * @param {boolean} active
     * @returns
     * @memberof Restify
     */
    public saveNetwork(active: boolean) {
        this.options.saveNetwork = active;
        return this;
    }

    /**
     * Set transform fn for network responses
     *
     * @param {(response: RRResponse) => any} transformFn
     * @returns
     * @memberof Restify
     */
    public transformNetwork(transformFn: (response: any) => any) {
        this.options.transformNetwork = transformFn;
        return this;
    }

    /**
     * Set cache time to live
     *
     * @param {number} value
     * @returns
     * @memberof Restify
     */
    public ttl(value: number) {
        this.options.ttl = value;
        return this;
    }

    /**
     * Set whether to use cache for first requests
     *
     * @param {boolean} active
     * @returns
     * @memberof Restify
     */
    public useCache(active: boolean) {
        this.options.useCache = active;
        return this;
    }

    /**
     * Set transform fn for cache
     *
     * @param {(response: RRResponse) => any} transformFn
     * @returns
     * @memberof Restify
     */
    public transformCache(transformFn: (response: any) => any) {
        this.options.transformCache = transformFn;
        return this;
    }

    /**
     * Set cache key
     *
     * @param {string} name
     * @returns
     * @memberof Restify
     */
    public key(name: string) {
        this.options.key = name;
        return this;
    }

    /**
     * Set request where
     *
     * @param {string} field
     * @param {string} operator
     * @param {any} value
     * @returns
     * @memberof Restify
     */
    public where(field: string, operator: string, value: any) {
        //
        // Validate query
        if (isEmpty(this.options.query)) {
            this.options.query = [];
        }

        //
        // Push to query
        this.options.query.push({
            field: field,
            operator: operator,
            value: value
        });

        //
        // Return chain
        return this;
    }

    /**
     * Reset
     *
     * @private
     * @memberof Restify
     */
    private reset(): void {
        this.options = cloneDeep(this.defaultOptions);
    }

    /**
     * Get options
     *
     * @description Get options added by the user during the query
     * @private
     * @returns {ROptions}
     * @memberof Restify
     */
    private getOptions(): ROptions {
        //
        // Clone options
        const _options: ROptions = cloneDeep(this.options);

        //
        // Reset
        this.reset();

        return _options;
    }

    /**
     * Get path
     *
     * @description Get the full path for the request
     * @private
     * @param {string} path
     * @returns {string}
     * @memberof Restify
     */
    private getPath(path: string): string {
        return `${this.endpoint}${path}`;
    }

    /**
     * Has invalid config
     *
     * @description check for invalid config
     * @private
     * @returns {(string | boolean)}
     * @memberof Restify
     */
    private hasInvalidConfig(): string | boolean {
        //
        // Validate injector
        if (!this.httpClient) throw new Error('{RESTIFY ERROR}: missing http instance');

        //
        // Validate endpoint
        if (!this.endpoint) return '{RESTIFY ERROR}: endpoint needed';

        //
        // Validate storage
        if (!this.storage) throw new Error('{RESTIFY ERROR}: missing storage instance');

        //
        // Valid config
        return false;
    }

    /**
     * Run observable
     *
     * @description Run observable which will take care of networking and caching
     * @private
     * @param {PartialObserver<any>} observer
     * @param {string} [method='get']
     * @param {string} path
     * @param {ROptions} [options={}]
     * @param {*} [data={}]
     * @memberof Restify
     */
    private runObservable(observer: PartialObserver<any>, method: string = 'get', path: string, options: ROptions = {}, data: any = {}) {
        //
        // Set request path
        path = this.getPath(path);

        //
        // Set key
        options.key = options.key || path;

        //
        // Use network directly
        if (options.useNetwork) {
            this.runNetwork(observer, options, path, method, data);
        } else {
            const cache = this.getCache(observer, options, path, method, data);
        }
    }

    /**
     * Run network
     *
     * @private
     * @param {PartialObserver<any>} observer
     * @param {ROptions} [options={}]
     * @param {string} path
     * @param {string} [method='get']
     * @param {*} [data={}]
     * @memberof Restify
     */
    private runNetwork(observer: PartialObserver<any>, options: ROptions = {}, path: string, method: string = 'get', data: any = {}) {
        this.httpClient[method](path, data).subscribe(
            response => {
                //
                // Set cache
                this.setCache(observer, options, response);

                return;
            },
            error => {
                //
                // error callback
                observer.error(error);
                observer.complete();

                return;
            }
        );
    }

    /**
     * Get cache
     *
     * @private
     * @param {PartialObserver<any>} observer
     * @param {ROptions} [options={}]
     * @returns
     * @memberof Restify
     */
    private async getCache(observer: PartialObserver<any>, options: ROptions = {}, path: string, method: string = 'get', data: any = {}) {
        //
        // Get current cache
        const cache: any /*RRResponse*/ & { ttl: number } = await this.storage.get(options.key);

        //
        // Set transform network method
        const transformNetwork: any = isFunction(options.transformNetwork) ? options.transformNetwork : (data: any) => data;

        //
        // Return cached response emmediately to view
        if (options.useCache && cache && !isEmpty(cache.data)) {
            observer.next(transformNetwork(cache));
        }

        //
        // Return TTL and skip network ?
        const seconds = new Date().getTime() / 1000 /*/ 60 / 60 / 24 / 365*/;
        if (options.useCache && (cache && seconds < cache.ttl) && !isEmpty(cache.data)) {
            console.log(`dont call network`);
            observer.complete();
            return false;
        }

        //
        // No TTL, normal call
        return this.runNetwork(observer, options, path, method, data);
    }

    /**
     * Set cache
     *
     * @private
     * @param {PartialObserver<any>} observer
     * @param {ROptions} [options={}]
     * @param {*} [networkResponse={}]
     * @memberof Restify
     */
    private async setCache(observer: PartialObserver<any>, options: ROptions = {}, networkResponse: any = {}) {
        //
        // Get current cache
        const cache: any /*RRResponse*/ & { ttl: number } = await this.storage.get(options.key);

        //
        // Set transform cache method
        const transformCache: any = isFunction(options.transformCache) ? options.transformCache : (data: any) => data;

        //
        // Set transform network method
        const transformNetwork: any = isFunction(options.transformNetwork) ? options.transformNetwork : (data: any) => data;

        //
        // return network response only if different from cache
        if ((cache && !isEqual(cache.data, networkResponse.data)) || (cache && isEmpty(cache.data)) || !cache) {
            //
            // return network response
            observer.next(transformNetwork(networkResponse));

            //
            // Update cache
            const seconds = new Date().getTime() / 1000 /*/ 60 / 60 / 24 / 365*/;
            if (options.saveNetwork && ((isEmpty(networkResponse.data) && cache) || isEmpty(cache) || (cache && seconds >= cache.ttl))) {
                // console.log(`${key} cache empty or updated`);
                let ttl = options.ttl /*|| this.params.ttl*/ || 0;
                //
                // set cache response
                ttl += seconds;
                networkResponse.ttl = ttl;

                this.storage.set(
                    options.key,
                    transformCache(omit(networkResponse, ['config', 'request', 'response.config', 'response.data', 'response.request']))
                );
            }
        }

        //
        // Force network return
        else {
            observer.next(transformNetwork(networkResponse));
        }

        //
        // Complete observer
        observer.complete();
    }
}
