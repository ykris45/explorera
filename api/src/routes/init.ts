import { ServiceFactory } from "../factories/serviceFactory";
import { IConfiguration } from "../models/configuration/IConfiguration";
import { IAnalyticsStore } from "../models/db/IAnalyticsStore";
import { ICurrencyState } from "../models/db/ICurrencyState";
import { IMilestoneStore } from "../models/db/IMilestoneStore";
import { INetwork } from "../models/db/INetwork";
import { IStorageService } from "../models/services/IStorageService";
import { CurrencyService } from "../services/currencyService";

/**
 * Initialise the database.
 * @param config The configuration.
 * @returns The response.
 */
export async function init(config: IConfiguration): Promise<string[]> {
    let log = "Initializing\n";

    try {
        const networkStorageService = ServiceFactory.get<IStorageService<INetwork>>("network-storage");
        if (networkStorageService) {
            log += await networkStorageService.create();
        }

        const currencyStorageService = ServiceFactory.get<IStorageService<ICurrencyState>>("currency-storage");
        if (currencyStorageService) {
            log += await currencyStorageService.create();
        }

        const milestoneStorageService = ServiceFactory.get<IStorageService<IMilestoneStore>>("milestone-storage");
        if (milestoneStorageService) {
            log += await milestoneStorageService.create();
        }

        const analyticsStorageService = ServiceFactory.get<IStorageService<IAnalyticsStore>>("analytics-storage");
        if (analyticsStorageService) {
            log += await analyticsStorageService.create();
        }

        const currencyService = new CurrencyService(config);
        if (currencyService) {
            log += await currencyService.update(true);
        }
    } catch (err) {
        log += `Failed\n${err.toString()}\n`;
    }

    log += !log.includes("Failed") ? "Initialization Succeeded" : "Initialization Failed";

    return log.split("\n");
}
