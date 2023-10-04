import React, { forwardRef, useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input as AntdInput } from "antd";
import { BIC_TYPE } from "Modules/DynamicForm/constants";
import { verifyBIC } from "Modules/DynamicForm/api";
import Loading3Quaters from "Modules/loading/loading3Quaters";
import { BulbFilled, CheckOutline, Typography } from "@spenmo/splice";
import cn from "classnames";
import { Tooltip, TooltipArrowAlignmentEnum, TooltipPositionEnum } from "Modules/DS/Tooltip";
import { BankValidationProps, VerifyBICResponse, VerifyBICPayload, BankValidationErrorMessage } from "../../type";
import { GetBaseAuthObject } from "utility";
import Input from "../../Input";
import styles from "./BankValidation.module.scss";
import { BankValidatorTypes } from "Views/Bills/V2/hooks/useRecipientFormFields/types";

const BankValidation = forwardRef((props: Partial<BankValidationProps>, ref: React.RefObject<AntdInput>) => {
  const { name, onChange, pattern, placeholder, value } = props;
  const [bic, setBic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [verifyResponse, setVerifyResponse] = useState<VerifyBICResponse | undefined>(undefined);
  const [isAPICallFailed, setIsAPICallFailed] = useState(false);
  const [isTooltipAutoShown, setIsTooltipAutoShown] = useState(false);
  const autoCloseTooltipTime = 3000;

  const {
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const [bankValue, vendorCountryCode] = watch(["dynamicFields.beneficiaryBankName", "countryCode"]);

  // Extract Sender country code
  const senderCountryCode = GetBaseAuthObject()?.orgCountryCode;

  const getAlias = useMemo((): string => name.split(".")?.[1], [name]);

  const eligibleToVerify = useCallback(
    (code: string): boolean => {
      if (!code) {
        setError(name, {
          message: BankValidationErrorMessage.REQUIRED_FIELD_ERROR,
        });
        return false;
      }

      // Note: add layer regex validation to validate code
      const inputRegex = pattern.value;
      if (!inputRegex?.test(code)) {
        setError(name, {
          message: pattern.message,
        });
        return false;
      }
      // Note: @IBAN, @BSB, for those check extra validation
      const extraChecksIdentifiers = ["ibanCode", "bsbCode"];
      const currentFieldName = getAlias;
      if (extraChecksIdentifiers.includes(currentFieldName)) {
        const label = placeholder.replace("Enter ", "");
        if (currentFieldName === BankValidatorTypes.BSB_CODE) {
          // Note: BSB code is only used for Australia country
          if ("au" !== vendorCountryCode.toLowerCase())
            setError(name, {
              message: `${label} ${BankValidationErrorMessage.ERROR_COUNTRY_MISMATCH}`,
            });
          return false;
        } else {
          const countryCode = code.substr(0, 2);
          if (countryCode && countryCode.toLowerCase() !== vendorCountryCode.toLowerCase()) {
            setError(name, {
              message: `${label} Code ${BankValidationErrorMessage.ERROR_COUNTRY_MISMATCH}`,
            });
            return false;
          }
        }
      }
      // Note: For sort code no API validation is required
      if (currentFieldName === BankValidatorTypes.SORT_CODE) {
        clearErrors(name);
        return false;
      }

      const hasBankValue = Boolean(bankValue);
      if (!hasBankValue) {
        setError(name, {
          message: BankValidationErrorMessage.REQUIRED_FIELD_ERROR,
        });
      }

      return hasBankValue;
    },
    [pattern.value, pattern.message, getAlias, bankValue, setError, name, placeholder, vendorCountryCode, clearErrors]
  );

  const createVerifyBICPayload = (bicCode: string): VerifyBICPayload => {
    const bicType = BIC_TYPE[getAlias];

    const payload: VerifyBICPayload = {
      bicType,
      bic: bicCode,
      senderCountry: senderCountryCode,
      receiverCountry: vendorCountryCode,
      spenmoCode: bankValue,
    };

    return payload;
  };

  const handleVerifyBIC = async (bicCode: string) => {
    setIsAPICallFailed(false);
    try {
      const payload = createVerifyBICPayload(bicCode);
      setLoading(true);
      const { data } = await verifyBIC(payload);
      setVerifyResponse(data.payload);
      // Note: Show by default info message for first time
      if (data.payload && !data.payload.isMatch) {
        setIsTooltipAutoShown(true);
        setTimeout(() => {
          setIsTooltipAutoShown(false);
        }, autoCloseTooltipTime);
      }
    } catch (e) {
      setIsAPICallFailed(true);
      setVerifyResponse(undefined);
      // log error message
      console.error(e.message);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setIsAPICallFailed(false);
    setIsTooltipAutoShown(false);
    setVerifyResponse(undefined);
    onChange(value);
    if (eligibleToVerify(value)) {
      clearErrors(name);
      handleVerifyBIC(value);
      setBic(value);
    }
  };

  const inputSuffix = useMemo(() => {
    if (loading) return <Loading3Quaters color="orange" size="24" />;
    if (verifyResponse) {
      if (verifyResponse.isMatch) {
        return <CheckOutline iconColor="currentColor" size="24" className={styles.successIcon} />;
      } else {
        if (getAlias === BankValidatorTypes.IBAN_CODE && verifyResponse.code === 4008) {
          // Note: Set error message if error message get from api
          setError(name, {
            message: verifyResponse.message,
          });
        } else {
          return (
            <Tooltip
              data-testid="tooltip-icon"
              position={TooltipPositionEnum.LEFT}
              alignArrow={TooltipArrowAlignmentEnum.CENTER}
              text={verifyResponse.message}
              showWithoutHover={isTooltipAutoShown}
            >
              <BulbFilled iconColor="currentColor" className={styles.suggestionIcon} size="24" />
            </Tooltip>
          );
        }
      }
    }

    return <></>;
  }, [loading, verifyResponse, getAlias, setError, name, isTooltipAutoShown]);

  return (
    <div className={styles.bankValidation}>
      <Input
        className={cn(styles.input, errors?.dynamicFields?.[getAlias] ? styles.requiredBorder : "")}
        type="text"
        placeholder={placeholder}
        onChange={handleChange}
        suffix={inputSuffix}
        value={value}
      />
      {isAPICallFailed && (
        <div>
          <Typography className={styles.validatedFailed} variant="body-content" tag="div" size="s">
            This code cannot be validated now.
          </Typography>
          <Typography
            className={styles.tryAgain}
            onClick={() => handleVerifyBIC(bic)}
            variant="body-content"
            tag="div"
            size="s"
          >
            Try again
          </Typography>
        </div>
      )}
    </div>
  );
});

export default BankValidation;
