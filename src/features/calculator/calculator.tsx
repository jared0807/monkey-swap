import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { css, SerializedStyles } from "@emotion/react";
import styled from "@emotion/styled";

import ClickOutsideWrapper from "app/components/click-outside-wrapper";
import CurrencySelect from "app/components/currency-select";
import Loader from "app/components/loader";
import { useAppDispatch, useAppSelector } from "app/store";
import {
  resetErrors,
  resetFixedRateInfo,
  setFromAmount,
  setFromCurrency,
  setToCurrency,
} from "features/calculator/calculator-slice";
import CalculatorInput from "features/calculator/components/calculator-input";
import FixedRate from "features/calculator/components/fixed-rate";
import SwapButton from "features/calculator/components/swap-button";
import {
  selectCalculatorUiState,
  selectCurrenciesInfo,
  selectCurrencyInfo,
  selectEstimatedRate,
  selectExchangeAmounts,
  selectExchangeCurrencies,
  selectExchangeError,
  selectExchangeType,
  selectIsFixedRate,
} from "features/calculator/selectors";
import {
  changeFromAmount,
  changeToAmount,
  fetchEstimationNewPair,
  initCalculator,
} from "features/calculator/thunks";
import { BREAKPOINTS } from "helpers/constants";
import { ExchangeType } from "types/exchange";

const LoaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  min-width: 380px;
  width: 100%;
`;

const InfoWrapper = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: 20px;
  justify-content: space-between;
  min-height: 60px;
`;

const Row = styled.div`
  display: flex;
`;

const InfoInnerWrapper = styled.div`
  display: flex;
  margin-right: 8px;
  flex-direction: column;
  gap: 10px;
`;

const UppercaseText = styled.div<{ isPrimary?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  color: ${({ theme, isPrimary }): string =>
    isPrimary ? theme.colors.primary : theme.colors.text.main};
  font-weight: ${({ isPrimary }): number => (isPrimary ? 700 : 500)};
  text-transform: uppercase;
  align-self: center;
`;

const NoWrap = styled.span`
  white-space: nowrap;
`;

const InfoText = styled.span`
  color: ${({ theme }): string => theme.colors.text.main};
  font-size: 14px;
  display: flex;
  gap: 5px;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    flex-direction: column;
  }
`;

const OpacityText = styled.span`
  opacity: 0.5;
  align-self: center;

  @media (max-width: ${BREAKPOINTS.mobile}) {
    align-self: auto;
  }
`;

const openedList = css`
  visibility: visible;
  opacity: 1;
`;

const closedList = css`
  visibility: hidden;
  opacity: 0;
