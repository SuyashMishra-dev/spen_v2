import { flattenObj, removeEmptyProperty } from "utility";
import { OCRData } from "../../BillForm/type";

export const mapOcrData = (extractData: OCRData) => {
  const { ocrData, ...billDetail } = extractData;
  const data = removeEmptyProperty(flattenObj(billDetail)) as OCRData;

  // TO DO: ask BE to change it into invoiceAmount
  if (typeof data?.amount === "number") {
    // for invoiceAmount
    data["billTax.invoiceAmount"] = data.amount; // IMPROVEMENT: no need this if the BE already change to `billTax.invoiceAmount`

    delete data.amount;
  }

  return data;
};
