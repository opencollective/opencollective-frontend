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
  {
    label: (
      <Flex>
        <Image alt="DOGE (Dogecoin)" width={18} height={18} src="/static/images/crypto-logos/DOGE.svg" />
        <Span ml={2}>DOGE (Dogecoin)</Span>
      </Flex>
    ),
    labelWithoutImage: 'DOGE (Dogecoin)',
    value: 'DOGE',
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
  },
];
