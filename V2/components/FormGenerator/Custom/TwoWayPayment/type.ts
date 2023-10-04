type ReceiverFeeParams = {
  senderCurrency: string;
  receiverCurrency: string;
  receiverCountryCode: string;
  receiverAmount: number;
  swiftPaymentChargeType: "SHA" | "OUR";
};

type SenderFeeParams = {
  senderCurrency: string;
  receiverCurrency: string;
  receiverCountryCode: string;
  totalAmount: number;
  swiftPaymentChargeType: "SHA" | "OUR";
};

export type BillFeeParameters = ReceiverFeeParams | SenderFeeParams;

export enum FeeId {
  EXCHANGE = "EXCHANGE",
  TRANSFER_FEE = "TRANSFER_FEE",
  SWIFT_PAYMENT_CHARGE_FEE = "SWIFT_PAYMENT_CHARGE_FEE",
}

export enum FeeOperator {
  MULTIPLY = "MULTIPLY",
  ADDITION = "ADDITION",
}

export enum FeeType {
  UNIT = "UNIT",
  CURRENCY = "CURRENCY",
}

export type FeeBreakdownProcess = {
  id: keyof typeof FeeId;
  label: string;
  note: string;
  operator: keyof typeof FeeOperator;
  tooltip: string;
  type: keyof typeof FeeType;
  value: number;
};

export interface BillFeeResponse {
  corridor: string;
  flatFee: number;
  flatFeeCurrency: string;
  variableRate: number;
  flatFeeFxRate: number;
  amountFxRate: number;
  totalFeeAmount: number;
  totalAmount: number;
  minimumTransferAmount?: number;
  swiftPaymentChargeFee?: number;
  breakdown?: FeeBreakdownProcess[];
}

export interface BreakdownProps {
  billFee: Partial<BillFeeResponse>;
  youPayCurrencyCode: string;
  isLoading: boolean;
}

export enum ExchangeOperator {
  ADDITION = "ADDITION",
  MULTIPLY = "MULTIPLY",
}

export enum CorridorTypes {
  domestic = "domestic",
  internationalLocal = "international_local",
  internationalGlobal = "international_global",
}

export enum SwiftPaymentChargeType {
  OUR = "OUR",
  SHA = "SHA",
}