`;

const CurrencySelectWrapper = styled.div<{ isOpened: boolean }>`
  background-color: ${({ theme }): string => theme.colors.background.light};
  border-radius: ${({ theme }): string => theme.borderRadius.normal};
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 15px;
  transition: 0.2s linear;
  width: 85%;
  z-index: 5;
  ${({ isOpened }): SerializedStyles => (isOpened ? openedList : closedList)}
  box-shadow: ${({ theme }): string => theme.boxShadow.primary};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Calculator: React.FC = () => {
  const isFixedRate = useAppSelector(selectIsFixedRate);
  const exchangeType = useAppSelector(selectExchangeType);
  const { errorMessage } = useAppSelector(selectExchangeError);
  const estimatedRate = useAppSelector(selectEstimatedRate);
  const { fromAmount, toAmount, maxAmount, minAmount } = useAppSelector(
    selectExchangeAmounts
  );
  const { isLoadingCalculator } = useAppSelector(selectCalculatorUiState);
  const { fromCurrency, toCurrency } = useAppSelector(selectExchangeCurrencies);
  const { isLoadingFromInput, isLoadingToInput, isFromInputTouched } =
    useAppSelector(selectCalculatorUiState);

  const currenciesInfo = useAppSelector(selectCurrenciesInfo);
  const toCurrencyInfo = useAppSelector((state) =>
    selectCurrencyInfo(state, toCurrency)
  );
  const fromCurrencyInfo = useAppSelector((state) =>
    selectCurrencyInfo(state, fromCurrency)
  );

  const [isOpenedSelectCurrencyTo, setIsOpenedSelectCurrencyTo] =
    useState(false);
  const [isOpenedSelectCurrencyFrom, setIsOpenedSelectCurrencyFrom] =
    useState(false);

  const isErrorFromInput = useMemo(
    () => exchangeType === ExchangeType.Direct && !!errorMessage,
    [exchangeType, errorMessage]
  );
  const isErrorToInput = useMemo(
    () => exchangeType === ExchangeType.Reverse && !!errorMessage,
    [exchangeType, errorMessage]
  );
  const checkedAmount = useMemo(
    () => (exchangeType === ExchangeType.Direct ? fromAmount : toAmount),
    [exchangeType, fromAmount, toAmount]
  );

  const formattedErrorMessage = useMemo(() => {
    if (checkedAmount && minAmount && Number(checkedAmount) < minAmount) {
      return `Minimum amount is ${minAmount} ${
        isErrorFromInput
          ? fromCurrencyInfo?.ticker?.toUpperCase()
          : toCurrencyInfo?.ticker?.toUpperCase()
      }`;
    }

    if (checkedAmount && maxAmount && Number(checkedAmount) > maxAmount) {
      return `Maximum amount is ${maxAmount} ${
        isErrorFromInput
          ? fromCurrencyInfo?.ticker?.toUpperCase()
          : toCurrencyInfo?.ticker?.toUpperCase()
      }`;
    }

    return errorMessage;
  }, [
    errorMessage,
    minAmount,
    maxAmount,
    isErrorFromInput,
    fromCurrencyInfo,
    toCurrencyInfo,
    checkedAmount,
  ]);

  const dispatch = useAppDispatch();

  const handleFromAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;

      void dispatch(
        changeFromAmount({ amount: value, currencyInfo: fromCurrencyInfo })
      );
    },
    [dispatch, fromCurrencyInfo]
  );

  const handleToAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;

      void dispatch(
        changeToAmount({ amount: value, currencyInfo: fromCurrencyInfo })
      );
    },
    [dispatch, fromCurrencyInfo]
  );

  const handleFromCurrencySelect = useCallback(
    (currency: string) => () => {
      setIsOpenedSelectCurrencyFrom(false);
      dispatch(setFromCurrency(currency));

      if (!isFromInputTouched) {
        const amount =
          currenciesInfo[currency]?.manualDefaultValue ||
          currenciesInfo[currency]?.defaultValue;

        if (amount) {
          dispatch(setFromAmount(String(amount)));
        }
      }
    },
    [dispatch, isFromInputTouched, currenciesInfo]
  );

  const handleToCurrencySelect = useCallback(
    (currency: string) => () => {
      setIsOpenedSelectCurrencyTo(false);
      dispatch(setToCurrency(currency));
    },
    [dispatch]
  );

  const handleCurrencySelectPress = useCallback(
    (input: string, state: boolean) => () => {
      if (input === "from") {
        if (isOpenedSelectCurrencyTo && state) {
          setIsOpenedSelectCurrencyTo(false);
        }

        setIsOpenedSelectCurrencyFrom(state);

        return;
      }

      if (isOpenedSelectCurrencyFrom && state) {
        setIsOpenedSelectCurrencyFrom(false);
      }

      setIsOpenedSelectCurrencyTo(state);
    },
    [isOpenedSelectCurrencyTo, isOpenedSelectCurrencyFrom]
  );

  useEffect(() => {
    void dispatch(initCalculator());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoadingCalculator) {
      void dispatch(resetErrors());
      void dispatch(resetFixedRateInfo());
      void dispatch(fetchEstimationNewPair());
    }
  }, [
    dispatch,
    exchangeType,
    isFixedRate,
    toCurrency,
    fromCurrency,
    isLoadingCalculator,
  ]);

  if (isLoadingCalculator) {
    return (
      <LoaderWrapper>
        <Loader />
      </LoaderWrapper>
    );
  }

  return (
    <>
      <InputWrapper>
        <ClickOutsideWrapper
          setIsOpen={(value): void => setIsOpenedSelectCurrencyFrom(value)}
        >
          <CalculatorInput
            title="You Send"
            currency={fromCurrency}
            amount={fromAmount}
            isLoading={isLoadingFromInput}
            onCurrencyPress={handleCurrencySelectPress("from", true)}
            onChange={handleFromAmountChange}
            isErrorShown={isErrorFromInput}
            errorMessage={formattedErrorMessage}
          />
          <CurrencySelectWrapper isOpened={isOpenedSelectCurrencyFrom}>
            <CurrencySelect
              title="Select a currency from"
              onSelect={handleFromCurrencySelect}
              onClose={handleCurrencySelectPress("from", false)}
              isOpened={isOpenedSelectCurrencyFrom}
            />
          </CurrencySelectWrapper>
        </ClickOutsideWrapper>
      </InputWrapper>
      <InfoWrapper>
        <InfoInnerWrapper>
          <InfoText>
            <OpacityText>No extra fees</OpacityText>
          </InfoText>
          <InfoText>
            <OpacityText>Estimated rate:</OpacityText>
            <Row>
              <UppercaseText isPrimary={isFixedRate}>
                {isLoadingToInput || isLoadingFromInput ? (
                  <Loader size="16px" />
                ) : (
                  <>
                    <NoWrap>1 {fromCurrencyInfo?.ticker}</NoWrap>
                    <NoWrap>
                      ~ {estimatedRate || "-"} {toCurrencyInfo?.ticker}
                    </NoWrap>
                  </>
                )}
              </UppercaseText>
              <FixedRate />
            </Row>
          </InfoText>
        </InfoInnerWrapper>
        <SwapButton />
      </InfoWrapper>
      <InputWrapper>
        <ClickOutsideWrapper
          setIsOpen={(value): void => setIsOpenedSelectCurrencyTo(value)}
        >
          <CalculatorInput
            title="You Get"
            currency={toCurrency}
            amount={toAmount}
            isLoading={isLoadingToInput}
            onCurrencyPress={handleCurrencySelectPress("to", true)}
            isFixedRate={isFixedRate}
            onChange={handleToAmountChange}
            isErrorShown={isErrorToInput}
            errorMessage={formattedErrorMessage}
          />
          <CurrencySelectWrapper isOpened={isOpenedSelectCurrencyTo}>
            <CurrencySelect
              title="Select a currency to"
              onSelect={handleToCurrencySelect}
              onClose={handleCurrencySelectPress("to", false)}
              isOpened={isOpenedSelectCurrencyTo}
            />
          </CurrencySelectWrapper>
        </ClickOutsideWrapper>
      </InputWrapper>
    </>
  );
};

export default Calculator;
