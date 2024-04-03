import React from 'react';
import styled from 'styled-components';

import Container from '../Container';
import { Box, boxProps } from '../Grid';

const StyledSvg = styled(Box).withConfig({
  shouldForwardProp: (prop, defaultFilter) => !boxProps.propNames.includes(prop) && defaultFilter(prop),
})`
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

  .visible-sm {
    display: none;

    @media screen and (min-width: 40em) {
      display: inline;
    }
  }

  .visible-xs {
    @media screen and (min-width: 40em) {
      display: none;
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
    render: id => (
      <React.Fragment>
        <g className="visible-sm">
          <rect x="443" y="134" width="102" height="102" rx="51" fill="white" />
          <rect x="443" y="134" width="102" height="102" rx="51" fill={`url(#${id})`} />
          <path
            d="M494 232C468.043 232 447 210.957 447 185H439C439 215.376 463.624 240 494 240V232ZM541 185C541 210.957 519.957 232 494 232V240C524.376 240 549 215.376 549 185H541ZM494 138C519.957 138 541 159.043 541 185H549C549 154.624 524.376 130 494 130V138ZM494 130C463.624 130 439 154.624 439 185H447C447 159.043 468.043 138 494 138V130Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="154" y="174" width="99" height="99" rx="49.5" fill="white" />
          <rect x="154" y="174" width="99" height="99" rx="49.5" fill={`url(#${id})`} />
          <path
            d="M203.5 269C178.371 269 158 248.629 158 223.5H150C150 253.047 173.953 277 203.5 277V269ZM249 223.5C249 248.629 228.629 269 203.5 269V277C233.047 277 257 253.047 257 223.5H249ZM203.5 178C228.629 178 249 198.371 249 223.5H257C257 193.953 233.047 170 203.5 170V178ZM203.5 170C173.953 170 150 193.953 150 223.5H158C158 198.371 178.371 178 203.5 178V170Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="360.515" y="305.034" width="64.6041" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
          <path
            d="M392.817 365.603C377.193 365.603 364.515 352.937 364.515 337.318H356.515C356.515 357.361 372.78 373.603 392.817 373.603V365.603ZM421.119 337.318C421.119 352.937 408.441 365.603 392.817 365.603V373.603C412.853 373.603 429.119 357.361 429.119 337.318H421.119ZM392.817 309.034C408.441 309.034 421.119 321.7 421.119 337.318H429.119C429.119 317.276 412.853 301.034 392.817 301.034V309.034ZM392.817 301.034C372.78 301.034 356.515 317.276 356.515 337.318H364.515C364.515 321.7 377.193 309.034 392.817 309.034V301.034Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="126" y="509" width="62" height="62" rx="31" fill={`url(#${id})`} />
          <path
            d="M157 567C142.088 567 130 554.912 130 540H122C122 559.33 137.67 575 157 575V567ZM184 540C184 554.912 171.912 567 157 567V575C176.33 575 192 559.33 192 540H184ZM157 513C171.912 513 184 525.088 184 540H192C192 520.67 176.33 505 157 505V513ZM157 505C137.67 505 122 520.67 122 540H130C130 525.088 142.088 513 157 513V505Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="626.199" y="129.89" width="64.604" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
          <path
            d="M658.501 190.459C642.877 190.459 630.199 177.793 630.199 162.174H622.199C622.199 182.216 638.464 198.459 658.501 198.459V190.459ZM686.803 162.174C686.803 177.793 674.125 190.459 658.501 190.459V198.459C678.538 198.459 694.803 182.216 694.803 162.174H686.803ZM658.501 133.89C674.125 133.89 686.803 146.556 686.803 162.174H694.803C694.803 142.132 678.538 125.89 658.501 125.89V133.89ZM658.501 125.89C638.464 125.89 622.199 142.132 622.199 162.174H630.199C630.199 146.556 642.877 133.89 658.501 133.89V125.89Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="226" y="89" width="62" height="62" rx="31" fill={`url(#${id})`} />
          <path
            d="M257 147C242.088 147 230 134.912 230 120H222C222 139.33 237.67 155 257 155V147ZM284 120C284 134.912 271.912 147 257 147V155C276.33 155 292 139.33 292 120H284ZM257 93C271.912 93 284 105.088 284 120H292C292 100.67 276.33 85 257 85V93ZM257 85C237.67 85 222 100.67 222 120H230C230 105.088 242.088 93 257 93V85Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="396" y="29" width="64.6041" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
          <path
            d="M428.302 89.5693C412.678 89.5693 400 76.903 400 61.2846H392C392 81.3269 408.265 97.5693 428.302 97.5693V89.5693ZM456.604 61.2846C456.604 76.903 443.926 89.5693 428.302 89.5693V97.5693C448.339 97.5693 464.604 81.3269 464.604 61.2846H456.604ZM428.302 33C443.926 33 456.604 45.6663 456.604 61.2846H464.604C464.604 41.2424 448.339 25 428.302 25V33ZM428.302 25C408.265 25 392 41.2424 392 61.2846H400C400 45.6663 412.678 33 428.302 33V25Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="53" y="89" width="62" height="62" rx="31" fill={`url(#${id})`} />
          <path
            d="M84 147C69.0883 147 57 134.912 57 120H49C49 139.33 64.67 155 84 155V147ZM111 120C111 134.912 98.9117 147 84 147V155C103.33 155 119 139.33 119 120H111ZM84 93C98.9117 93 111 105.088 111 120H119C119 100.67 103.33 85 84 85V93ZM84 85C64.67 85 49 100.67 49 120H57C57 105.088 69.0883 93 84 93V85Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="229.692" y="204.144" width="64.604" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
          <path
            d="M261.994 264.713C246.37 264.713 233.692 252.047 233.692 236.429H225.692C225.692 256.471 241.957 272.713 261.994 272.713V264.713ZM290.296 236.429C290.296 252.047 277.618 264.713 261.994 264.713V272.713C282.03 272.713 298.296 256.471 298.296 236.429H290.296ZM261.994 208.144C277.618 208.144 290.296 220.81 290.296 236.429H298.296C298.296 216.387 282.03 200.144 261.994 200.144V208.144ZM261.994 200.144C241.957 200.144 225.692 216.387 225.692 236.429H233.692C233.692 220.81 246.37 208.144 261.994 208.144V200.144Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="85" y="402" width="62" height="62" rx="31" fill={`url(#${id})`} />
          <path
            d="M116 460C101.088 460 89 447.912 89 433H81C81 452.33 96.67 468 116 468V460ZM143 433C143 447.912 130.912 460 116 460V468C135.33 468 151 452.33 151 433H143ZM116 406C130.912 406 143 418.088 143 433H151C151 413.67 135.33 398 116 398V406ZM116 398C96.67 398 81 413.67 81 433H89C89 418.088 101.088 406 116 406V398Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="138" y="260" width="45.2228" height="45.1985" rx="22.5993" fill="white" />
          <rect x="138" y="260" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
          <path
            d="M160.611 301.199C150.337 301.199 142 292.869 142 282.599H134C134 297.292 145.924 309.199 160.611 309.199V301.199ZM179.223 282.599C179.223 292.869 170.886 301.199 160.611 301.199V309.199C175.299 309.199 187.223 297.292 187.223 282.599H179.223ZM160.611 264C170.886 264 179.223 272.33 179.223 282.599H187.223C187.223 267.906 175.299 256 160.611 256V264ZM160.611 256C145.924 256 134 267.906 134 282.599H142C142 272.33 150.337 264 160.611 264V256Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="44" y="504" width="44" height="43" rx="21.5" fill="white" />
          <rect x="44" y="504" width="44" height="43" rx="21.5" fill={`url(#${id})`} />
          <path
            d="M65.5 508H66.5V500H65.5V508ZM66.5 543H65.5V551H66.5V543ZM65.5 543C55.835 543 48 535.165 48 525.5H40C40 539.583 51.4167 551 65.5 551V543ZM84 525.5C84 535.165 76.165 543 66.5 543V551C80.5833 551 92 539.583 92 525.5H84ZM66.5 508C76.165 508 84 515.835 84 525.5H92C92 511.417 80.5833 500 66.5 500V508ZM65.5 500C51.4167 500 40 511.417 40 525.5H48C48 515.835 55.835 508 65.5 508V500Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="216.771" y="364.76" width="45.2229" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
          <path
            d="M239.382 405.959C229.107 405.959 220.771 397.629 220.771 387.36H212.771C212.771 402.053 224.695 413.959 239.382 413.959V405.959ZM257.994 387.36C257.994 397.629 249.657 405.959 239.382 405.959V413.959C254.07 413.959 265.994 402.053 265.994 387.36H257.994ZM239.382 368.76C249.657 368.76 257.994 377.09 257.994 387.36H265.994C265.994 372.666 254.07 360.76 239.382 360.76V368.76ZM239.382 360.76C224.695 360.76 212.771 372.666 212.771 387.36H220.771C220.771 377.09 229.107 368.76 239.382 368.76V360.76Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="53" y="615" width="44" height="43" rx="21.5" fill={`url(#${id})`} />
          <path
            d="M74.5 619H75.5V611H74.5V619ZM75.5 654H74.5V662H75.5V654ZM74.5 654C64.835 654 57 646.165 57 636.5H49C49 650.583 60.4167 662 74.5 662V654ZM93 636.5C93 646.165 85.165 654 75.5 654V662C89.5833 662 101 650.583 101 636.5H93ZM75.5 619C85.165 619 93 626.835 93 636.5H101C101 622.417 89.5833 611 75.5 611V619ZM74.5 611C60.4167 611 49 622.417 49 636.5H57C57 626.835 64.835 619 74.5 619V611Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="500.221" y="384.938" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
          <path
            d="M522.832 426.137C512.557 426.137 504.221 417.807 504.221 407.537H496.221C496.221 422.231 508.145 434.137 522.832 434.137V426.137ZM541.444 407.537C541.444 417.807 533.107 426.137 522.832 426.137V434.137C537.52 434.137 549.444 422.231 549.444 407.537H541.444ZM522.832 388.938C533.107 388.938 541.444 397.268 541.444 407.537H549.444C549.444 392.844 537.52 380.938 522.832 380.938V388.938ZM522.832 380.938C508.145 380.938 496.221 392.844 496.221 407.537H504.221C504.221 397.268 512.557 388.938 522.832 388.938V380.938Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="208" y="587" width="44" height="44" rx="22" fill={`url(#${id})`} />
          <path
            d="M230 627C220.059 627 212 618.941 212 609H204C204 623.359 215.641 635 230 635V627ZM248 609C248 618.941 239.941 627 230 627V635C244.359 635 256 623.359 256 609H248ZM230 591C239.941 591 248 599.059 248 609H256C256 594.641 244.359 583 230 583V591ZM230 583C215.641 583 204 594.641 204 609H212C212 599.059 220.059 591 230 591V583Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="338.711" y="407.537" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
          <path
            d="M361.322 448.736C351.047 448.736 342.711 440.406 342.711 430.137H334.711C334.711 444.83 346.635 456.736 361.322 456.736V448.736ZM379.934 430.137C379.934 440.406 371.597 448.736 361.322 448.736V456.736C376.01 456.736 387.934 444.83 387.934 430.137H379.934ZM361.322 411.537C371.597 411.537 379.934 419.867 379.934 430.137H387.934C387.934 415.444 376.01 403.537 361.322 403.537V411.537ZM361.322 403.537C346.635 403.537 334.711 415.444 334.711 430.137H342.711C342.711 419.867 351.047 411.537 361.322 411.537V403.537Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="143" y="631" width="43" height="43" rx="21.5" fill={`url(#${id})`} />
          <path
            d="M164.5 670C154.835 670 147 662.165 147 652.5H139C139 666.583 150.417 678 164.5 678V670ZM182 652.5C182 662.165 174.165 670 164.5 670V678C178.583 678 190 666.583 190 652.5H182ZM164.5 635C174.165 635 182 642.835 182 652.5H190C190 638.417 178.583 627 164.5 627V635ZM164.5 627C150.417 627 139 638.417 139 652.5H147C147 642.835 154.835 635 164.5 635V627Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="579.361" y="34.6498" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
          <path
            d="M601.972 75.8483C591.697 75.8483 583.361 67.5183 583.361 57.249H575.361C575.361 71.9422 587.285 83.8483 601.972 83.8483V75.8483ZM620.584 57.249C620.584 67.5183 612.247 75.8483 601.972 75.8483V83.8483C616.66 83.8483 628.584 71.9422 628.584 57.249H620.584ZM601.972 38.6498C612.247 38.6498 620.584 46.9798 620.584 57.249H628.584C628.584 42.5559 616.66 30.6498 601.972 30.6498V38.6498ZM601.972 30.6498C587.285 30.6498 575.361 42.5559 575.361 57.249H583.361C583.361 46.9798 591.697 38.6498 601.972 38.6498V30.6498Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="148" y="51" width="43" height="44" rx="21.5" fill={`url(#${id})`} />
          <path
            d="M187 72.5V73.5H195V72.5H187ZM152 73.5V72.5H144V73.5H152ZM169.5 91C159.835 91 152 83.165 152 73.5H144C144 87.5833 155.417 99 169.5 99V91ZM187 73.5C187 83.165 179.165 91 169.5 91V99C183.583 99 195 87.5833 195 73.5H187ZM169.5 55C179.165 55 187 62.835 187 72.5H195C195 58.4167 183.583 47 169.5 47V55ZM169.5 47C155.417 47 144 58.4167 144 72.5H152C152 62.835 159.835 55 169.5 55V47Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="761.867" y="37.8783" width="45.2228" height="45.1985" rx="22.5993" fill="white" />
          <rect x="761.867" y="37.8783" width="45.2228" height="45.1985" rx="22.5993" fill={`url(#${id})`} />
          <path
            d="M784.479 79.0768C774.204 79.0768 765.867 70.7468 765.867 60.4775H757.867C757.867 75.1707 769.791 87.0768 784.479 87.0768V79.0768ZM803.09 60.4775C803.09 70.7468 794.754 79.0768 784.479 79.0768V87.0768C799.166 87.0768 811.09 75.1707 811.09 60.4775H803.09ZM784.479 41.8783C794.754 41.8783 803.09 50.2083 803.09 60.4775H811.09C811.09 45.7844 799.166 33.8783 784.479 33.8783V41.8783ZM784.479 33.8783C769.791 33.8783 757.867 45.7844 757.867 60.4775H765.867C765.867 50.2083 774.204 41.8783 784.479 41.8783V33.8783Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="230" y="4" width="43" height="43" rx="21.5" fill="white" />
          <rect x="230" y="4" width="43" height="43" rx="21.5" fill={`url(#${id})`} />
          <path
            d="M251.5 43C241.835 43 234 35.165 234 25.5H226C226 39.5833 237.417 51 251.5 51V43ZM269 25.5C269 35.165 261.165 43 251.5 43V51C265.583 51 277 39.5833 277 25.5H269ZM251.5 8C261.165 8 269 15.835 269 25.5H277C277 11.4167 265.583 0 251.5 0V8ZM251.5 0C237.417 0 226 11.4167 226 25.5H234C234 15.835 241.835 8 251.5 8V0Z"
            fill="white"
          />
        </g>
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
        <g className="visible-sm">
          <rect x="566.44" y="307.455" width="64.604" height="64.5693" rx="32.2846" fill={`url(#${id})`} />
          <path
            d="M598.742 368.024C583.118 368.024 570.44 355.358 570.44 339.74H562.44C562.44 359.782 578.706 376.024 598.742 376.024V368.024ZM627.044 339.74C627.044 355.358 614.366 368.024 598.742 368.024V376.024C618.779 376.024 635.044 359.782 635.044 339.74H627.044ZM598.742 311.455C614.366 311.455 627.044 324.121 627.044 339.74H635.044C635.044 319.697 618.779 303.455 598.742 303.455V311.455ZM598.742 303.455C578.706 303.455 562.44 319.697 562.44 339.74H570.44C570.44 324.121 583.118 311.455 598.742 311.455V303.455Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="213" y="470" width="62" height="63" rx="31" fill={`url(#${id})`} />
          <path
            d="M271 501V502H279V501H271ZM217 502V501H209V502H217ZM244 529C229.088 529 217 516.912 217 502H209C209 521.33 224.67 537 244 537V529ZM271 502C271 516.912 258.912 529 244 529V537C263.33 537 279 521.33 279 502H271ZM244 474C258.912 474 271 486.088 271 501H279C279 481.67 263.33 466 244 466V474ZM244 466C224.67 466 209 481.67 209 501H217C217 486.088 229.088 474 244 474V466Z"
            fill="white"
          />
        </g>
      </React.Fragment>
    ),
  },
  {
    id: 'oce',
    path: '/europe',
    image: {
      width: 366,
      height: 328,
      transform: 'translate(-0.0940322 -0.0371346) scale(0.00317229)',
      xlinkHref: '/static/images/new-home/oce-logo.png',
    },
    render: id => (
      <React.Fragment>
        <g className="visible-sm">
          <rect x="721.49" y="265.485" width="64.6041" height="64.5693" rx="32.2847" fill={`url(#${id})`} />
          <path
            d="M753.792 326.054C738.168 326.054 725.49 313.388 725.49 297.77H717.49C717.49 317.812 733.755 334.054 753.792 334.054V326.054ZM782.094 297.77C782.094 313.388 769.416 326.054 753.792 326.054V334.054C773.829 334.054 790.094 317.812 790.094 297.77H782.094ZM753.792 269.485C769.416 269.485 782.094 282.151 782.094 297.77H790.094C790.094 277.727 773.829 261.485 753.792 261.485V269.485ZM753.792 261.485C733.755 261.485 717.49 277.727 717.49 297.77H725.49C725.49 282.151 738.168 269.485 753.792 269.485V261.485Z"
            fill="white"
          />
        </g>
        <g className="visible-xs">
          <rect x="235" y="301" width="62" height="62" rx="31" fill={`url(#${id})`} />
          <path
            d="M266 359C251.088 359 239 346.912 239 332H231C231 351.33 246.67 367 266 367V359ZM293 332C293 346.912 280.912 359 266 359V367C285.33 367 301 351.33 301 332H293ZM266 305C280.912 305 293 317.088 293 332H301C301 312.67 285.33 297 266 297V305ZM266 297C246.67 297 231 312.67 231 332H239C239 317.088 251.088 305 266 305V297Z"
            fill="white"
          />
        </g>
      </React.Fragment>
    ),
  },
];

