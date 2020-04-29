import { ServiceFactory } from "../../factories/serviceFactory";
import { ICurrencySettings } from "../../models/services/ICurrencySettings";
import { CurrencyService } from "../../services/currencyService";
import { SettingsService } from "../../services/settingsService";
import AsyncComponent from "../components/AsyncComponent";
import { CurrencyState } from "./CurrencyState";

/**
 * Component which will provide facilities for a component with currencies.
 */
abstract class CurrencyBase<P, S extends CurrencyState> extends AsyncComponent<P, S> {
    /**
     * The settings service.
     */
    protected readonly _settingsService: SettingsService;

    /**
     * The currency service.
     */
    protected readonly _currencyService: CurrencyService;

    /**
     * The currency data.
     */
    protected _currencyData?: ICurrencySettings;

    /**
     * Create a new instance of Currency.
     * @param props The props.
     */
    constructor(props: P) {
        super(props);

        this._currencyService = ServiceFactory.get<CurrencyService>("currency");
        this._settingsService = ServiceFactory.get<SettingsService>("settings");
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        super.componentDidMount();

        this.buildCurrency();
    }

    /**
     * Update formatted currencies.
     */
    protected abstract updateCurrency(): void;

    /**
     * Set a new currency.
     * @param currency The currency to set.
     */
    protected setCurrency(currency: string): void {
        if (this._currencyData) {
            this._currencyData.fiatCode = currency;
            this._currencyService.saveFiatCode(currency);
            this.setState(
                {
                    currency
                },
                () => {
                    this.updateCurrency();
                });
        }
    }

    /**
     * Build the currency information.
     */
    private buildCurrency(): void {
        this._currencyService.loadCurrencies((isAvailable, currencyData, err) => {
            if (isAvailable && currencyData && this._isMounted) {
                this._currencyData = currencyData;

                this.setState(
                    {
                        currency: this._currencyData.fiatCode,
                        currencies: (this._currencyData.currencies || []).map(c => c.id)
                    },
                    () => this.updateCurrency());
            }
        });
    }
}

export default CurrencyBase;
