/**
 * Storage adapter
 * you can use any class that implements this interface
 * either the package `ionic-storage`(https://github.com/ionic-team/ionic-storage)
 *
 * @export
 * @interface RStorage
 */
export interface RStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<any>;
  remove(key: string): Promise<any>;
  clear(): Promise<void>;
}
