import React, { useEffect, useRef, useState } from "react";
import referencedBlocksMessage from "../../../../../assets/modals/stardust/block/milestone-referenced-blocks.json";
import Modal from "../../../Modal";
import Pagination from "../../../Pagination";
import Spinner from "../../../Spinner";
import ReferencedBlocksSectionRow from "./ReferencedBlocksSectionRow";
import "./ReferencedBlocksSection.scss";

interface ReferenceBlocksSectionProps {
    blockIds?: string[];
}

const PAGE_SIZE: number = 10;

const ReferenceBlocksSection: React.FC<ReferenceBlocksSectionProps> = ({ blockIds }) => {
    const isMounted = useRef(false);
    const [currentPage, setCurrentPage] = useState<string[]>([]);
    const [pageNumber, setPageNumber] = useState(1);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const from = (pageNumber - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE;
        if (blockIds) {
            setCurrentPage(blockIds.slice(from, to));
        }
    }, [blockIds, pageNumber]);

    const showPagination: boolean = (blockIds?.length ?? 0) > PAGE_SIZE;

    return (
        <div className="section refblocks">
            <div className="section--header row space-between">
                <div className="row middle">
                    <h2>Referenced Blocks</h2>
                    <Modal icon="info" data={referencedBlocksMessage} />
                </div>
            </div>
            {currentPage.length > 0 ? (
                <React.Fragment>
                    <table className="refblocks__table">
                        <thead>
                            <tr>
                                <th className="refblocks__table__header__block-id">BLOCK ID</th>
                                <th className="refblocks__table__header__payload">PAYLOAD TYPE</th>
                                <th className="refblocks__table__header__tx-value">VALUE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPage.map((blockId, idx) => (
                                <ReferencedBlocksSectionRow
                                    key={`block-${pageNumber}-${idx}`}
                                    blockId={blockId}
                                    isTable={true}
                                />
                            ))}
                        </tbody>
                    </table>
                    <div className="refblocks__cards">
                        {currentPage.map((blockId, idx) => (
                            <ReferencedBlocksSectionRow
                                key={`block-${pageNumber}-${idx}`}
                                blockId={blockId}
                            />
                        ))}
                    </div>
                </React.Fragment>
            ) : <Spinner />}
            {showPagination && (
                <Pagination
                    currentPage={pageNumber}
                    totalCount={blockIds?.length ?? 0}
                    pageSize={PAGE_SIZE}
                    siblingsCount={1}
                    onPageChange={page => setPageNumber(page)}
                />
            )}
        </div>
    );
};

ReferenceBlocksSection.defaultProps = {
    blockIds: undefined
};

export default ReferenceBlocksSection;

