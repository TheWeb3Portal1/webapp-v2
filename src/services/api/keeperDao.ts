import axios from 'axios';
import BigNumber from 'bignumber.js';
// @ts-ignore
import JSONbig from 'json-bigint';
import { TokenListItem } from 'services/observables/tokens';
import { ethToken, wethToken } from 'services/web3/config';
import { createOrder, depositWeth } from 'services/web3/swap/limit';

export interface StringRfq {
  makerToken: string;
  takerToken: string;
  makerAmount: string;
  takerAmount: string;
  maker: string;
  taker: string;
  txOrigin: string;
  pool: string;
  expiry: string;
  salt: string;
}
export interface KeeperTokenResponse {
  result: Result;
  message: string;
}

export enum OrderStatus {
  INVALID,
  FILLABLE,
  FILLED,
  CANCELLED,
  EXPIRED,
}

export interface Result {
  keywords: string[];
  logoURI: string;
  name: string;
  timestamp: string;
  tokens: Token[];
  version: Version;
}

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  symbol: string;
}

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export interface OrderResponse {
  orders: OrderElement[];
  message: string;
}

export interface OrderElement {
  order: OrderOrder;
  metaData: MetaData;
}

export interface MetaData {
  orderHash: string;
  makerBalance_makerToken: number;
  makerAllowance_makerToken: number;
  status: OrderStatus;
  filledAmount_takerToken: number;
  remainingFillableAmount_takerToken: BigNumber;
}

export interface OrderOrder {
  maker: string;
  taker: string;
  makerAmount: BigNumber;
  takerAmount: BigNumber;
  makerToken: string;
  takerToken: string;
  salt: number;
  expiry: number;
  chainId: number;
  txOrigin: string;
  pool: string;
  verifyingContract: string;
  signature: Signature;
}

export const orderToStringOrder = (order: OrderOrder): StringRfq => ({
  expiry: String(order.expiry),
  makerAmount: order.makerAmount.toString(),
  salt: String(order.salt),
  takerAmount: order.takerAmount.toString(),
  maker: order.maker,
  makerToken: order.makerToken,
  pool: order.pool,
  taker: order.taker,
  takerToken: order.takerToken,
  txOrigin: order.txOrigin,
});

export interface Signature {
  signatureType: number;
  v: number;
  r: string;
  s: string;
}

export interface RfqOrderJson {
  maker: string;
  taker: string;
  makerToken: string;
  takerToken: string;
  makerAmount: string;
  takerAmount: string;
  txOrigin: string;
  pool: string;
  expiry: number;
  salt: string;
  chainId: number; // Ethereum Chain Id where the transaction is submitted.
  verifyingContract: string; // Address of the contract where the transaction should be sent.
  signature: Signature;
}

export interface InfoResponse {
  result: Result;
  message: string;
}

export interface Result {
  orderDetails: OrderDetails;
  tokenList: DaoTokenList;
  recommendedMinTradeAmounts: RecommendedMinTradeAmounts;
}

export interface OrderDetails {
  verifyingContract: string;
  chainId: number;
  txOrigin: string;
  taker: string;
  pool: string;
}

export interface RecommendedMinTradeAmounts {
  TODO: number;
}

export interface DaoTokenList {
  keywords: string[];
  logoURI: string;
  name: string;
  timestamp: string;
  tokens: Token[];
  version: Version;
}

const baseUrl: string = 'https://hidingbook.keeperdao.com/api/v1';

export const getTokenList = async () => {
  const res = await axios.get<KeeperTokenResponse>(`${baseUrl}/tokenList`);

  return res.data;
};

export const getOrders = async (currentUser: string) => {
  const res = await axios.get<OrderResponse>(
    `${baseUrl}/orders?maker=${currentUser}`,
    { transformResponse: (res) => JSONbig.parse(res) }
  );
  return res.data;
};

const getInfo = async () => {
  const res = await axios.get<InfoResponse>(`${baseUrl}/info`);
  return res.data;
};

export const getTxOrigin = async (): Promise<string> => {
  const res = await getInfo();
  return res.result.orderDetails.txOrigin;
};

export const sendOrders = async (rfqOrder: RfqOrderJson[]) => {
  const url = `${baseUrl}/orders`;

  try {
    const res = await axios.post<{
      message: string;
      result: { hashList: string[] };
    }>(url, rfqOrder);

    const succeededResponseMessage = 'Order creation succeeded';
    if (res.data.message == succeededResponseMessage) {
      return res.data;
    } else {
      throw new Error(`Unexpected response from server, ${res.data.message}`);
    }
  } catch (e) {
    throw new Error(`Unexpected error during send order request ${e.message}`);
  }
};

export const swapLimit = async (
  fromToken: TokenListItem,
  toToken: TokenListItem,
  from: string,
  to: string,
  user: string,
  duration: plugin.Duration,
  onPrompt: Function
) => {
  const fromIsEth = ethToken.toLowerCase() === fromToken.address.toLowerCase();

  if (fromIsEth) {
    const success = await depositWeth(from, user, onPrompt);
  }

  const newFrom = fromIsEth ? { ...fromToken, address: wethToken } : fromToken;

  await createOrder(
    newFrom,
    toToken,
    from,
    to,
    user,
    duration.asSeconds(),
    onPrompt
  );
};
