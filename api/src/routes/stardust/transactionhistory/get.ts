import { ServiceFactory } from "../../../factories/serviceFactory";
import { ITransactionsDetailsRequest } from "../../../models/api/chrysalis/ITransactionsDetailsRequest";
import { ITransactionsDetailsResponse } from "../../../models/api/chrysalis/ITransactionsDetailsResponse";
import { IConfiguration } from "../../../models/configuration/IConfiguration";
import { STARDUST } from "../../../models/db/protocolVersion";
import { NetworkService } from "../../../services/networkService";
import { StardustTangleHelper } from "../../../utils/stardust/stardustTangleHelper";
import { ValidationHelper } from "../../../utils/validationHelper";

/**
 * Find the object from the network.
 * @param config The configuration.
 * @param request The request.
 * @returns The response.
 */
export async function get(
    config: IConfiguration,
    request: ITransactionsDetailsRequest
): Promise<{ transactionHistory: ITransactionsDetailsResponse } | unknown> {
    const networkService = ServiceFactory.get<NetworkService>("network");
    const networks = networkService.networkNames();
    ValidationHelper.oneOf(request.network, networks, "network");

    const networkConfig = networkService.get(request.network);

    if (networkConfig.protocolVersion !== STARDUST) {
        return {};
    }
    return {
        transactionHistory: await StardustTangleHelper.transactionsDetails(networkConfig, request)
    };
}
