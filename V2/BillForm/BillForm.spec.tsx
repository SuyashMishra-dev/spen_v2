import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { SWRConfig } from "swr";
import { BrowserRouter, Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import APIClient from "API/Client";

import BillPage from "../index";
import { API_URL, BillFormType } from "../constants";
import { userInfoData } from "mockData/userInfo";
import { taxList } from "mockData/tax";
import { currenciesFromMS } from "mockData/currency";
import { currencyFormatterV2 } from "utility";
import { BillFieldNames } from "./type";
import {
  billFormVendorDetail,
  billFormVendorDetailPHP,
  billFormVendorDetailUSD,
  billFormVendorList,
  billTeamWallaet,
} from "mockData/vendor";
import {
  billCorridorSimulator,
  billCorridorSimulatorInterUSD,
  billCorridorSimulatorPHP,
  calcRecipientAmount,
} from "mockData/billPaymentForm";

jest.mock("API/Client", () => ({
  ...jest.requireActual("API/Client"),
}));

// mock antd select
jest.mock("antd", () => {
  // eslint-disable-next-line react/prop-types
  const Select = (props) => {
    const { mode, onChange, children, options, ...rest } = props;
    if (mode === "tags") {
      const Component = jest.requireActual("antd").Select;
      return <Component {...props} />;
    }

    const multiple = ["tags", "multiple"].includes(mode);

    return (
      <select
        {...rest}
        multiple={multiple}
        onChange={(e) =>
          onChange(multiple ? Array.from(e.target.selectedOptions).map((option) => option.value) : e.target.value)
        }
      >
        {Array.isArray(options) && options.length > 0
          ? options.map((item) => {
              return (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              );
            })
          : children}
      </select>
    );
  };

  // eslint-disable-next-line react/prop-types
  Select.Option = ({ children, value, ...rest }) => (
    <option {...rest} value={value}>
      {value}
    </option>
  );

  return { ...jest.requireActual("antd"), Select };
});

const mockStore = configureStore([thunk]);

const routes = {
  manageDraftBills: "/bills/drafts",
  billForm: `/bills/drafts/${BillFormType.NEW_BILL}`,
};

const setup = (props?: { options?: Record<string, any>; store?: Record<string, any> }) => {
  const { options, store } = props || {};
  const storeData = {
    wallet: { data: { currency_code: "SGD" } },
    b2bOrgDetailReducer: { data: { payload: { isShowBillFeeCalculator: false, countryCode: "ID" } } },
    user: { role: "Admin" },
    orgConfigs: { data: { payload: { configs: { billpay_flag: { value: true } } } } },
    ...store,
  };
  const { initialEntries = [routes.billForm] } = options || {};
  const storeWithData = mockStore(storeData);

  const history = createMemoryHistory({ initialEntries });

  const utils = render(
    <Provider store={storeWithData}>
      <BrowserRouter>
        <Router history={history}>
          <SWRConfig
            value={{
              provider: () => new Map(),
            }}
          >
            <Route path="/bills/drafts/:form?">
              <BillPage tabKey="0" />
            </Route>
          </SWRConfig>
        </Router>
      </BrowserRouter>
    </Provider>
  );

  return { ...utils, history };
};

describe("Bill Form", () => {
  const renderBillFormSidePanel = async (history) => {
    await waitFor(() => {
      expect(history.location.pathname).toBe(routes.billForm);
      expect(screen.getByText("New Bill")).toBeInTheDocument();
      expect(screen.getByText("Bill details")).toBeInTheDocument();
      expect(screen.getByText("Payment details")).toBeInTheDocument();
    });
  };

  it("should able to render The bill form side panel", async () => {
    const { history } = setup({
      options: {
        initialEntries: [routes.manageDraftBills],
      },
    });

    expect(history.location.pathname).toBe(routes.manageDraftBills);
    // check title
    expect(screen.getAllByText("Bill Payments")[0]).toBeInTheDocument();

    expect(screen.getByText("+ New Bill")).toBeInTheDocument();

    userEvent.click(screen.getByText("+ New Bill"));

    await renderBillFormSidePanel(history);
  });

  describe.each([
    ["Connected", true],
    ["Disconnected", false],
  ])("%s with Xero", (name, withTags) => {
    const data = {
      billNumber: "abcd-123-xyz",
      amount: "14233",
      notes: "extra notes",
    };

    const mockGetAPI = (
      service: string,
      params?: Object,
      payloadCallBack?: Function,
      config?: Object,
      options?: { usdVendor?: boolean; phpVendor?: boolean }
    ) => {
      const { usdVendor, phpVendor } = options || {};

      // manage vendor detail payload data
      let vendorDetailPayload = billFormVendorDetail;
      let currencyPayload = currenciesFromMS;
      let billFeePayload: any = billCorridorSimulator;

      switch (true) {
        case usdVendor: {
          vendorDetailPayload = billFormVendorDetailUSD;
          billFeePayload = billCorridorSimulatorInterUSD;

          break;
        }
        case phpVendor: {
          vendorDetailPayload = billFormVendorDetailPHP;
          currencyPayload = [
            {
              ID: 117,
              CurrencyCode: "PHP",
              CurrencyName: "Philippine Peso",
              CurrencyIsoNumber: "608",
              CurrencyDescription: "",
            },
            {
              id: 3,
              currency_code: "USD",
              currency_description: "US Dollar",
              iso_currency_code: "840",
              country: "UNITED STATES OF AMERICA",
            },
          ];
          billFeePayload = billCorridorSimulatorPHP;
          break;
        }
      }

      if (service.includes(API_URL.xeroAuth)) {
        return Promise.resolve({
          data: {
            payload: {
              has_valid_token: withTags,
            },
          },
          status: 200,
        });
      }

      switch (true) {
        case service.includes(API_URL.xeroAuth): {
          return Promise.resolve({
            data: {
              payload: {
                has_valid_token: withTags,
              },
            },
            status: 200,
          });
        }
        case service.includes(API_URL.userInfo): {
          return Promise.resolve({
            data: userInfoData,
          });
        }
        case service.includes(API_URL.tax): {
          return Promise.resolve({
            data: taxList,
          });
        }
        case service.includes(API_URL.currency): {
          // TO DO: check with org and check with countryCode
          // if(service.includes("filterBy=org")) {}
          return Promise.resolve({
            data: {
              payload: {
                isSuccess: true,
                result: currencyPayload,
              },
            },
          });
        }
        case service.includes(API_URL.recipientList): {
          return Promise.resolve({
            data: {
              payload: billFormVendorList,
            },
          });
        }
        case service.includes(API_URL.recipientDetail): {
          return Promise.resolve({
            data: {
              payload: vendorDetailPayload,
            },
          });
        }
        case service.includes(API_URL.getBillFee): {
          return Promise.resolve({
            data: {
              payload: billFeePayload,
              status: 200,
            },
          });
        }
        case service.includes("/team-wallet?form_type=bill"): {
          return Promise.resolve({
            data: {
              payload: billTeamWallaet,
              status: 200,
            },
          });
        }
        default: {
          return jest.requireActual("API/Client").getData(service, params, payloadCallBack, config);
        }
      }
    };
    beforeEach(() => {
      APIClient.getData = jest.fn();
      APIClient.postData = jest.fn();

      (APIClient.getData as jest.Mock).mockImplementation(
        (service: string, params: string = "", payloadCallBack: any = false, config: { [key: string]: any } = {}) => {
          return mockGetAPI(service, params, payloadCallBack, config);
        }
      );

      (APIClient.postData as jest.Mock).mockImplementation(
        (service: string, params: string = "", payloadCallBack: any = false, config: { [key: string]: any } = {}) => {
          switch (true) {
            case service.includes(API_URL.getRecipientAmount): {
              return Promise.resolve({
                data: {
                  payload: calcRecipientAmount,
                },
              });
            }
            case service.includes("/api/v1/photo"): {
              return Promise.resolve({
                data: {
                  status: 200,
                  payload: {
                    file_path: "hello world",
                  },
                },
              });
            }
            default: {
              return jest.requireActual("API/Client").postData(service, params, payloadCallBack, config);
            }
          }
        }
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    //   describe("Fill with OCR", () => {});

    describe("Fill Manually", () => {
      const manuallyRenderBillDetailsFields = async () => {
        const fillManually = screen.getByText("Or fill details manually");
        expect(fillManually).toBeInTheDocument();

        userEvent.click(fillManually);

        // check if bill detail fields exist
        await waitFor(() => {
          expect(screen.getByText("Recipient")).toBeInTheDocument();
          expect(screen.getByText("Invoice Number")).toBeInTheDocument();
          expect(screen.getByText("Issuance Date")).toBeInTheDocument();
          expect(screen.getByText("Due Date")).toBeInTheDocument();
          expect(screen.getByText("Category")).toBeInTheDocument();
          expect(screen.getByText("Tax")).toBeInTheDocument();
          expect(screen.getByText("Invoice Amount")).toBeInTheDocument();

          if (withTags) {
            expect(screen.getByText("Add tags and notes")).toBeInTheDocument();
          } else {
            expect(screen.getByText("Add notes")).toBeInTheDocument();
          }
        });
      };

      const toggleAddTagsNotes = async (turnOn = true) => {
        await waitFor(() => {
          if (turnOn) {
            expect(screen.getByTestId("checkboxField-addNotes")).not.toBeChecked();
          } else {
            expect(screen.getByTestId("checkboxField-addNotes")).toBeChecked();
          }
        });

        // Tick / untick checkbox
        userEvent.click(screen.getByTestId("checkboxField-addNotes"));

        await waitFor(() => {
          if (turnOn) {
            // expect(screen.getByTestId("checkboxField-addNotes")).not.toBeInTheDocument();

            expect(screen.getByTestId("checkboxField-addNotes")).toBeChecked();
          } else {
            expect(screen.getByTestId("checkboxField-addNotes")).not.toBeChecked();
          }
        });
      };

      const fillRecipient = async () => {
        await waitFor(() => {
          expect(screen.getByPlaceholderText("Select recipient")).toBeInTheDocument();
        });

        userEvent.selectOptions(
          screen.getByPlaceholderText("Select recipient"),
          screen.getByText("beneficiary type 1")
        );

        await waitFor(() => {
          expect(screen.getByPlaceholderText("Select recipient")).toHaveValue("1");
        });
      };

      const fillTax = async () => {
        // the data is already filled from interaction with the category field
        await waitFor(() => {
          expect(screen.getByPlaceholderText("Select tax")).toHaveValue("3fe433ba-da3f-11eb-9193-0242ac110002");
          expect(screen.getByText(/Online Purchases/)).toBeInTheDocument();
        });

        // take a look at the mock data for reference
        userEvent.selectOptions(screen.getByPlaceholderText("Select tax"), screen.getByText(/Online Purchases/));

        await waitFor(() => {
          // expect(screen.getByPlaceholderText("Select tax")).not.toBeInTheDocument();
          expect(screen.getByPlaceholderText("Select tax")).toHaveValue("c80ed97c-24ed-11ec-84d6-0242ac110002");
        });
      };

      const fillInvoiceAmount = async (recepientCurrency = "SGD", amount = data.amount, isChangeCurrency = true) => {
        await waitFor(() => {
          expect(screen.getByTestId(`selectCurrency-${BillFieldNames.invoiceCurrency}`)).toHaveValue(recepientCurrency);
          expect(screen.getByPlaceholderText("Enter amount"));
        });

        if (isChangeCurrency) {
          userEvent.selectOptions(
            screen.getByTestId(`selectCurrency-${BillFieldNames.invoiceCurrency}`),
            screen.getByText(/IDR/i)
          );

          await waitFor(() => {
            expect(screen.getByTestId(`selectCurrency-${BillFieldNames.invoiceCurrency}`)).toHaveValue("IDR");
          });
        }

        // amount
        userEvent.type(screen.getByPlaceholderText("Enter amount"), amount);

        await waitFor(() => {
          expect(screen.getByPlaceholderText("Enter amount")).toHaveValue(currencyFormatterV2(amount, "IDR", false));
        });
      };

      const goToPaymentForm = async (recipientCurrency?: string, amount?: string, isChangeCurrency?: boolean) => {
        // fill all required fields
        await fillRecipient();
        await fillInvoiceAmount(recipientCurrency, amount, isChangeCurrency);

        userEvent.click(screen.getByText("Next"));

        await waitFor(() => {
          expect(screen.getByText(/Recipient gets/i)).toBeInTheDocument();
        });
      };

      describe("Bill details Form", () => {
        it("should render form fields", async () => {
          const { history } = setup();

          await renderBillFormSidePanel(history);

          await manuallyRenderBillDetailsFields();
        });

        describe("change fields value", () => {
          it("should able to change the recipient", async () => {
            setup();
            await manuallyRenderBillDetailsFields();

            await fillRecipient();
          });
          it("should able to change the Invoice number", async () => {
            setup();

            await manuallyRenderBillDetailsFields();

            userEvent.type(screen.getByPlaceholderText("Enter invoice number"), data.billNumber);

            await waitFor(() => {
              expect(screen.getByPlaceholderText("Enter invoice number")).toHaveValue(data.billNumber);
            });
          });

          it("should able to change the Category", async () => {
            setup();

            await manuallyRenderBillDetailsFields();

            await waitFor(() => {
              expect(screen.getByText("Default")).toBeInTheDocument();
            });

            // take a look at the mock data for reference
            userEvent.selectOptions(screen.getByPlaceholderText("Select category"), screen.getByText("Default"));

            await waitFor(() => {
              expect(screen.getByPlaceholderText("Select category")).toHaveValue("1");
              // check the Tax.
              // tax should be also filled according to the category
              expect(screen.getByPlaceholderText("Select tax")).toHaveValue("3fe433ba-da3f-11eb-9193-0242ac110002");
            });
          });

          it("should able to change the Tax", async () => {
            setup();

            await manuallyRenderBillDetailsFields();

            // the data is already filled from interaction with the category field
            await waitFor(() => {
              expect(screen.getByPlaceholderText("Select tax")).toHaveValue("3fe433ba-da3f-11eb-9193-0242ac110002");
              expect(screen.getByText(/Online Purchases/)).toBeInTheDocument();
            });

            // take a look at the mock data for reference
            userEvent.selectOptions(screen.getByPlaceholderText("Select tax"), screen.getByText(/Online Purchases/));

            await waitFor(() => {
              // expect(screen.getByPlaceholderText("Select tax")).not.toBeInTheDocument();
              expect(screen.getByPlaceholderText("Select tax")).toHaveValue("c80ed97c-24ed-11ec-84d6-0242ac110002");
            });
          });

          it("should able to change invoice currency and amount", async () => {
            Object.defineProperty(window.document, "cookie", {
              writable: true,
              value:
                "reauth=01f0e514-c77d-11eb-9fdb-0242ac110002vspenmo1020135b8-c77d-11eb-ad45-0242ac110002vspenmo1SG",
            });

            setup();

            await manuallyRenderBillDetailsFields();

            await fillInvoiceAmount();
          });

          it("should able to tick notes checkbox", async () => {
            setup();

            await manuallyRenderBillDetailsFields();

            await toggleAddTagsNotes();

            await waitFor(() => {
              if (withTags) {
                expect(screen.getByPlaceholderText("Select tags")).toBeInTheDocument();
              }
              expect(screen.getByPlaceholderText("Write a note for your team")).toBeInTheDocument();
            });

            // Un-tick checkbox
            await toggleAddTagsNotes(false);

            await waitFor(() => {
              if (withTags) {
                expect(screen.queryByPlaceholderText("Select tags")).not.toBeInTheDocument();
              }
              expect(screen.queryByPlaceholderText("Write a note for your team")).not.toBeInTheDocument();
            });
          });

          it("should able to change tags and/or notes", async () => {
            setup();

            await manuallyRenderBillDetailsFields();

            // turn on
            await toggleAddTagsNotes();

            await waitFor(() => {
              if (withTags) {
                expect(screen.getByPlaceholderText("Select tags")).toBeInTheDocument();
              }
              expect(screen.getByPlaceholderText("Write a note for your team")).toBeInTheDocument();
            });

            // TO DO: Tags userSelect for tags
            // if (withTags) {
            //   userEvent.selectOptions(screen.getByPlaceholderText("Select tags"), );
            // }
            userEvent.type(screen.getByPlaceholderText("Write a note for your team"), data.notes);

            await waitFor(() => {
              // TO DO: Tags check the value of tags
              // if (withTags) {
              //   expect(screen.getByPlaceholderText("Select tags")).toHaveValeu();
              // }
              expect(screen.getByPlaceholderText("Write a note for your team")).toHaveValue(data.notes);
            });
          });
        });

        it("should be able to click next button", async () => {
          setup();
          await manuallyRenderBillDetailsFields();

          await goToPaymentForm();
        });
      });

      describe("Payment details Form", () => {
        it("should render two way payment", async () => {
          setup();
          await manuallyRenderBillDetailsFields();

          await goToPaymentForm();

          await waitFor(() => {
            // recipient gets
            expect(screen.getByTestId(`selectCurrency-currency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[0]).toHaveValue(
              currencyFormatterV2(calcRecipientAmount.recipientAmount, "SGD", false)
            );
            // you pay
            expect(screen.getByTestId(`selectCurrency-youPayCurrency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[1]).toHaveValue(
              currencyFormatterV2(calcRecipientAmount.recipientAmount, "SGD", false)
            );
          });

          // change recipient gets
          userEvent.clear(screen.getAllByPlaceholderText("Enter amount")[0]);
          userEvent.type(screen.getAllByPlaceholderText("Enter amount")[0], "15000");

          (APIClient.getData as jest.Mock).mockImplementationOnce(() => {
            return Promise.resolve({
              data: {
                payload: {
                  corridor: "domestic",
                  flatFee: 0,
                  flatFeeFx: 0,
                  flatFeeCurrency: "",
                  variableRate: 0,
                  variableFee: 0,
                  flatFeeFxRate: 0,
                  amountFxRate: 1,
                  amountFx: 15000,
                  totalFeeAmount: 0,
                  swiftPaymentChargeFee: 0,
                  receiverAmount: 15000,
                  totalAmount: 15000,
                  minimumTransferAmount: 0,
                  breakdown: null,
                  hasFeeCalculator: false,
                  hasFeeDeduction: true,
                },
              },
              status: 200,
            });
          });

          await waitFor(() => {
            // recipient gets
            expect(screen.getByTestId(`selectCurrency-currency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[0]).toHaveValue(
              currencyFormatterV2("15000", "SGD", false)
            );
            // you pay
            expect(screen.getByTestId(`selectCurrency-youPayCurrency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[1]).toHaveValue(
              currencyFormatterV2("15000", "SGD", false)
            );
          });

          // change you pay
          userEvent.clear(screen.getAllByPlaceholderText("Enter amount")[1]);
          userEvent.type(screen.getAllByPlaceholderText("Enter amount")[1], "14000");

          (APIClient.getData as jest.Mock).mockImplementationOnce(() => {
            return Promise.resolve({
              data: {
                payload: {
                  corridor: "domestic",
                  flatFee: 0,
                  flatFeeFx: 0,
                  flatFeeCurrency: "",
                  variableRate: 0,
                  variableFee: 0,
                  flatFeeFxRate: 0,
                  amountFxRate: 1,
                  amountFx: 14000,
                  totalFeeAmount: 0,
                  swiftPaymentChargeFee: 0,
                  receiverAmount: 14000,
                  totalAmount: 14000,
                  minimumTransferAmount: 0,
                  breakdown: null,
                  hasFeeCalculator: false,
                  hasFeeDeduction: true,
                },
              },
              status: 200,
            });
          });

          await waitFor(() => {
            // recipient gets
            expect(screen.getByTestId(`selectCurrency-currency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[0]).toHaveValue(
              currencyFormatterV2("14000", "SGD", false)
            );
            // you pay
            expect(screen.getByTestId(`selectCurrency-youPayCurrency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[1]).toHaveValue(
              currencyFormatterV2("14000", "SGD", false)
            );
          });
        });

        // International Global + USD Currency
        it("should render two way payment with Pay Full Amount Guarantee", async () => {
          (APIClient.getData as jest.Mock).mockImplementation(
            (service: string, params: string = "", payloadCallBack: any = false, config: { [key: string]: any } = {}) =>
              mockGetAPI(service, params, payloadCallBack, config, {
                usdVendor: true,
              })
          );

          setup();

          await manuallyRenderBillDetailsFields();

          await goToPaymentForm("USD");

          await waitFor(() => {
            // recipient gets
            expect(screen.getByTestId("selectCurrency-currency")).toHaveValue("USD");
            expect(screen.getAllByPlaceholderText("Enter amount")[0]).toHaveValue(
              currencyFormatterV2("14123", "USD", false)
            );
            // you pay
            expect(screen.getByTestId(`selectCurrency-youPayCurrency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[1]).toHaveValue(
              currencyFormatterV2("2137002", "SGD", false)
            );
          });

          // change recipient gets
          userEvent.clear(screen.getAllByPlaceholderText("Enter amount")[0]);
          userEvent.type(screen.getAllByPlaceholderText("Enter amount")[0], "150");
          userEvent.click(screen.getByTestId("checkboxField-swiftPaymentChargeType"));

          const response = {
            corridor: "international_global",
            flatFee: 0,
            flatFeeFx: 0,
            flatFeeCurrency: "",
            variableRate: 0,
            variableFee: 0,
            flatFeeFxRate: 0,
            amountFxRate: 15264.3,
            amountFx: 2289645,
            totalFeeAmount: 0,
            swiftPaymentChargeFee: 381607,
            receiverAmount: 150,
            totalAmount: 2671252,
            minimumTransferAmount: 0,
            breakdown: [
              {
                id: "EXCHANGE",
                label: "Exchange fee",
                value: 15264.3,
                operator: "MULTIPLY",
                type: "UNIT",
                tooltip: "",
                note: "2023-08-28T11:36:57Z",
              },
              {
                id: "SWIFT_PAYMENT_CHARGE_FEE",
                label: "Full Amount Guarantee",
                value: 381607,
                operator: "ADDITION",
                type: "CURRENCY",
                tooltip:
                  "Pay this optional fee to guarantee recipient receives the exact amount and avoid any potential fees charged by recipient bank.",
                note: "",
              },
            ],
            hasFeeCalculator: false,
            hasFeeDeduction: true,
          };

          (APIClient.getData as jest.Mock).mockImplementation(() => {
            return Promise.resolve({
              data: {
                payload: response,
              },
              status: 200,
            });
          });

          await waitFor(() => {
            // recipient gets
            expect(screen.getByTestId(`selectCurrency-currency`)).toHaveValue("USD");
            expect(screen.getAllByPlaceholderText("Enter amount")[0]).toHaveValue(
              currencyFormatterV2(String(response.receiverAmount), "USD", false)
            );
            // you pay
            expect(screen.getByTestId(`selectCurrency-youPayCurrency`)).toHaveValue("SGD");
            expect(screen.getAllByPlaceholderText("Enter amount")[1]).toHaveValue(
              currencyFormatterV2(String(response.totalAmount), "SGD", false)
            );
          });
        });

        it("should able to change Pay from", async () => {
          setup();
          await manuallyRenderBillDetailsFields();

          await goToPaymentForm();

          await waitFor(() => {
            expect(screen.getByPlaceholderText("Enter Pay from")).toHaveValue(billTeamWallaet.teams[0].wallet_id);
          });

          userEvent.selectOptions(
            screen.getByPlaceholderText("Enter Pay from"),
            screen.getByText(billTeamWallaet.teams[1].name)
          );

          await waitFor(() => {
            expect(screen.getByPlaceholderText("Enter Pay from")).toHaveValue(billTeamWallaet.teams[1].wallet_id);
          });
        });

        it("should able to change Remark for Recipient", async () => {
          setup();
          await manuallyRenderBillDetailsFields();

          await goToPaymentForm();

          const placeholderText = "Enter remarks";

          await waitFor(() => {
            expect(screen.getByPlaceholderText(placeholderText)).toBeInTheDocument();
          });

          userEvent.type(screen.getByPlaceholderText(placeholderText), "remark");

          await waitFor(() => {
            expect(screen.getByPlaceholderText(placeholderText)).toHaveValue("remark");
          });
        });

        it("should able to change Send Payment Updates to", async () => {
          const { container } = setup();
          await manuallyRenderBillDetailsFields();

          await goToPaymentForm();

          const placeholderText = "Enter emails";

          await waitFor(() => {
            expect(screen.getByText(placeholderText)).toBeInTheDocument();
          });

          userEvent.type(container.querySelector('div[name="sendPaymentUpdatesTo"] input'), "admin@google.com");
          userEvent.keyboard(" ");

          await waitFor(() => {
            // 1 value, other is generated options
            expect(screen.getAllByText("admin@google.com")).toHaveLength(4);
          });
        });

        it("should able to change Attachment", async () => {
          const { container } = setup();

          await manuallyRenderBillDetailsFields();

          await goToPaymentForm();

          await waitFor(() => {
            expect(container.querySelector(".ant-upload input")).toBeInTheDocument();
          });

          const blob = new Blob(["asdasd"]);
          const file1 = new File([blob], "uploading.png", {
            type: "image/PNG",
          });

          userEvent.upload(container.querySelector(".ant-upload input"), file1);

          await waitFor(() => {
            expect(container.querySelector(".ant-upload")).toBeInTheDocument();

            expect(screen.getByText("uploading.png")).toBeInTheDocument();
          });

          const blob2 = new Blob(["basdawaa"]);
          const file2 = new File([blob2], "file_2.pdf", {
            type: "application/PDF",
          });

          userEvent.upload(container.querySelector(".ant-upload input"), file2);

          await waitFor(() => {
            expect(container.querySelector(".ant-upload")).toBeInTheDocument();

            expect(screen.getByText("file_2.pdf")).toBeInTheDocument();
          });
        });

        describe("PH country & currency", () => {
          const goToAdditionalFieldsPH = async () => {
            await manuallyRenderBillDetailsFields();

            // Tax is required for PH
            await fillTax();

            const totalAmount = String(billCorridorSimulatorPHP.totalAmount);

            await goToPaymentForm("PHP", totalAmount, false);

            await waitFor(() => {
              // you pay
              expect(screen.getByTestId(`selectCurrency-youPayCurrency`)).toHaveValue("PHP");
              expect(screen.getAllByPlaceholderText("Enter amount")[1]).toHaveValue(totalAmount);
            });

            userEvent.click(screen.getByText("Next"));

            // show additional fields
            await waitFor(() => {
              expect(screen.getByText("Additional transfer details")).toBeInTheDocument();
            });
          };
          it("Should render additional fields", async () => {
            Object.defineProperty(window.document, "cookie", {
              writable: true,
              value:
                "reauth=01f0e514-c77d-11eb-9fdb-0242ac110002vspenmo1020135b8-c77d-11eb-ad45-0242ac110002vspenmo1PH",
            });

            (APIClient.getData as jest.Mock).mockImplementation(
              (
                service: string,
                params: string = "",
                payloadCallBack: any = false,
                config: { [key: string]: any } = {}
              ) =>
                mockGetAPI(service, params, payloadCallBack, config, {
                  phpVendor: true,
                })
            );
            // You pay amount is more than 500k
            setup({
              store: {
                wallet: { data: { currency_code: "PHP" } },
                b2bOrgDetailReducer: { data: { payload: { isShowBillFeeCalculator: false, countryCode: "PH" } } },
              },
            });

            await goToAdditionalFieldsPH();
          });

          it("Should able to change Recipient Address", async () => {
            Object.defineProperty(window.document, "cookie", {
              writable: true,
              value:
                "reauth=01f0e514-c77d-11eb-9fdb-0242ac110002vspenmo1020135b8-c77d-11eb-ad45-0242ac110002vspenmo1PH",
            });

            (APIClient.getData as jest.Mock).mockImplementation(
              (
                service: string,
                params: string = "",
                payloadCallBack: any = false,
                config: { [key: string]: any } = {}
              ) =>
                mockGetAPI(service, params, payloadCallBack, config, {
                  phpVendor: true,
                })
            );
            // You pay amount is more than 500k
            setup({
              store: {
                wallet: { data: { currency_code: "PHP" } },
                b2bOrgDetailReducer: { data: { payload: { isShowBillFeeCalculator: false, countryCode: "PH" } } },
              },
            });

            await goToAdditionalFieldsPH();

            await waitFor(() => {
              expect(screen.getByPlaceholderText("Enter Recipient Address")).toBeInTheDocument();
              expect(screen.getByText("255 characters left")).toBeInTheDocument();
            });

            const value = "Address here";

            userEvent.type(screen.getByPlaceholderText("Enter Recipient Address"), value);

            await waitFor(() => {
              expect(screen.getByPlaceholderText("Enter Recipient Address")).toHaveValue(value);
              expect(screen.getByText(`${255 - value.length} characters left`)).toBeInTheDocument();
            });
          });
        });

        // TO DO: it should able to go next (preview)
      });
    });
  });
});
