/* eslint-disable max-len */
/* eslint-disable camelcase */
import { BASIC_OUTPUT_TYPE, IBasicOutput, INftOutput, NFT_OUTPUT_TYPE, TRANSACTION_PAYLOAD_TYPE, UnitsHelper } from "@iota/iota.js-stardust";
import React, { ReactNode } from "react";
import { RouteComponentProps } from "react-router-dom";
import { ServiceFactory } from "../../../factories/serviceFactory";
import { Bech32AddressHelper } from "../../../helpers/bech32AddressHelper";
import { TransactionsHelper } from "../../../helpers/stardust/transactionsHelper";
import { STARDUST } from "../../../models/db/protocolVersion";
import { NetworkService } from "../../../services/networkService";
import { StardustTangleCacheService } from "../../../services/stardust/stardustTangleCacheService";
import AsyncComponent from "../../components/AsyncComponent";
import Bech32Address from "../../components/chrysalis/Bech32Address";
import QR from "../../components/chrysalis/QR";
import FiatValue from "../../components/FiatValue";
import Icon from "../../components/Icon";
import { ModalIcon } from "../../components/ModalProps";
import Pagination from "../../components/Pagination";
import Spinner from "../../components/Spinner";
import { AddrRouteProps } from "../AddrRouteProps";
import messageJSON from "./../../../assets/modals/message.json";
import Transaction from "./../../components/chrysalis/Transaction";
import Asset from "../../components/stardust/Asset";
import Nft from "../../components/stardust/Nft";
import Modal from "./../../components/Modal";
import "./Addr.scss";
import { AddrState, NftDetails, TokenDetails } from "./AddrState";
import chevronRightGray from "./../../../assets/chevron-right-gray.svg";

/**
 * Component which will show the address page for stardust.
 */
class Addr extends AsyncComponent<RouteComponentProps<AddrRouteProps>, AddrState> {
    /**
     * Maximum page size for permanode request.
     */
    private static readonly MAX_PAGE_SIZE: number = 6000;

    /**
     * Native Tokens page size.
     */
    private static readonly TOKENS_PAGE_SIZE: number = 10;

    /**
     * Nfts page size.
     */
    private static readonly NFTS_PAGE_SIZE: number = 10;

    /**
     * API Client for tangle requests.
     */
    private readonly _tangleCacheService: StardustTangleCacheService;

    /**
     * The hrp of bech addresses.
     */
    private readonly _bechHrp: string;

