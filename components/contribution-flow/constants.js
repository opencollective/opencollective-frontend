import React from 'react';

import { Flex } from '../Grid';
import Image from '../Image';
import { Span } from '../Text';

export const STEPS = {
  PROFILE: 'profile',
  DETAILS: 'details',
  PAYMENT: 'payment',
  SUMMARY: 'summary',
  SUCCESS: 'success',
  CHECKOUT: 'checkout',
};

export const CRYPTO_CURRENCIES = [
  {
    label: (
      <Flex>
        <Image alt="BTC (Bitcoin)" width={18} height={18} src="/static/images/crypto-logos/BTC.svg" />
        <Span ml={2}>BTC (Bitcoin)</Span>
      </Flex>
    ),
    labelWithoutImage: 'BTC (Bitcoin)',
    value: 'BTC',
  },
  {
    label: (
      <Flex>
        <Image alt="ETH (Ethereum)" width={18} height={18} src="/static/images/crypto-logos/ETH.svg" />
        <Span ml={2}>ETH (Ethereum)</Span>
      </Flex>
    ),
    labelWithoutImage: 'ETH (Ethereum)',
    value: 'ETH',
  },
  {
    label: (
      <Flex>
        <Image alt="BCH (Bitcoin Cash)" width={18} height={18} src="/static/images/crypto-logos/BCH.svg" />
        <Span ml={2}>BCH (Bitcoin Cash)</Span>
      </Flex>
    ),
    labelWithoutImage: 'BCH (Bitcoin Cash)',
    value: 'BCH',
  },
  {
    label: (
      <Flex>
        <Image alt="LTC (Litecoin)" width={18} height={18} src="/static/images/crypto-logos/LTC.svg" />
        <Span ml={2}>LTC (Litecoin)</Span>
      </Flex>
    ),
    labelWithoutImage: 'LTC (Litecoin)',
    value: 'LTC',
  },
  {
    label: (
      <Flex>
        <Image alt="ZEC (Zcash)" width={18} height={18} src="/static/images/crypto-logos/ZEC.svg" />
        <Span ml={2}>ZEC (Zcash)</Span>
      </Flex>
    ),
    labelWithoutImage: 'ZEC (Zcash)',
    value: 'ZEC',
  },
  {
    label: (
      <Flex>
        <Image alt="LINK (Chainlink)" width={18} height={18} src="/static/images/crypto-logos/LINK.svg" />
        <Span ml={2}>LINK (Chainlink)</Span>
      </Flex>
    ),
    labelWithoutImage: 'LINK (Chainlink)',
    value: 'LINK',
  },
  {
    label: (
      <Flex>
        <Image alt="BAT (Basic Attention Token)" width={18} height={18} src="/static/images/crypto-logos/BAT.svg" />
        <Span ml={2}>BAT (Basic Attention Token)</Span>
      </Flex>
    ),
    labelWithoutImage: 'BAT (Basic Attention Token)',
    value: 'BAT',
  },
  {
    label: (
      <Flex>
        <Image alt="DAI (Dai)" width={18} height={18} src="/static/images/crypto-logos/DAI.svg" />
        <Span ml={2}>DAI (Dai)</Span>
      </Flex>
    ),
    labelWithoutImage: 'DAI (Dai)',
    value: 'DAI',
  },
  {
    label: (
      <Flex>
        <Image alt="OXT (Orchid)" width={18} height={18} src="/static/images/crypto-logos/OXT.svg" />
        <Span ml={2}>OXT (Orchid)</Span>
      </Flex>
    ),
    labelWithoutImage: 'OXT (Orchid)',
    value: 'OXT',
  },
  {
    label: (
      <Flex>
        <Image alt="STORJ (Storj)" width={18} height={18} src="/static/images/crypto-logos/STORJ.svg" />
        <Span ml={2}>STORJ (Storj)</Span>
      </Flex>
    ),
    labelWithoutImage: 'STORJ (Storj)',
    value: 'STORJ',
  },
  {
    label: (
      <Flex>
        <Image alt="AMP (Amp)" width={18} height={18} src="/static/images/crypto-logos/AMP.svg" />
        <Span ml={2}>AMP (Amp)</Span>
      </Flex>
    ),
    labelWithoutImage: 'AMP (Amp)',
    value: 'AMP',
  },
  {
    label: (
      <Flex>
        <Image alt="ZRX (Ox)" width={18} height={18} src="/static/images/crypto-logos/ZRX.svg" />
        <Span ml={2}>ZRX (Ox)</Span>
      </Flex>
    ),
    labelWithoutImage: 'ZRX (Ox)',
    value: 'ZRX',
  },
];