const NetworkOfCollectives = () => {
  return (
    <Container maxWidth="100vw" overflowX="hidden" position="relative">
      <Box display="inline-block" minWidth="100%">
        <Container
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="relative"
          left={[0, '-50px', 0]}
        >
          <StyledSvg
            as="svg"
            width={['320px', '890px']}
            height={['724px', '489px']}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            role="img"
          >
            <title>Network of Collectives</title>

            <g className="visible-sm">
              <path d="M237.767 384.938L387.164 340.547" stroke="white" strokeWidth="4" />
              <path d="M262 236L159 287" stroke="white" strokeWidth="4" />
              <path d="M491.338 184.773L261.993 236.429" stroke="white" strokeWidth="4" />
              <path d="M494 186L421 57" stroke="white" strokeWidth="4" />
              <path d="M658.501 167.017L784.479 61.2846" stroke="white" strokeWidth="4" />
              <path d="M360.515 430.137L395.239 343.775" stroke="white" strokeWidth="4" />
              <path d="M522.025 403.502L395.239 343.775" stroke="white" strokeWidth="4" />
              <path d="M579.361 310.684L491.338 183.159" stroke="white" strokeWidth="4" />
              <path d="M653.656 141.996L601.972 57.249" stroke="white" strokeWidth="4" />
              <path d="M491.338 186.388L392.817 343.775" stroke="white" strokeWidth="4" />
              <path d="M493.761 183.159L661.731 163.788" stroke="white" strokeWidth="4" />
              <path d="M491.338 184.773L752.177 296.155" stroke="white" strokeWidth="4" />
            </g>

            <g className="visible-xs">
              <path d="M81 637L148 549" stroke="white" strokeWidth="4" />
              <path d="M44 301L85 240" stroke="white" strokeWidth="4" />
              <path d="M81 240L94 352" stroke="white" strokeWidth="4" />
              <path d="M113 427L66 526" stroke="white" strokeWidth="4" />
              <path d="M201 225L116 433" stroke="white" strokeWidth="4" />
              <path d="M201 223L85 240" stroke="white" strokeWidth="4" />
              <path d="M203 224L85 120" stroke="white" strokeWidth="4" />
              <path d="M253 127L254 26" stroke="white" strokeWidth="4" />
              <path d="M165 653L156 552" stroke="white" strokeWidth="4" />
              <path d="M230 609L172 552" stroke="white" strokeWidth="4" />
              <path d="M237 468L201 222" stroke="white" strokeWidth="4" />
              <path d="M257 120L170 73" stroke="white" strokeWidth="4" />
              <path d="M201 225L160 547" stroke="white" strokeWidth="4" />
              <path d="M203 222L257 120" stroke="white" strokeWidth="4" />
              <path d="M201 223L273 337" stroke="white" strokeWidth="4" />
            </g>

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
