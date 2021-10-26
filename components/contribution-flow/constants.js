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

export const PAYMENT_FLOW = {
  CRYPTO: 'crypto',
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
    minDonation: 0.00001,
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
    minDonation: 0.001,
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
    minDonation: 0.001,
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
    minDonation: 0.01,
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
    minDonation: 0.001,
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
    minDonation: 0.1,
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
    minDonation: 1,
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
    minDonation: 0.1,
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
    minDonation: 1,
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
    minDonation: 0.1,
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
    minDonation: 10,
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
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="DOGE (Dogecoin)" width={18} height={18} src="/static/images/crypto-logos/DOGE.svg" />
        <Span ml={2}>DOGE (Dogecoin)</Span>
      </Flex>
    ),
    labelWithoutImage: 'DOGE (Dogecoin)',
    value: 'DOGE',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="COMP (Compound)" width={18} height={18} src="/static/images/crypto-logos/COMP.svg" />
        <Span ml={2}>COMP (Compound)</Span>
      </Flex>
    ),
    labelWithoutImage: 'COMP (Compound)',
    value: 'COMP',
    minDonation: 0.001,
  },
  {
    label: (
      <Flex>
        <Image alt="SNX (Synthetix)" width={18} height={18} src="/static/images/crypto-logos/SNX.svg" />
        <Span ml={2}>SNX (Synthetix)</Span>
      </Flex>
    ),
    labelWithoutImage: 'SNX (Synthetix)',
    value: 'SNX',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="AAVE (Aave)" width={18} height={18} src="/static/images/crypto-logos/AAVE.svg" />
        <Span ml={2}>AAVE (Aave)</Span>
      </Flex>
    ),
    labelWithoutImage: 'AAVE (Aave)',
    value: 'AAVE',
    minDonation: 0.001,
  },
  {
    label: (
      <Flex>
        <Image alt="GRT (The Graph)" width={18} height={18} src="/static/images/crypto-logos/GRT.svg" />
        <Span ml={2}>GRT (The Graph)</Span>
      </Flex>
    ),
    labelWithoutImage: 'GRT (The Graph)',
    value: 'GRT',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="BNT (Bancor)" width={18} height={18} src="/static/images/crypto-logos/BNT.svg" />
        <Span ml={2}>BNT (Bancor)</Span>
      </Flex>
    ),
    labelWithoutImage: 'BNT (Bancor)',
    value: 'BNT',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="SUSHI (SushiSwap)" width={18} height={18} src="/static/images/crypto-logos/SUSHI.svg" />
        <Span ml={2}>SUSHI (SushiSwap)</Span>
      </Flex>
    ),
    labelWithoutImage: 'SUSHI (SushiSwap)',
    value: 'SUSHI',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="UNI (Uniswap)" width={18} height={18} src="/static/images/crypto-logos/UNI.svg" />
        <Span ml={2}>UNI (Uniswap)</Span>
      </Flex>
    ),
    labelWithoutImage: 'UNI (Uniswap)',
    value: 'UNI',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="MATIC (Polygon)" width={18} height={18} src="/static/images/crypto-logos/MATIC.svg" />
        <Span ml={2}>MATIC (Polygon)</Span>
      </Flex>
    ),
    labelWithoutImage: 'MATIC (Polygon)',
    value: 'MATIC',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="GUSD (Gemini Dollar)" width={18} height={18} src="/static/images/crypto-logos/GUSD.svg" />
        <Span ml={2}>GUSD (Gemini Dollar)</Span>
      </Flex>
    ),
    labelWithoutImage: 'GUSD (Gemini Dollar)',
    value: 'GUSD',
    minDonation: 0.000001,
  },
  {
    label: (
      <Flex>
        <Image alt="CRV (Curve DAO Token)" width={18} height={18} src="/static/images/crypto-logos/CRV.svg" />
        <Span ml={2}>CRV (Curve DAO Token)</Span>
      </Flex>
    ),
    labelWithoutImage: 'CRV (Curve DAO Token)',
    value: 'CRV',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="1INCH (1inch)" width={18} height={18} src="/static/images/crypto-logos/1INCH.svg" />
        <Span ml={2}>1INCH (1inch)</Span>
      </Flex>
    ),
    labelWithoutImage: '1INCH (1inch)',
    value: '1INCH',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="BAL (Balancer)" width={18} height={18} src="/static/images/crypto-logos/BAL.svg" />
        <Span ml={2}>BAL (Balancer)</Span>
      </Flex>
    ),
    labelWithoutImage: 'BAL (Balancer)',
    value: 'BAL',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="UMA (UMA)" width={18} height={18} src="/static/images/crypto-logos/UMA.svg" />
        <Span ml={2}>UMA (UMA)</Span>
      </Flex>
    ),
    labelWithoutImage: 'UMA (UMA)',
    value: 'UMA',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="YFI (Yearn Finance)" width={18} height={18} src="/static/images/crypto-logos/YFI.svg" />
        <Span ml={2}>YFI (Yearn Finance)</Span>
      </Flex>
    ),
    labelWithoutImage: 'YFI (Yearn Finance)',
    value: 'YFI',
    minDonation: 0.00001,
  },
  {
    label: (
      <Flex>
        <Image alt="ALCX (Alchemix)" width={18} height={18} src="/static/images/crypto-logos/ALCX.svg" />
        <Span ml={2}>ALCX (Alchemix)</Span>
      </Flex>
    ),
    labelWithoutImage: 'ALCX (Alchemix)',
    value: 'ALCX',
    minDonation: 0.00001,
  },
  {
    label: (
      <Flex>
        <Image alt="SAND (Sandbox)" width={18} height={18} src="/static/images/crypto-logos/SAND.svg" />
        <Span ml={2}>SAND (Sandbox)</Span>
      </Flex>
    ),
    labelWithoutImage: 'SAND (Sandbox)',
    value: 'SAND',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="INJ (Injective Protocol)" width={18} height={18} src="/static/images/crypto-logos/INJ.svg" />
        <Span ml={2}>INJ (Injective Protocol)</Span>
      </Flex>
    ),
    labelWithoutImage: 'INJ (Injective Protocol)',
    value: 'INJ',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="PAXG (PAX Gold)" width={18} height={18} src="/static/images/crypto-logos/PAXG.svg" />
        <Span ml={2}>PAXG (PAX Gold)</Span>
      </Flex>
    ),
    labelWithoutImage: 'PAXG (PAX Gold)',
    value: 'PAXG',
    minDonation: 0.0001,
  },
  {
    label: (
      <Flex>
        <Image alt="ENJ (Enjin Coin)" width={18} height={18} src="/static/images/crypto-logos/ENJ.svg" />
        <Span ml={2}>ENJ (Enjin Coin)</Span>
      </Flex>
    ),
    labelWithoutImage: 'ENJ (Enjin Coin)',
    value: 'ENJ',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="FIL (Filecoin)" width={18} height={18} src="/static/images/crypto-logos/FIL.svg" />
        <Span ml={2}>FIL (Filecoin)</Span>
      </Flex>
    ),
    labelWithoutImage: 'FIL (Filecoin)',
    value: 'FIL',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="ANKR (Ankr)" width={18} height={18} src="/static/images/crypto-logos/ANKR.svg" />
        <Span ml={2}>ANKR (Ankr)</Span>
      </Flex>
    ),
    labelWithoutImage: 'ANKR (Ankr)',
    value: 'ANKR',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="XTZ (Tezos)" width={18} height={18} src="/static/images/crypto-logos/XTZ.svg" />
        <Span ml={2}>XTZ (Tezos)</Span>
      </Flex>
    ),
    labelWithoutImage: 'XTZ (Tezos)',
    value: 'XTZ',
    minDonation: 0.02,
  },
  {
    label: (
      <Flex>
        <Image alt="MKR (Maker)" width={18} height={18} src="/static/images/crypto-logos/MKR.svg" />
        <Span ml={2}>MKR (Maker)</Span>
      </Flex>
    ),
    labelWithoutImage: 'MKR (Maker)',
    value: 'MKR',
    minDonation: 0.001,
  },
  {
    label: (
      <Flex>
        <Image alt="LRC (Loopring)" width={18} height={18} src="/static/images/crypto-logos/LRC.svg" />
        <Span ml={2}>LRC (Loopring)</Span>
      </Flex>
    ),
    labelWithoutImage: 'LRC (Loopring)',
    value: 'LRC',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="BOND (BarnBridge)" width={18} height={18} src="/static/images/crypto-logos/BOND.svg" />
        <Span ml={2}>BOND (BarnBridge)</Span>
      </Flex>
    ),
    labelWithoutImage: 'BOND (BarnBridge)',
    value: 'BOND',
    minDonation: 0.001,
  },
  {
    label: (
      <Flex>
        <Image alt="SKL (Skale)" width={18} height={18} src="/static/images/crypto-logos/SKL.svg" />
        <Span ml={2}>SKL (Skale)</Span>
      </Flex>
    ),
    labelWithoutImage: 'SKL (Skale)',
    value: 'SKL',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="MIR (Mirror Protocol)" width={18} height={18} src="/static/images/crypto-logos/MIR.svg" />
        <Span ml={2}>MIR (Mirror Protocol)</Span>
      </Flex>
    ),
    labelWithoutImage: 'MIR (Mirror Protocol)',
    value: 'MIR',
    minDonation: 0.001,
  },
  {
    label: (
      <Flex>
        <Image alt="LPT (Livepeer)" width={18} height={18} src="/static/images/crypto-logos/LPT.svg" />
        <Span ml={2}>LPT (Livepeer)</Span>
      </Flex>
    ),
    labelWithoutImage: 'LPT (Livepeer)',
    value: 'LPT',
    minDonation: 0.001,
  },
  {
    label: (
      <Flex>
        <Image alt="MANA (Mana)" width={18} height={18} src="/static/images/crypto-logos/MANA.svg" />
        <Span ml={2}>MANA (Mana)</Span>
      </Flex>
    ),
    labelWithoutImage: 'MANA (Mana)',
    value: 'MANA',
    minDonation: 1,
  },
  {
    label: (
      <Flex>
        <Image alt="FTM (Fantom)" width={18} height={18} src="/static/images/crypto-logos/FTM.svg" />
        <Span ml={2}>FTM (Fantom)</Span>
      </Flex>
    ),
    labelWithoutImage: 'FTM (Fantom)',
    value: 'FTM',
    minDonation: 0.03,
  },
  {
    label: (
      <Flex>
        <Image alt="KNC (Kyber)" width={18} height={18} src="/static/images/crypto-logos/KNC.svg" />
        <Span ml={2}>KNC (Kyber)</Span>
      </Flex>
    ),
    labelWithoutImage: 'KNC (Kyber)',
    value: 'KNC',
    minDonation: 0.1,
  },
  {
    label: (
      <Flex>
        <Image alt="CUBE (Cube)" width={18} height={18} src="/static/images/crypto-logos/CUBE.svg" />
        <Span ml={2}>CUBE (Cube)</Span>
      </Flex>
    ),
    labelWithoutImage: 'CUBE (Cube)',
    value: 'CUBE',
    minDonation: 0.01,
  },
  {
    label: (
      <Flex>
        <Image alt="REN (Ren)" width={18} height={18} src="/static/images/crypto-logos/REN.svg" />
        <Span ml={2}>REN (Ren)</Span>
      </Flex>
    ),
    labelWithoutImage: 'REN (Ren)',
    value: 'REN',
    minDonation: 0.1,
  },
];
