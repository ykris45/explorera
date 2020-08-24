import { ServiceFactory } from "../factories/serviceFactory";
import { IMilestoneStore } from "../models/db/IMilestoneStore";
import { IStorageService } from "../models/services/IStorageService";
import { IAddress } from "../models/zmq/IAddress";
import { NetworkService } from "./networkService";
import { ZmqHandlerService } from "./zmqHandlerService";

/**
 * Class to handle milestones service.
 */
export class MilestonesService {
    /**
     * The network name.
     */
    private readonly _networkId: string;

    /**
     * Should this service do the store as well.
     */
    private readonly _performStore: boolean;

    /**
     * The zmq service.
     */
    private _zmqService: ZmqHandlerService;

    /**
     * The milestone store service.
     */
    private _milestoneStorageService: IStorageService<IMilestoneStore>;

    /**
     * Subscription address id.
     */
    private _subscriptionAddressId: string;

    /**
     * Last updates
     */
    private _lastUpdate: number;

    /**
     * Timer id.
     */
    private _timerId?: NodeJS.Timer;

    /**
     * Are we already updating.
     */
    private _updating: boolean;

    /**
     * The most recent milestones.
     */
    private _milestones: {
        /**
         * The transaction hash.
         */
        hash: string;
        /**
         * The milestone index.
         */
        milestoneIndex: number;
    }[];

    /**
     * Create a new instance of MilestoneService.
     * @param networkId The network configuration.
     * @param performStore Should this instance save in store.
     */
    constructor(networkId: string, performStore: boolean) {
        this._networkId = networkId;
        this._performStore = performStore;
    }

    /**
     * Initialise the milestones.
     */
    public async init(): Promise<void> {
        this._zmqService = ServiceFactory.get<ZmqHandlerService>(`zmq-${this._networkId}`);
        this._milestones = [];

        this._milestoneStorageService = ServiceFactory.get<IStorageService<IMilestoneStore>>("milestone-storage");

        if (this._milestoneStorageService) {
            const store = await this._milestoneStorageService.get(this._networkId);
            if (store?.indexes) {
                this._milestones = store.indexes;
            }
        }

        this.initNetwork();

        this.startTimer();
    }

    /**
     * Reset the services.
     */
    public async reset(): Promise<void> {
        this.stopTimer();

        this.closeNetwork();

        this.initNetwork();

        this.startTimer();
    }

    /**
     * Get the milestones for the request network.
     * @returns The milestones for the network.
     */
    public getMilestones(): {
        /**
         * The transaction hash.
         */
        hash: string;
        /**
         * The milestone index.
         */
        milestoneIndex: number;
    }[] {
        return this._milestones;
    }

    /**
     * Initialise network.
     */
    private initNetwork(): void {
        const networkService = ServiceFactory.get<NetworkService>("network");

        if (networkService) {
            const networkConfig = networkService.get(this._networkId);

            this._subscriptionAddressId = this._zmqService.subscribeAddress(
                networkConfig.coordinatorAddress,
                async (evnt: string, message: IAddress) => {
                    if (message.address === networkConfig.coordinatorAddress) {
                        this._lastUpdate = Date.now();

                        if ((this._milestones.length === 0 ||
                            message.milestoneIndex > this._milestones[0].milestoneIndex) &&
                            this._milestones
                                .findIndex(p => p.milestoneIndex === message.milestoneIndex) === -1) {
                            this._milestones.unshift({
                                hash: message.transaction,
                                milestoneIndex: message.milestoneIndex
                            });

                            this._milestones = this._milestones.slice(0, 100);

                            // Only save to storage on the master thread
                            if (this._milestoneStorageService && this._performStore) {
                                this._milestoneStorageService.set({
                                    network: this._networkId,
                                    indexes: this._milestones
                                }).catch(err => {
                                    console.error(`Failed writing ${this._networkId} milestone store`, err);
                                });
                            }
                        }
                    }
                });
        }
    }

    /**
     * Closedown network.
     */
    private closeNetwork(): void {
        if (this._subscriptionAddressId) {
            this._zmqService.unsubscribe(this._subscriptionAddressId);
            this._subscriptionAddressId = undefined;
        }
    }

    /**
     * Start the timer for idle timeout.
     */
    private startTimer(): void {
        this.stopTimer();
        this._timerId = setInterval(
            async () => {
                if (!this._updating) {
                    this._updating = true;
                    const now = Date.now();

                    try {
                        if (now - this._lastUpdate > 5 * 60 * 1000) {
                            this.closeNetwork();
                            this.initNetwork();
                        }
                    } catch (err) {
                        console.error(`Failed processing ${this._networkId} idle timeout`, err);
                    }

                    this._updating = false;
                }
            },
            5000);
    }

    /**
     * Stop the idle timer.
     */
    private stopTimer(): void {
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = undefined;
        }
    }
}
