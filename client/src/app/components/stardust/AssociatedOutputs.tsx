import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { useAssociatedOutputs } from "../../../helpers/hooks/useAssociatedOutputs";
import { IBech32AddressDetails } from "../../../models/api/IBech32AddressDetails";
import { AssociationType, IAssociation } from "../../../models/api/stardust/IAssociationsResponse";
import Modal from "../Modal";
import associatedOuputsMessage from "./../../../assets/modals/stardust/address/associated-outputs.json";
import { AssociatedOutputTab, buildAssociatedOutputsTabs, outputTypeToAssociations } from "./AssociatedOutputsUtils";
import AssociationSection from "./AssociationSection";
import "./AssociatedOutputs.scss";

interface AssociatedOutputsProps {
    /**
     * The network in context.
     */
    network: string;
    /**
     * Address details
     */
    addressDetails: IBech32AddressDetails;
    /**
     * Callback setter to report the associated outputs count.
     */
    setOutputCount?: React.Dispatch<React.SetStateAction<number>>;
    /**
     * Callback setter to report if the component is loading outputs.
     */
    setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AssociatedOutputs: React.FC<AssociatedOutputsProps> = (
    { network, addressDetails, setOutputCount, setIsLoading }
) => {
    const [currentTab, setCurrentTab] = useState<AssociatedOutputTab>("Basic");
    const [associations, isLoading] = useAssociatedOutputs(network, addressDetails, setOutputCount);
    const [tabsToRender, setTabsToRender] = useState<AssociatedOutputTab[]>([]);

    useEffect(() => {
        if (setIsLoading) {
            setIsLoading(isLoading);
        }
    }, [isLoading]);

    useEffect(() => {
        const tabs = buildAssociatedOutputsTabs(associations);
        setTabsToRender(tabs);
        if (tabs.length > 0) {
            setCurrentTab(tabs[0]);
        }
    }, [associations]);

    const associationTypesToRender: AssociationType[] | undefined = outputTypeToAssociations.get(currentTab);

    return (
        associations.length === 0 ? null : (
            <div className="section associated-outputs">
                <div className="section--header">
                    <div className="row middle">
                        <h2 className="associated-heading">Associated Outputs</h2>
                        <Modal icon="info" data={associatedOuputsMessage} />
                    </div>
                    <div className="tabs-wrapper">
                        {tabsToRender.map((tab, idx) => (
                            <button
                                type="button"
                                key={idx}
                                className={classNames("tab", { "active": tab === currentTab })}
                                onClick={() => setCurrentTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                {associationTypesToRender?.map((associationType, idx) => {
                    const targetAssociation: IAssociation | undefined = associations.find(
                        association => association.type === associationType
                    );
                    return (
                        <AssociationSection
                            key={`${currentTab}-${idx}`}
                            association={associationType}
                            outputIds={targetAssociation?.outputIds}
                        />
                    );
                })}
            </div>
        )
    );
};

AssociatedOutputs.defaultProps = {
    setIsLoading: undefined,
    setOutputCount: undefined
};

export default AssociatedOutputs;

