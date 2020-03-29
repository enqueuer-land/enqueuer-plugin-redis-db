import redis from 'redis';
import {Publisher, InputPublisherModel, MainInstance, PublisherProtocol, Logger} from 'enqueuer';

export class RedisDbPublisher extends Publisher {
    private readonly options: any;

    constructor(publisher: InputPublisherModel) {
        super(publisher);
        this.options = publisher.options || {};
        this.command = publisher.command || 'get';
    }

    public publish(): Promise<any> {
        return new Promise((resolve, reject) => {
            const client: any = redis.createClient(this.options);
            client.on('error', (err: Error) => {
                Logger.error(`Redis client error: ${err}`);
                reject(err);
            });
            client.on('warning', (err: Error) => Logger.warning(`warning: ${err}`));
            Logger.info(`Successfully connected to redis`);
            const callback = (err: Error | null, reply: string) => {
                if (err) {
                    Logger.error(`Error running redis ${this.command} command: ${err}`);
                    reject(err);
                } else {
                    this.executeHookEvent('onCommandExecuted', {result: reply});
                    resolve({result: reply});
                }
            };

            switch (this.command.toLowerCase()) {
                case 'get':
                    client.get(this.key, callback);
                    break;
                case 'keys':
                    client.keys(this.pattern, callback);
                    break;
                default:
                    client[this.command.toLowerCase()](this.key, this.value, callback);
                    break;
            }
        });
    }
}

export function entryPoint(mainInstance: MainInstance): void {
    const exec = new PublisherProtocol('redis-db',
        (publisherModel: InputPublisherModel) => new RedisDbPublisher(publisherModel),
        {
            description: 'Enqueuer publisher to redis commands',
            homepage: 'https://github.com/enqueuer-land/enqueuer-redis-db',
            libraryHomepage: 'https://www.npmjs.com/package/redis',
            schema: {
                attributes: {
                    options: {
                        type: 'object',
                        required: false
                    },
                    command: {
                        type: 'list',
                        required: true,
                        listValues: ['get', 'keys', 'set', 'getset', 'setex', 'setnx', 'keys']
                    },
                    key: {
                        type: 'string'
                    },
                    value: {
                        type: 'string'
                    },
                    pattern: {
                        type: 'string'
                    }
                },
                hooks: {
                    onCommandExecuted: {
                        description: 'Gets executed when command is executed',
                        arguments: {
                            result: {}
                        }
                    }
                }

            }
        }) as PublisherProtocol;

    mainInstance.protocolManager.addProtocol(exec);
}
