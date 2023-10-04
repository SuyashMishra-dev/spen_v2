import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import qs from "query-string";
import { ControllerRenderProps, useFormContext } from "react-hook-form";

import Select from "../Select";
import { SelectProps } from "antd/lib/select";
import { useMutableData } from "API/useData";
import { API_URL } from "Views/Bills/V2/constants";

import { currencyFormatter, GetBaseAuthObject, GetCurrencyCode, isBookkeeper } from "utility";
import { mapTeamToWallet } from "utility/Bills";
import { USER_ROLE } from "constants/Team.constant";

/**
 * IMPROVEMENT: PayFrom component should able to use Select component
 * with a dynamic fetcher to fetch data
 */
const PayFrom = forwardRef((props: Partial<SelectProps<any> & ControllerRenderProps>, ref) => {
  const { name } = props;
  const selectRef = useRef(null);
  useImperativeHandle(ref, () => selectRef.current);

  const { resetField } = useFormContext();

  const orgId = GetBaseAuthObject().orgId;

  const userUrl = qs.stringifyUrl({
    url: `${API_URL.userInfo}/${GetBaseAuthObject().userId}`,
    query: {
      organisation_id: orgId,
    },
  });

  const walletUrl = qs.stringifyUrl({
    url: `${API_URL.org}/${orgId}/team-wallet`,
    query: {
      form_type: "bill",
    },
  });

  const { data: userData, isValidating: userLoading } = useMutableData(userUrl);
  const { data, isValidating } = useMutableData(walletUrl);

  const walletLoading = userLoading || isValidating;

  const walletOptions = useMemo(() => {
    const userInfo = userData?.data?.payload?.user;
    const teamData = data?.data?.payload;

    if (teamData?.teams?.length && userInfo) {
      const currencyCode = GetCurrencyCode();
      const data = mapTeamToWallet({
        teams: teamData.teams,
        isAdmin: userInfo.is_admin,
        isAccountant: userInfo?.company_role === USER_ROLE.ACCOUNTANT, // TO DO: need enlightment for company_role
        isBookkeeper: isBookkeeper(userInfo?.company_role),
        isCards2: teamData.is_balance_hidden,
        manageTeams: userInfo.manage_teams,
      });

      resetField(name, { defaultValue: data[0].id });

      return data.map((item) => {
        const { id, name, amount } = item;
        const currencyAmount = Number(amount) === 0 ? "" : `(${currencyFormatter(amount, currencyCode, false)})`;

        return {
          value: id,
          label: `${name} ${currencyAmount}`,
        };
      });
    }

    return [];
  }, [data?.data, userData?.data]);

  return (
    <Select
      ref={selectRef}
      {...props}
      showSearch
      loading={walletLoading}
      filterOption={(input, option) => String(option?.label)?.toLowerCase().includes(input.toLowerCase())}
      options={walletOptions}
    />
  );
});

export default PayFrom;
