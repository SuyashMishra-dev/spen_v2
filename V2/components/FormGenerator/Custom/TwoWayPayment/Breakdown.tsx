import React, { useMemo, useState } from "react";
import cn from "classnames";
import { Tooltip as AntdTooltip } from "antd";
import dayjs from "dayjs";
import { AddOutline, Typography, Expand } from "@spenmo/splice";

import { Tooltip, TooltipArrowAlignmentEnum, TooltipPositionEnum } from "Modules/DS/Tooltip";

import Loader from "Modules/DS/Loader";
import { feeValueFormatter } from "Views/UploadInvoice/helper";

import { newInfo } from "assets/img";

import { LOADER_SIZES } from "Modules/DS/Loader/types";
import { BreakdownProps, ExchangeOperator, FeeBreakdownProcess, FeeId } from "./type";
import styles from "./TwoWayPayment.module.scss";

const renderTooltip = (text: string) => {
  return (
    <Tooltip alignArrow={TooltipArrowAlignmentEnum.CENTER} position={TooltipPositionEnum.RIGHT} text={text}>
      <img src={newInfo} alt="tooltip info icon" width={16} height={16} className={styles.infoIcon} />
    </Tooltip>
  );
};

// TO DO: add validation rules for breakdown that still
// inside the FE
const Breakdown = (props: BreakdownProps) => {
  const { billFee, youPayCurrencyCode, isLoading } = props;

  const [isExpand, setIsExpand] = useState(false);

  const breakdownProcess = useMemo(() => {
    if (!Array.isArray(billFee?.breakdown)) {
      return [];
    }

    const additionalProps = (process: FeeBreakdownProcess) => {
      const { id, note, value, type, tooltip } = process;
      const numberValue = feeValueFormatter(type, value, youPayCurrencyCode);
      let breakdownProps;
      switch (id) {
        case FeeId.EXCHANGE: {
          const updatedAt = dayjs(note).format("DD MMM YYYY [at] HH:mm:ss");
          breakdownProps = {
            detail: (
              <>
                <Typography variant="body-content" size="s" tag="p">
                  {numberValue}
                </Typography>
                <Typography className={styles.fxNote} variant="body-content" size="s" tag="p">
                  Mid-market rate until {updatedAt}
                </Typography>
              </>
            ),
          };
          break;
        }
        default: {
          // for FeeId.TRANSFER_FEE
          // for FeeId.SWIFT_PAYMENT_CHARGE_FEE
          breakdownProps = {
            detail: note ? (
              <AntdTooltip title={note} placement="top">
                <p className={styles.tdUnderline}>{value === 0 ? "Free" : numberValue}</p>
              </AntdTooltip>
            ) : (
              numberValue
            ),
            isLoading,
          };
        }
      }

      return {
        labelTooltip: tooltip,
        ...breakdownProps,
      };
    };

    return billFee.breakdown.map((process) => {
      const { label, operator, value } = process;

      return {
        label,
        operator,
        value,
        ...additionalProps(process),
      };
    });
  }, [billFee?.breakdown, isLoading, youPayCurrencyCode]);

  return (
    <div
      className={cn(styles.breakdown, {
        [styles.gap24]: breakdownProcess.length === 0,
      })}
    >
      {breakdownProcess.length > 0 && (
        <>
          <div className={styles.verticalLine} />
          {isExpand &&
            breakdownProcess.map((detailItem, index) => {
              return (
                <div key={index} className={styles.breakdownItem}>
                  <AddOutline
                    className={cn(styles.breakdownIcon, styles.plus, {
                      [styles.times]: detailItem.operator === ExchangeOperator.MULTIPLY,
                    })}
                    iconColor="white"
                    size="16"
                  />
                  <Typography className={styles.breakdownLabel} variant="body-content" size="s">
                    {detailItem.label}
                    {detailItem.labelTooltip && renderTooltip(detailItem.labelTooltip)}
                  </Typography>

                  <div className={styles.detail}>
                    {detailItem.detail}
                    <div>{detailItem.isLoading && <Loader size={LOADER_SIZES.SMALL} />}</div>
                  </div>
                </div>
              );
            })}
          <div className={styles.breakdownItem}>
            <Expand
              className={cn(styles.breakdownIcon, styles.expand, {
                [styles.collapse]: isExpand,
              })}
              iconColor="white"
              size="16"
            />
            <Typography
              className={styles.breakdownAction}
              variant="body-content"
              size="s"
              tag="p"
              onClick={() => setIsExpand((prev) => !prev)}
              tabIndex={0}
            >
              {isExpand ? "Collapse" : "Expand"}
            </Typography>
          </div>
        </>
      )}
    </div>
  );
};

export default Breakdown;
