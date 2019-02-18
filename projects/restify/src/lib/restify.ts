import { merge, cloneDeep, isFunction, isEmpty, isEqual, omit } from 'lodash';
import { Observable, PartialObserver } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RConfig } from './interfaces/r-config';
import { RStorage } from './interfaces/r-storage';
import { ROptions } from './interfaces/r-options';

export class Restify {
    private endpoint: string = null;
    private storage: RStorage = null;
    private options: ROptions = {};

    constructor(private config: RConfig = {}, public http: HttpClient) {
        //
        // Merge restify config
        merge(this, this.config);

        //
        // Validate config
        const invalidConfig = this.hasInvalidConfig();
        if (invalidConfig) throw new Error(<string>invalidConfig);
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

    public post(path: string = ''): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'post', path, _options);
        });
    }

    public put(path: string = ''): Observable<any> {
        //
        // Get options
        const _options: ROptions = this.getOptions();

        //
        // Create observable
        return new Observable((observer: PartialObserver<any>) => {
            //
            // Run observable
            this.runObservable(observer, 'put', path, _options);
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
     * Reset
     *
     * @private
     * @memberof Restify
     */
    private reset(): void {
        this.options = {};
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
            this.getCache(observer, options);
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
        this.http[method](path, data).subscribe(
            response => {
                //
                // Set cache
                this.setCache(observer, options);

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
    private async getCache(observer: PartialObserver<any>, options: ROptions = {}) {
        //
        // Get current cache
        const cache: any /*RRResponse*/ & { ttl: number } = await this.storage.get(options.key);

        //
        // Set transform network method
        const transformNetwork: any = isFunction(options.transformNetwork) ? options.transformNetwork : (data: any) => data;

        //
        // Return cached response emmediately to view
        if (options.useCache && cache && !isEmpty(cache.data)) observer.next(transformNetwork(cache));

        //
        // Return TTL and skip network ?
        const seconds = new Date().getTime() / 1000 /*/ 60 / 60 / 24 / 365*/;
        if (options.useCache && (cache && seconds < cache.ttl) && !isEmpty(cache.data)) {
            // console.log(`dont call network`);
            observer.complete();
            return false;
        }

        //
        // No TTL, normal call
        return true;
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
        else if (options.useNetwork) {
            observer.next(transformNetwork(networkResponse));
        }

        //
        // Complete observer
        observer.complete();
    }
}
