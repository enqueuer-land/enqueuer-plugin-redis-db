import * as exec from './redis-db-publisher';
import {MainInstance} from 'enqueuer';

export function entryPoint(mainInstance: MainInstance): void {
    exec.entryPoint(mainInstance);
}
