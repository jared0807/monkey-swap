import React, { useCallback, useState } from "react";

import styled from "@emotion/styled";
import Image from "next/image";

import ClickOutsideWrapper from "app/components/click-outside-wrapper";
import HoverPopUp from "app/components/hover-pop-up";
import { useAppDispatch, useAppSelector } from "app/store";
import theme from "app/theme";
import { setExchangeType, setFlow } from "features/calculator/calculator-slice";
import {
  selectCalculatorUiState,
  selectExchangeFixedRateId,
  selectIsFixedRate,
} from "features/calculator/selectors";
import useFixedRateTimer from "hooks/use-fixed-rate-timer";
import { ExchangeType, FlowType } from "types/exchange";

const Wrapper = styled.div`
  position: relative;
`;

const InnerWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const WrapperPressedImage = styled.div`
  min-width: 16px;
  cursor: pointer;
`;

const Timer = styled.span`
  align-items: center;
  background-color: ${({ theme: theme1 }): string => theme1.colors.primary};
  border-radius: ${({ theme: theme1 }): string => theme1.borderRadius.small};
  color: ${({ theme: theme1 }): string => theme1.colors.text.main};
  display: flex;
  font-size: 12px;
  font-weight: 700;
  min-width: 60px;
  padding: 2px 4px;
`;

const FixedRate: React.FC = () => {
  const [isShowPopUp, setIsShowPopUp] = useState(false);
  const fixedRateTimer = useFixedRateTimer();
  const isFixedRate = useAppSelector(selectIsFixedRate);
  const { isLoadingEstimation } = useAppSelector(selectCalculatorUiState);
  const fixedExchangeId = useAppSelector(selectExchangeFixedRateId);

  const dispatch = useAppDispatch();

  const handleFixedRatePress = useCallback(() => {
    if (isFixedRate) {
      dispatch(setFlow(FlowType.Standard));
      dispatch(setExchangeType(ExchangeType.Direct));
    } else {
      dispatch(setFlow(FlowType.FixedRate));
      dispatch(setExchangeType(ExchangeType.Reverse));
    }
  }, [isFixedRate, dispatch]);

  return (
    <Wrapper
      onMouseEnter={(): void => setIsShowPopUp(true)}
      onMouseLeave={(): void => setIsShowPopUp(false)}
    >
      {isFixedRate ? (
        <InnerWrapper>
          <WrapperPressedImage onClick={handleFixedRatePress}>
            <Image
              width={16}
              height={20}
              src="/icons/fixed-rate-enabled-icon.svg"
              alt="Lock"
            />
          </WrapperPressedImage>
          {fixedExchangeId && (
            <Timer>
              <Image
                width={16}
                height={16}
                src="/icons/timer-icon.svg"
                alt="Timer"
              />
              {!isLoadingEstimation && fixedRateTimer}
            </Timer>
          )}
        </InnerWrapper>
      ) : (
        <WrapperPressedImage onClick={handleFixedRatePress}>
          <Image
            width={16}
            height={20}
            color={theme.colors.text.main}
            src="/icons/fixed-rate-disabled-icon.png"
            alt="Lock"
          />
        </WrapperPressedImage>
      )}
      {isShowPopUp && (
        <ClickOutsideWrapper setIsOpen={setIsShowPopUp}>
          <HoverPopUp
            title="Fixed Rate Mode"
            text="The exchange is completed regardless of the rate fluctuations. Monkey Swap guarantees you will receive the agreed amount."
          />
        </ClickOutsideWrapper>
      )}
    </Wrapper>
  );
};

export default FixedRate;
