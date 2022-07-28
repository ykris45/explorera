import { IUTXOInput } from "@iota/iota.js-stardust";
import { IBech32AddressDetails } from "../IBech32AddressDetails";

interface IInputExtend {
    /**
     * The output hash.
     */
    outputHash: string;
    /**
     * The is genesis flag.
     */
    isGenesis: boolean;
    /**
     * The transaction URL.
     */
    transactionUrl: string;
    /**
     * The transaction address details.
     */
    transactionAddress: IBech32AddressDetails;
    /**
     * The signature.
     */
    signature: string;
    /**
     * The public key.
     */
    publicKey: string;
    /**
     * The amount.
     */
    amount: number;
}

export type IInput = IUTXOInput & IInputExtend;