    /**
     * Create a new instance of Addr.
     * @param props The props.
     */
    constructor(props: RouteComponentProps<AddrRouteProps>) {
        super(props);

        const networkService = ServiceFactory.get<NetworkService>("network");
        const networkConfig = this.props.match.params.network
            ? networkService.get(this.props.match.params.network)
            : undefined;

        this._tangleCacheService = ServiceFactory.get<StardustTangleCacheService>(`tangle-cache-${STARDUST}`);

        this._bechHrp = networkConfig?.bechHrp ?? "iota";

        this.state = {
            ...Bech32AddressHelper.buildAddress(
                this._bechHrp,
                props.match.params.address
            ),
            formatFull: false,
            statusBusy: true,
            status: "Loading transactions...",
            assetStatusBusy: true,
            assetStatus: "Loading Assets...",
            nftStatusBusy: true,
            nftStatus: "Loading NFTs...",
            received: 0,
            sent: 0,
            currentPage: 1,
            pageSize: 10,
            currentPageTransactions: [],
            tokens: [],
            tokenPageNumber: 1,
            tokenPage: [],
            nfts: [],
            nftPageNumber: 1,
            nftPage: []
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const result = await this._tangleCacheService.search(
            this.props.match.params.network, this.props.match.params.address
        );

        if (result?.address) {
            window.scrollTo({
                left: 0,
                top: 0,
                behavior: "smooth"
            });

            this.setState({
                address: result.address,
                bech32AddressDetails: Bech32AddressHelper.buildAddress(
                    this._bechHrp,
                    result.address,
                    result.addressDetails?.type ? result.addressDetails.type.type : 0
                ),
                balance: Number(result.addressDetails?.balance),
                outputIds: result.addressOutputIds,
                historicOutputIds: result.historicAddressOutputIds
            }, async () => {
                // TO DO This need permanode
                // await this.getTransactionHistory();
                await this.getOutputs();
                await this.getNativeTokens();
                await this.getNFTs();
            });
        } else {
            this.props.history.replace(`/${this.props.match.params.network}/search/${this.props.match.params.address}`);
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const networkId = this.props.match.params.network;

        return (
            <div className="addr">
                <div className="wrapper">
                    <div className="inner">
                        <div className="addr--header">
                            <div className="row middle">
                                <h1>
                                    Address
                                </h1>
                                <Modal icon={ModalIcon.Info} data={messageJSON} />
                            </div>
                        </div>
                        <div className="top">
                            <div className="sections">
                                <div className="section">
                                    <div className="section--header">
                                        <div className="row middle">
                                            <h2>
                                                General
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="row space-between general-content">
                                        <div className="section--data">
                                            <Bech32Address
                                                addressDetails={this.state.bech32AddressDetails}
                                                advancedMode={true}
                                            />
                                            {this.state.balance !== undefined && (
                                                <div className="row middle">
                                                    <Icon icon="wallet" boxed />
                                                    <div className="balance">
                                                        <div className="label">
                                                            Final balance
                                                        </div>
                                                        <div className="value featured">
                                                            {this.state.balance > 0 ? (
                                                                <React.Fragment>
                                                                    {UnitsHelper.formatBest(this.state.balance)}
                                                                    {" "}
                                                                    <span>(</span>
                                                                    <FiatValue value={this.state.balance} />
                                                                    <span>)</span>
                                                                </React.Fragment>
                                                            ) : 0}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="section--data">
                                            {this.state.bech32AddressDetails?.bech32 &&
                                                (
                                                    //  eslint-disable-next-line react/jsx-pascal-case
                                                    <QR data={this.state.bech32AddressDetails.bech32} />
                                                )}
                                        </div>
                                    </div>
                                    <div className="asset-cards row">
                                        <div className="section--assets">
                                            <div className="inner--asset">
                                                <div className="section--data assets">
                                                    <span className="label">Assets in wallet (12)</span>
                                                    <span className="value">{this.state.balance}</span>
                                                </div>
                                                <img
                                                    src={chevronRightGray}
                                                    alt="bundle"
                                                    className="svg-navigation"
                                                />
                                            </div>
                                        </div>
                                        <div className="section--NFT">
                                            <div className="inner--asset">
                                                <div className="section--data assets">
                                                    <span className="label">NFTs in wallet (37)</span>
                                                    <span className="value">-</span>
                                                </div>
                                                <img
                                                    src={chevronRightGray}
                                                    alt="bundle"
                                                    className="svg-navigation"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {this.state.outputs && this.state.outputs.length === 0 && (
                                    <div className="section">
                                        <div className="section--data">
                                            <p>
                                                There are no transactions for this address.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {this.txsHistory.length > 0 && (
                                    <div className="section transaction--section">
                                        <div className="section--header row space-between">
                                            <div className="row middle">
                                                <h2>
                                                    Transaction History
                                                </h2>
                                                <Modal icon={ModalIcon.Info} data={messageJSON} />
                                            </div>
                                            {this.state.status && (
                                                <div className="margin-t-s middle row">
                                                    {this.state.statusBusy && (<Spinner />)}
                                                    <p className="status">
                                                        {this.state.status}
                                                    </p>
                                                </div>
                                            )}

                                        </div>
                                        <table className="transaction--table">
                                            <thead>
                                                <tr>
                                                    <th>Message id</th>
                                                    <th>Date</th>
                                                    <th>Inputs</th>
                                                    <th>Outputs</th>
                                                    <th>Status</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                { this.currentPageTransactions.map((transaction, k) =>
                                                    (
                                                        <React.Fragment key={`${transaction?.messageId}${k}`}>
                                                            <Transaction
                                                                key={transaction?.messageId}
                                                                messageId={transaction?.messageId}
                                                                network={networkId}
                                                                inputs={transaction?.inputs.length}
                                                                outputs={transaction?.outputs.length}
                                                                messageTangleStatus={transaction?.messageTangleStatus}
                                                                date={transaction?.date}
                                                                amount={transaction?.amount}
                                                                tableFormat={true}
                                                                hasConflicts={!transaction.ledgerInclusionState || transaction.ledgerInclusionState === "conflicting"}
                                                            />
                                                            {transaction?.relatedSpentTransaction && (
                                                                <Transaction
                                                                    key={transaction?.relatedSpentTransaction.messageId}
                                                                    messageId={transaction?.relatedSpentTransaction.messageId}
                                                                    network={networkId}
                                                                    inputs={transaction?.relatedSpentTransaction.inputs.length}
                                                                    outputs={transaction?.relatedSpentTransaction.outputs.length}
                                                                    messageTangleStatus={transaction?.relatedSpentTransaction.messageTangleStatus}
                                                                    date={transaction?.relatedSpentTransaction.date}
                                                                    amount={transaction?.relatedSpentTransaction.amount}
                                                                    tableFormat={true}
                                                                />
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                            </tbody>
                                        </table>

                                        {/* Only visible in mobile -- Card transactions*/}
                                        <div className="transaction-cards">
                                            {this.currentPageTransactions.map((transaction, k) =>
                                                (
                                                    <React.Fragment key={`${transaction?.messageId}${k}`}>
                                                        <Transaction
                                                            key={transaction?.messageId}
                                                            messageId={transaction?.messageId}
                                                            network={networkId}
                                                            inputs={transaction?.inputs.length}
                                                            outputs={transaction?.outputs.length}
                                                            messageTangleStatus={transaction?.messageTangleStatus}
                                                            date={transaction?.date}
                                                            amount={transaction?.amount}
                                                        />

                                                        {transaction?.relatedSpentTransaction && (
                                                            <Transaction
                                                                key={transaction?.relatedSpentTransaction.messageId}
                                                                messageId={transaction?.relatedSpentTransaction.messageId}
                                                                network={networkId}
                                                                inputs={transaction?.relatedSpentTransaction.inputs.length}
                                                                outputs={transaction?.relatedSpentTransaction.outputs.length}
                                                                messageTangleStatus={transaction?.relatedSpentTransaction.messageTangleStatus}
                                                                date={transaction?.relatedSpentTransaction.date}
                                                                amount={transaction?.relatedSpentTransaction.amount}
                                                            />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                        </div>
                                        <Pagination
                                            currentPage={this.state.currentPage}
                                            totalCount={this.txsHistory.length}
                                            pageSize={this.state.pageSize}
                                            siblingsCount={1}
                                            onPageChange={page =>
                                                this.setState({ currentPage: page },
                                                    () => {
                                                        const firstPageIndex = (this.state.currentPage - 1) * this.state.pageSize;
                                                        // Check if last page
                                                        const lastPageIndex = (this.state.currentPage === Math.ceil(this.txsHistory.length / this.state.pageSize)) ? this.txsHistory.length : firstPageIndex + this.state.pageSize;
                                                        this.updateTransactionHistoryDetails(firstPageIndex, lastPageIndex).catch(err => console.error(err));
                                                })}
                                        />
                                    </div>)}
                                    <div className="section transaction--section">
                                        <div className="section--header row space-between">
                                            <div className="row middle">
                                                <h2>
                                                    Assets in Wallet ({this.state.tokens?.length})
                                                </h2>
                                                <Modal icon={ModalIcon.Info} data={messageJSON} />
                                            </div>
                                            {this.state.assetStatus && (
                                                <div className="margin-t-s middle row">
                                                    {this.state.assetStatusBusy && (<Spinner />)}
                                                    <p className="status">
                                                        {this.state.assetStatus}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <table className="transaction--table">
                                            <thead>
                                                <tr>
                                                    <th>Asset</th>
                                                    <th>Symbol</th>
                                                    <th>Quantity</th>
                                                    <th>Price</th>
                                                    <th>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                { this.currentTokensPage?.map((token, k) =>
                                                    (
                                                        <React.Fragment key={`${token?.name}${k}`}>
                                                            <Asset
                                                                key={k}
                                                                name={token?.name}
                                                                network={networkId}
                                                                symbol={token?.symbol}
                                                                amount={token.amount}
                                                                price={token?.price}
                                                                value={token?.value}
                                                                tableFormat={true}
                                                            />
                                                        </React.Fragment>
                                                    ))}
                                            </tbody>
                                        </table>

                                        {/* Only visible in mobile -- Card assets*/}
                                        <div className="transaction-cards">
                                            {this.currentTokensPage?.map((token, k) =>
                                                (
                                                    <React.Fragment key={`${token?.name}${k}`}>
                                                        <Asset
                                                            key={k}
                                                            name={token?.name}
                                                            network={networkId}
                                                            symbol={token?.symbol}
                                                            amount={token?.amount}
                                                            price={token?.price}
                                                            value={token?.value}
                                                        />
                                                    </React.Fragment>
                                                ))}
                                        </div>
                                        <Pagination
                                            currentPage={this.state.tokenPageNumber}
                                            totalCount={this.state.tokens?.length ?? 0}
                                            pageSize={Addr.TOKENS_PAGE_SIZE}
                                            siblingsCount={1}
                                            onPageChange={page =>
                                                this.setState({ tokenPageNumber: page },
                                                    () => {
                                                        const firstPageIndex = (this.state.tokenPageNumber - 1) * Addr.TOKENS_PAGE_SIZE;
                                                        // Check if last page
                                                        const lastPageIndex = (this.state.tokenPageNumber === Math.ceil((this.state.tokens?.length ?? 0) / Addr.TOKENS_PAGE_SIZE)) ? this.state.tokens?.length : firstPageIndex + Addr.TOKENS_PAGE_SIZE;
                                                })}
                                        />
                                    </div>
                                    <div className="section transaction--section no-border">
                                        <div className="section--header row space-between">
                                            <div className="row middle">
                                                <h2>
                                                    NFTs in Wallet ({this.state.nfts?.length})
                                                </h2>
                                                <Modal icon={ModalIcon.Info} data={messageJSON} />
                                            </div>
                                            {this.state.nftStatus && (
                                                <div className="margin-t-s middle row">
                                                    {this.state.nftStatusBusy && (<Spinner />)}
                                                    <p className="status">
                                                        {this.state.nftStatus}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="nft--section">
                                            { this.currentNftsPage?.map((nft, k) =>
                                            (
                                                <React.Fragment key={`${nft.id}${k}`}>
                                                    <Nft
                                                        key={k}
                                                        id={nft.id}
                                                        name={nft.name}
                                                        network={networkId}
                                                        image={nft.image}
                                                    />
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        <Pagination
                                            currentPage={this.state.nftPageNumber}
                                            totalCount={this.state.nfts?.length ?? 0}
                                            pageSize={Addr.NFTS_PAGE_SIZE}
                                            siblingsCount={1}
                                            onPageChange={page =>
                                                this.setState({ nftPageNumber: page },
                                                    () => {
                                                        const firstPageIndex = (this.state.nftPageNumber - 1) * Addr.NFTS_PAGE_SIZE;
                                                        // Check if last page
                                                        const lastPageIndex = (this.state.nftPageNumber === Math.ceil((this.state.nfts?.length ?? 0) / Addr.NFTS_PAGE_SIZE)) ? this.state.nfts?.length : firstPageIndex + Addr.NFTS_PAGE_SIZE;
                                                })}
                                        />
                                    </div>
                            </div>
                        </div>
                    </div >
                </div >
            </div >
        );
    }

    // TO DO DRY these three into one function
    private get currentPageTransactions() {
        const firstPageIndex = (this.state.currentPage - 1) * this.state.pageSize;
        const lastPageIndex = firstPageIndex + this.state.pageSize;

        return this.txsHistory.slice(firstPageIndex, lastPageIndex);
    }

    private get currentTokensPage() {
        const from = (this.state.tokenPageNumber - 1) * Addr.TOKENS_PAGE_SIZE;
        const to = from + Addr.TOKENS_PAGE_SIZE;

        return this.state.tokens?.slice(from, to);
    }

    private get currentNftsPage() {
        const from = (this.state.nftPageNumber - 1) * Addr.NFTS_PAGE_SIZE;
        const to = from + Addr.NFTS_PAGE_SIZE;

        return this.state.nfts?.slice(from, to);
    }

    private get txsHistory() {
        return this.state.transactionHistory?.transactionHistory?.transactions ?? [];
    }

    private async getTransactionHistory() {
        const transactionsDetails = await this._tangleCacheService.transactionsDetails({
            network: this.props.match.params.network,
            address: this.state.address ?? "",
            query: { page_size: this.state.pageSize }
        }, false);

        this.setState({ transactionHistory: transactionsDetails },
            async () => {
                const firstPageIndex = (this.state.currentPage - 1) * this.state.pageSize;
                const lastPageIndex = (this.state.currentPage === Math.ceil(this.txsHistory.length / this.state.pageSize))
                    ? this.txsHistory.length : firstPageIndex + this.state.pageSize;
                this.updateTransactionHistoryDetails(firstPageIndex, lastPageIndex)
                    .catch(err => console.error(err));

                if (transactionsDetails?.transactionHistory?.state) {
                    const allTransactionsDetails = await this._tangleCacheService.transactionsDetails({
                        network: this.props.match.params.network,
                        address: this.state.address ?? "",
                        query: { page_size: Addr.MAX_PAGE_SIZE, state: transactionsDetails?.transactionHistory.state }
                    }, true);

                    if (allTransactionsDetails?.transactionHistory.transactions) {
                        this.setState({ transactionHistory: { ...allTransactionsDetails,
                            transactionHistory: { ...allTransactionsDetails.transactionHistory,
                                transactions: allTransactionsDetails.transactionHistory
                                    .transactions?.map(t1 => ({ ...t1, ...this.txsHistory.find(t2 => t2.messageId === t1.messageId) })),
                                state: allTransactionsDetails.transactionHistory.state } } });
                    }
                }

                this.setState({
                    status: "",
                    statusBusy: false
                });
            }
        );
    }

    private async getOutputs() {
        if (!this.state.outputIds || this.state.outputIds?.length == 0) return;
        const networkId = this.props.match.params.network;
        const outputResponses = [];

        for (let outputId of this.state.outputIds) {
            const outputDetails = await this._tangleCacheService.outputDetails(networkId, outputId);
            if (outputDetails) {
                outputResponses.push(outputDetails);
            }
        }

        this.setState({ outputs: outputResponses });
    }

    private async getNativeTokens() {
        if (!this.state.outputs || this.state.outputs?.length == 0) return;
        let tokens: TokenDetails[] = [];

        this.state.outputs?.forEach((output) => {
            if (!output.isSpent && output.output.type === BASIC_OUTPUT_TYPE && (output.output as IBasicOutput).nativeTokens.length > 0) {
                const basicOutput = output.output as IBasicOutput;
                for (let token of basicOutput.nativeTokens) {
                    tokens.push({
                        name: token.id,
                        amount: Number.parseInt(token.amount)
                    });
                }
            }
        });

        this.setState({
            tokens,
            assetStatus: "",
            assetStatusBusy: false
        });
    }

    private async getNFTs() {
        if (!this.state.bech32AddressDetails?.bech32) return;
        const networkId = this.props.match.params.network;

        let nfts: NftDetails[] = [];

        const nftOutputs = await this._tangleCacheService.nfts({
            network: networkId,
            address: this.state.bech32AddressDetails?.bech32
        });

        if (nftOutputs?.outputs && nftOutputs?.outputs?.items.length > 0) {
            for (let outputId of nftOutputs.outputs.items) {
                const output = await this._tangleCacheService.outputDetails(networkId, outputId);
                if (output) {
                    if (!output.isSpent && output.output.type === NFT_OUTPUT_TYPE) {
                        const nftOutput = output.output as INftOutput;
                        nfts.push({
                            id: nftOutput.nftId,
                            image: "https://cdn.pixabay.com/photo/2021/11/06/14/40/nft-6773494_960_720.png"
                        })
                    }
                }
            }
        }

        this.setState({
            nfts,
            nftStatus: "",
            nftStatusBusy: false
        });
    }

    private async updateTransactionHistoryDetails(startIndex: number, endIndex: number) {
        if (this.txsHistory.length > 0) {
            const transactionIds = this.txsHistory.map(transaction => transaction.messageId);
            const updatingPage = this.state.currentPage;

            for (let i = startIndex; i < endIndex; i++) {
                if (updatingPage !== this.state.currentPage) {
                    break;
                }

                const tsx = { ...this.txsHistory[i] };
                let isUpdated = false;

                if (!tsx.date || !tsx.messageTangleStatus) {
                    isUpdated = true;
                    const { date, messageTangleStatus } = await TransactionsHelper
                        .getMessageStatus(this.props.match.params.network, tsx.messageId,
                            this._tangleCacheService);
                    tsx.date = date;
                    tsx.messageTangleStatus = messageTangleStatus;
                }

                if (!tsx.amount) {
                    isUpdated = true;
                    const amount = await this.getTransactionAmount(tsx.messageId);
                    tsx.amount = amount;

                    if (amount < 0) {
                        this.setState({ sent: this.state.sent + Math.abs(amount) });
                    }
                }

                if (tsx.isSpent === undefined) {
                    isUpdated = true;
                    let isTransactionSpent = false;

                    // Get spent related transaction
                    for (const output of tsx.outputs) {
                        if (output.output.address.address === this.state.address && output.spendingMessageId && !transactionIds?.includes(output.spendingMessageId)) {
                            transactionIds?.push(output.spendingMessageId);
                            const transactionsResult = await this._tangleCacheService.search(
                                this.props.match.params.network, output.spendingMessageId);
                            const statusDetails = await TransactionsHelper
                                .getMessageStatus(this.props.match.params.network, output.spendingMessageId,
                                    this._tangleCacheService);

                            if (transactionsResult?.message?.payload?.type === TRANSACTION_PAYLOAD_TYPE) {
                                const relatedAmount = await this.getTransactionAmount(output.spendingMessageId);
                                tsx.relatedSpentTransaction = {
                                    messageId: output.spendingMessageId,
                                    date: statusDetails.date,
                                    messageTangleStatus: statusDetails.messageTangleStatus,
                                    isSpent: true,
                                    amount: relatedAmount,
                                    inputs: transactionsResult?.message?.payload?.essence?.inputs,
                                    outputs: transactionsResult?.message?.payload?.essence?.outputs
                                };
                                if (relatedAmount < 0) {
                                    this.setState({ sent: this.state.sent + Math.abs(relatedAmount) });
                                }
                                isTransactionSpent = true;
                            }
                        }
                    }
                    tsx.isSpent = isTransactionSpent;
                }

                if (isUpdated) {
                    const transactions = [...this.txsHistory];
                    transactions[i] = tsx;
                    this.setState({ transactionHistory: { transactionHistory: { transactions } } });
                }
            }
        }
    }

    private async getTransactionAmount(
        messageId: string): Promise<number> {
        const result = await this._tangleCacheService.search(
            this.props.match.params.network, messageId);
        const { inputs, outputs } =
            await TransactionsHelper.getInputsAndOutputs(result?.message,
                this.props.match.params.network,
                this._bechHrp,
                this._tangleCacheService);
        const inputsRelated = inputs.filter(input => input.transactionAddress.hex === this.state.address);
        const outputsRelated = outputs.filter(output => output.address.hex === this.state.address);
        let fromAmount = 0;
        let toAmount = 0;
        for (const input of inputsRelated) {
            fromAmount += input.amount;
        }
        for (const output of outputsRelated) {
            toAmount += output.amount;
        }
        return toAmount - fromAmount;
    }
}

export default Addr;

