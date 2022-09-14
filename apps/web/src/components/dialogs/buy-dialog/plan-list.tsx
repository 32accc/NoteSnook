/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Text, Flex, Button } from "@theme-ui/components";
import * as Icon from "../../icons";
import { ReactComponent as Nomad } from "../../../assets/nomad.svg";
import { Period, Plan } from "./types";
import { PLAN_METADATA, usePlans } from "./plans";
import { useEffect } from "react";
import { getCurrencySymbol } from "./helpers";

type PlansListProps = {
  onPlanSelected: (plan: Plan) => void;
  onPlansLoaded?: (plans: Plan[]) => void;
};
export function PlansList(props: PlansListProps) {
  const { onPlanSelected, onPlansLoaded } = props;
  const { isLoading, plans, discount, country } = usePlans();

  useEffect(() => {
    if (isLoading || !onPlansLoaded) return;
    onPlansLoaded(plans);
  }, [isLoading, onPlansLoaded, plans]);

  return (
    <>
      <Nomad width={200} />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Choose a plan
      </Text>
      <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
        {discount ? (
          <>
            We are giving a special <b>{discount}% discount</b> to all users
            from {country}.
          </>
        ) : (
          "Notesnook profits when you purchase a subscription — not by selling your data."
        )}
      </Text>
      <Flex mt={2} sx={{ flexDirection: "column", alignSelf: "stretch" }}>
        {plans.map((plan) => {
          const metadata = PLAN_METADATA[plan.period];
          return (
            <Button
              key={metadata.title}
              disabled={isLoading}
              data-test-id={`checkout-plan`}
              variant="tool"
              mt={1}
              bg="transparent"
              // sx={
              //   {
              //     // bg: selectedPlan?.key === plan.key ? "border" : "transparent",
              //     // border:
              //     //   selectedPlan?.key === plan.key ? "1px solid var(--primary)" : "none",
              //   }
              // }
              onClick={() => onPlanSelected(plan)}
              sx={{
                flex: 1,
                textAlign: "start",
                alignItems: "center",
                justifyContent: "space-between",
                display: "flex"
              }}
            >
              <Text
                variant="subtitle"
                sx={{ fontWeight: "normal" }}
                data-test-id="title"
              >
                {metadata.title}
                <br />
                <Text
                  variant="body"
                  sx={{ fontWeight: "normal", color: "fontTertiary" }}
                >
                  {metadata.subtitle}
                </Text>
              </Text>
              {isLoading ? <Icon.Loading /> : <RecurringPricing plan={plan} />}
            </Button>
          );
        })}
      </Flex>
    </>
  );
}

type RecurringPricingProps = {
  plan: Plan;
};
function RecurringPricing(props: RecurringPricingProps) {
  const { plan } = props;
  return (
    <Text
      sx={{ flexShrink: 0, fontSize: "subBody", textAlign: "end" }}
      variant="body"
    >
      {plan.originalPrice && (
        <Text
          sx={{
            textDecorationLine: "line-through",
            fontSize: "body",
            color: "fontTertiary"
          }}
        >
          {getCurrencySymbol(plan.currency)}
          {plan.originalPrice.gross}
        </Text>
      )}
      <Text>
        <Text as="span" sx={{ fontSize: "subtitle" }}>
          {getCurrencySymbol(plan.currency)}
          {plan.price.gross}
        </Text>
        {formatPeriod(plan.period)}
      </Text>
    </Text>
  );
}

export function formatPeriod(period: Period) {
  return period === "monthly" ? "/mo" : period === "yearly" ? "/yr" : "";
}

export function getFullPeriod(period: Period) {
  return period === "monthly" ? "month" : period === "yearly" ? "year" : "";
}
