import React from 'react';
import styled from 'styled-components';

import Container from '../Container';
import { Box } from '../Grid';

const StyledSvg = styled.svg`
  #logoContainer {
    transform-origin: 50% 50%;
    transition: 0.3s;
    transform-box: fill-box;

    &:hover {
      transform: scale(1.3);
      transform-origin: 50% 50%;
      transition: transform 300ms ease;
    }
  }
`;

const collectives = [
  {
    id: 'oc',
    path: '/opencollective',
    image: {
      width: 256,
      height: 256,
      transform: 'translate(0.137734 0.131406) scale(0.00286316)',
      xlinkHref: '/static/images/new-home/open-collective-logo.png',
    },
    render: () => (
      <React.Fragment>
        <rect x="437" y="109" width="102" height="102" rx="51" fill="white" />
        <rect x="437" y="109" width="102" height="102" rx="51" fill="url(#oc)" />
        <path
          d="M488 207C462.043 207 441 185.957 441 160H433C433 190.376 457.624 215 488 215V207ZM535 160C535 185.957 513.957 207 488 207V215C518.376 215 543 190.376 543 160H535ZM488 113C513.957 113 535 134.043 535 160H543C543 129.624 518.376 105 488 105V113ZM488 105C457.624 105 433 129.624 433 160H441C441 134.043 462.043 113 488 113V105Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'osc',
    path: '/opensource',
    image: {
      width: 794,
      height: 794,
      transform: 'translate(0 -0.000269401) scale(0.00125945)',
      xlinkHref: '/static/images/new-home/osc-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="354.515" y="280.034" width="64.6041" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
        <path
          d="M386.817 340.603C371.193 340.603 358.515 327.937 358.515 312.318H350.515C350.515 332.361 366.78 348.603 386.817 348.603V340.603ZM415.119 312.318C415.119 327.937 402.441 340.603 386.817 340.603V348.603C406.853 348.603 423.119 332.361 423.119 312.318H415.119ZM386.817 284.034C402.441 284.034 415.119 296.7 415.119 312.318H423.119C423.119 292.276 406.853 276.034 386.817 276.034V284.034ZM386.817 276.034C366.78 276.034 350.515 292.276 350.515 312.318H358.515C358.515 296.7 371.193 284.034 386.817 284.034V276.034Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'ocf',
    path: '/foundation',
    image: {
      width: 888,
      height: 888,
      transform: 'translate(0 -0.000269165) scale(0.00112613)',
      xlinkHref: '/static/images/new-home/ocf-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="202.695" y="26.5992" width="64.604" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
        <path
          d="M234.997 87.1685C219.373 87.1685 206.695 74.5023 206.695 58.8839H198.695C198.695 78.9262 214.961 95.1685 234.997 95.1685V87.1685ZM263.299 58.8839C263.299 74.5023 250.621 87.1685 234.997 87.1685V95.1685C255.034 95.1685 271.299 78.9262 271.299 58.8839H263.299ZM234.997 30.5992C250.621 30.5992 263.299 43.2655 263.299 58.8839H271.299C271.299 38.8416 255.034 22.5992 234.997 22.5992V30.5992ZM234.997 22.5992C214.961 22.5992 198.695 38.8416 198.695 58.8839H206.695C206.695 43.2655 219.373 30.5992 234.997 30.5992V22.5992Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'socialChange',
    path: '/the-social-change-nest',
    image: {
      width: 516,
      height: 593,
      transform: 'translate(0 -0.0749213) scale(0.00193798)',
      xlinkHref: '/static/images/new-home/social-change-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="620.199" y="104.89" width="64.604" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
        <path
          d="M652.501 165.459C636.877 165.459 624.199 152.793 624.199 137.174H616.199C616.199 157.216 632.464 173.459 652.501 173.459V165.459ZM680.803 137.174C680.803 152.793 668.125 165.459 652.501 165.459V173.459C672.538 173.459 688.803 157.216 688.803 137.174H680.803ZM652.501 108.89C668.125 108.89 680.803 121.556 680.803 137.174H688.803C688.803 117.132 672.538 100.89 652.501 100.89V108.89ZM652.501 100.89C632.464 100.89 616.199 117.132 616.199 137.174H624.199C624.199 121.556 636.877 108.89 652.501 108.89V100.89Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'ocnz',
    path: '/ocnz',
    image: {
      width: 330,
      height: 316,
      transform: 'translate(-0.0218706) scale(0.00316285)',
      xlinkHref: '/static/images/new-home/oc-nz-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="390" y="4" width="64.6041" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
        <path
          d="M422.302 64.5693C406.678 64.5693 394 51.903 394 36.2846H386C386 56.3269 402.265 72.5693 422.302 72.5693V64.5693ZM450.604 36.2846C450.604 51.903 437.926 64.5693 422.302 64.5693V72.5693C442.339 72.5693 458.604 56.3269 458.604 36.2846H450.604ZM422.302 8C437.926 8 450.604 20.6663 450.604 36.2846H458.604C458.604 16.2424 442.339 0 422.302 0V8ZM422.302 0C402.265 0 386 16.2424 386 36.2846H394C394 20.6663 406.678 8 422.302 8V0Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'allforclimate',
    path: '/allforclimate',
    image: {
      width: 255,
      height: 255,
      transform: 'translate(0 -0.000269165) scale(0.00392157)',
      xlinkHref: '/static/images/new-home/allforclimate-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="223.692" y="179.144" width="64.604" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
        <path
          d="M255.994 239.713C240.37 239.713 227.692 227.047 227.692 211.429H219.692C219.692 231.471 235.957 247.713 255.994 247.713V239.713ZM284.296 211.429C284.296 227.047 271.618 239.713 255.994 239.713V247.713C276.03 247.713 292.296 231.471 292.296 211.429H284.296ZM255.994 183.144C271.618 183.144 284.296 195.81 284.296 211.429H292.296C292.296 191.387 276.03 175.144 255.994 175.144V183.144ZM255.994 175.144C235.957 175.144 219.692 191.387 219.692 211.429H227.692C227.692 195.81 240.37 183.144 255.994 183.144V175.144Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'fridayForFuture',
    path: '/fridaysforfuture-us',
    image: {
      width: 1200,
      height: 1200,
      transform: 'translate(0 -0.000269063) scale(0.000833333)',
      xlinkHref: '/static/images/new-home/friday-for-future-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="79.1399" y="24.1779" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M101.751 65.3764C91.4764 65.3764 83.1399 57.0464 83.1399 46.7771H75.1399C75.1399 61.4703 87.0638 73.3764 101.751 73.3764V65.3764ZM120.363 46.7771C120.363 57.0464 112.026 65.3764 101.751 65.3764V73.3764C116.439 73.3764 128.363 61.4703 128.363 46.7771H120.363ZM101.751 28.1779C112.026 28.1779 120.363 36.5078 120.363 46.7771H128.363C128.363 32.0839 116.439 20.1779 101.751 20.1779V28.1779ZM101.751 20.1779C87.0638 20.1779 75.1399 32.0839 75.1399 46.7771H83.1399C83.1399 36.5078 91.4764 28.1779 101.751 28.1779V20.1779Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'bushwick',
    path: '/bushwick-ayuda-mutua',
    image: {
      width: 322,
      height: 324,
      transform: 'translate(0.0737122 0.074456) scale(0.00267384)',
      xlinkHref: '/static/images/new-home/bushwick-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="138" y="117" width="45.2228" height="45.1985" rx="22.5993" fill="white" />
        <rect x="138" y="117" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M160.611 158.199C150.337 158.199 142 149.869 142 139.599H134C134 154.292 145.924 166.199 160.611 166.199V158.199ZM179.223 139.599C179.223 149.869 170.886 158.199 160.611 158.199V166.199C175.299 166.199 187.223 154.292 187.223 139.599H179.223ZM160.611 121C170.886 121 179.223 129.33 179.223 139.599H187.223C187.223 124.906 175.299 113 160.611 113V121ZM160.611 113C145.924 113 134 124.906 134 139.599H142C142 129.33 150.337 121 160.611 121V113Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'extinctionRebellion',
    path: '/xr-belgium-legal',
    image: {
      width: 756,
      height: 756,
      transform: 'translate(0 -0.000269063) scale(0.00132275)',
      xlinkHref: '/static/images/new-home/extinction-rebellion-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="132" y="235" width="45.2228" height="45.1985" rx="22.5993" fill="white" />
        <rect x="132" y="235" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M154.611 276.199C144.337 276.199 136 267.869 136 257.599H128C128 272.292 139.924 284.199 154.611 284.199V276.199ZM173.223 257.599C173.223 267.869 164.886 276.199 154.611 276.199V284.199C169.299 284.199 181.223 272.292 181.223 257.599H173.223ZM154.611 239C164.886 239 173.223 247.33 173.223 257.599H181.223C181.223 242.906 169.299 231 154.611 231V239ZM154.611 231C139.924 231 128 242.906 128 257.599H136C136 247.33 144.337 239 154.611 239V231Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'vue',
    path: '/vuejs',
    image: {
      width: 512,
      height: 512,
      transform: 'translate(0 -0.000269232) scale(0.00195312)',
      xlinkHref: '/static/images/new-home/vue-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="210.771" y="339.76" width="45.2229" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M233.382 380.959C223.107 380.959 214.771 372.629 214.771 362.36H206.771C206.771 377.053 218.695 388.959 233.382 388.959V380.959ZM251.994 362.36C251.994 372.629 243.657 380.959 233.382 380.959V388.959C248.07 388.959 259.994 377.053 259.994 362.36H251.994ZM233.382 343.76C243.657 343.76 251.994 352.09 251.994 362.36H259.994C259.994 347.666 248.07 335.76 233.382 335.76V343.76ZM233.382 335.76C218.695 335.76 206.771 347.666 206.771 362.36H214.771C214.771 352.09 223.107 343.76 233.382 343.76V335.76Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'webpack',
    path: '/webpack',
    image: {
      width: 516,
      height: 516,
      transform: 'translate(0 -0.000269063) scale(0.00193798)',
      xlinkHref: '/static/images/new-home/webpack-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="494.221" y="359.938" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M516.832 401.137C506.557 401.137 498.221 392.807 498.221 382.537H490.221C490.221 397.231 502.145 409.137 516.832 409.137V401.137ZM535.444 382.537C535.444 392.807 527.107 401.137 516.832 401.137V409.137C531.52 409.137 543.444 397.231 543.444 382.537H535.444ZM516.832 363.938C527.107 363.938 535.444 372.268 535.444 382.537H543.444C543.444 367.844 531.52 355.938 516.832 355.938V363.938ZM516.832 355.938C502.145 355.938 490.221 367.844 490.221 382.537H498.221C498.221 372.268 506.557 363.938 516.832 363.938V355.938Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'babel',
    path: '/babel',
    image: {
      width: 512,
      height: 512,
      transform: 'translate(0 -0.000269063) scale(0.00195312)',
      xlinkHref: '/static/images/new-home/babel-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="332.711" y="382.537" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M355.322 423.736C345.047 423.736 336.711 415.406 336.711 405.137H328.711C328.711 419.83 340.635 431.736 355.322 431.736V423.736ZM373.934 405.137C373.934 415.406 365.597 423.736 355.322 423.736V431.736C370.01 431.736 381.934 419.83 381.934 405.137H373.934ZM355.322 386.537C365.597 386.537 373.934 394.867 373.934 405.137H381.934C381.934 390.444 370.01 378.537 355.322 378.537V386.537ZM355.322 378.537C340.635 378.537 328.711 390.444 328.711 405.137H336.711C336.711 394.867 345.047 386.537 355.322 386.537V378.537Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'nunheadKnocks',
    path: '/nunhead-knocks',
    image: {
      width: 400,
      height: 400,
      transform: 'translate(0 -0.000269232) scale(0.0025)',
      xlinkHref: '/static/images/new-home/nunhead-knocks-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="573.361" y="9.64978" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M595.972 50.8483C585.697 50.8483 577.361 42.5183 577.361 32.249H569.361C569.361 46.9422 581.285 58.8483 595.972 58.8483V50.8483ZM614.584 32.249C614.584 42.5183 606.247 50.8483 595.972 50.8483V58.8483C610.66 58.8483 622.584 46.9422 622.584 32.249H614.584ZM595.972 13.6498C606.247 13.6498 614.584 21.9798 614.584 32.249H622.584C622.584 17.5559 610.66 5.64978 595.972 5.64978V13.6498ZM595.972 5.64978C581.285 5.64978 569.361 17.5559 569.361 32.249H577.361C577.361 21.9798 585.697 13.6498 595.972 13.6498V5.64978Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'oxfordAid',
    path: '/oxford-mutual-aid',
    image: {
      width: 300,
      height: 190,
      transform: 'translate(-0.28905) scale(0.00526033)',
      xlinkHref: '/static/images/new-home/oxford-aid-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="755.867" y="12.8783" width="45.2228" height="45.1985" rx="22.5993" fill="white" />
        <rect x="755.867" y="12.8783" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
        <path
          d="M778.479 54.0768C768.204 54.0768 759.867 45.7468 759.867 35.4775H751.867C751.867 50.1707 763.791 62.0768 778.479 62.0768V54.0768ZM797.09 35.4775C797.09 45.7468 788.754 54.0768 778.479 54.0768V62.0768C793.166 62.0768 805.09 50.1707 805.09 35.4775H797.09ZM778.479 16.8783C788.754 16.8783 797.09 25.2083 797.09 35.4775H805.09C805.09 20.7844 793.166 8.8783 778.479 8.8783V16.8783ZM778.479 8.8783C763.791 8.8783 751.867 20.7844 751.867 35.4775H759.867C759.867 25.2083 768.204 16.8783 778.479 16.8783V8.8783Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'wordpress',
    path: '/wordpress',
    image: {
      width: 4096,
      height: 4096,
      transform: 'translate(0 -0.000268928) scale(0.000244141)',
      xlinkHref: '/static/images/new-home/wordpress-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="560.44" y="282.455" width="64.604" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
        <path
          d="M592.742 343.024C577.118 343.024 564.44 330.358 564.44 314.74H556.44C556.44 334.782 572.706 351.024 592.742 351.024V343.024ZM621.044 314.74C621.044 330.358 608.366 343.024 592.742 343.024V351.024C612.779 351.024 629.044 334.782 629.044 314.74H621.044ZM592.742 286.455C608.366 286.455 621.044 299.121 621.044 314.74H629.044C629.044 294.697 612.779 278.455 592.742 278.455V286.455ZM592.742 278.455C572.706 278.455 556.44 294.697 556.44 314.74H564.44C564.44 299.121 577.118 286.455 592.742 286.455V278.455Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
  {
    id: 'six',
    path: '#',
    image: {
      width: 366,
      height: 328,
      transform: 'translate(-0.0940322 -0.0371346) scale(0.00317229)',
      xlinkHref: '/static/images/new-home/six-logo.png',
    },
    render: id => (
      <React.Fragment>
        <rect x="715.49" y="240.485" width="64.6041" height="64.5693" rx="32.2847" fill={`url(#${id})`} />
        <path
          d="M747.792 301.054C732.168 301.054 719.49 288.388 719.49 272.77H711.49C711.49 292.812 727.755 309.054 747.792 309.054V301.054ZM776.094 272.77C776.094 288.388 763.416 301.054 747.792 301.054V309.054C767.829 309.054 784.094 292.812 784.094 272.77H776.094ZM747.792 244.485C763.416 244.485 776.094 257.151 776.094 272.77H784.094C784.094 252.727 767.829 236.485 747.792 236.485V244.485ZM747.792 236.485C727.755 236.485 711.49 252.727 711.49 272.77H719.49C719.49 257.151 732.168 244.485 747.792 244.485V236.485Z"
          fill="white"
        />
      </React.Fragment>
    ),
  },
];

const NetworkOfCollectives = () => {
  return (
    <Container maxWidth="100vw" overflowX="auto" position="relative">
      <Box display="inline-block" minWidth="100%">
        <Container display="flex" justifyContent="center" alignItems="center">
          <StyledSvg
            width="877"
            height="465"
            viewBox="0 0 877 431"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <path d="M231.767 359.938L381.164 315.547" stroke="white" strokeWidth="4" />
            <path d="M107.404 49.1985L234.997 61.3052" stroke="white" strokeWidth="4" />
            <path d="M235 61L155 142" stroke="white" strokeWidth="4" />
            <path d="M256 211L153 262" stroke="white" strokeWidth="4" />
            <path d="M485.338 159.773L255.993 211.429" stroke="white" strokeWidth="4" />
            <path d="M488 161L415 32" stroke="white" strokeWidth="4" />
            <path d="M652.501 142.017L778.479 36.2846" stroke="white" strokeWidth="4" />
            <path d="M354.515 405.137L389.239 318.775" stroke="white" strokeWidth="4" />
            <path d="M516.025 378.502L389.239 318.775" stroke="white" strokeWidth="4" />
            <path d="M573.361 285.684L485.338 158.159" stroke="white" strokeWidth="4" />
            <path d="M647.656 116.996L595.972 32.249" stroke="white" strokeWidth="4" />
            <path d="M485.338 161.388L386.817 318.775" stroke="white" strokeWidth="4" />
            <path d="M487.761 159.773L234.997 58.8839" stroke="white" strokeWidth="4" />
            <path d="M487.761 158.159L655.731 138.788" stroke="white" strokeWidth="4" />
            <path d="M485.338 159.773L746.177 271.155" stroke="white" strokeWidth="4" />

            {collectives.map(({ id, path, render, image }) => (
              <React.Fragment key={id}>
                <a href={path} xlinkHref={path}>
                  <g id="logoContainer">{render(id)}</g>
                </a>
                <defs>
                  <pattern id={id} patternContentUnits="objectBoundingBox" width="1" height="1">
                    <image {...image} />
                  </pattern>
                </defs>
              </React.Fragment>
            ))}
          </StyledSvg>
        </Container>
      </Box>
    </Container>
  );
};

export default NetworkOfCollectives;
