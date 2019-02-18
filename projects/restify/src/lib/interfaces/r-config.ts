import { RStorage } from './r-storage';

/**
 * Config
 * configuration needed for restify class
 *
 * @export
 * @interface RConfig
 */
export interface RConfig {
    endpoint?: string; // eg: http://localhost:9000/api/,
    storage?: RStorage;
}
