import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import NextLink from 'next/link';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Avatar from '../Avatar';
import Currency from '../Currency';
import { Box } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';

const defaultPledgedLogo = '/static/images/default-pledged-logo-card.svg';

const CardHeader = styled(Box)`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 12rem;
`;

const LogoBorder = styled.div`
  height: 50%;
  border-bottom: 1px solid;
  border-color: ${themeGet('colors.black.200')};
`;

const LogoContainer = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`;

const CardBody = styled.div`
  padding: 1rem;
  min-height: 11rem;
  height: 220px;
`;

const CardText = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CollectiveNameText = styled(CardText)`
  min-height: 20px;
  font-size: 14px;
  margin: 5px;
  font-weight: 700;
  text-align: center;
  color: #303233;
  white-space: nowrap;
`;

const CollectiveDescriptionText = styled(CardText)`
  font-weight: bold;
  text-align: center;
  color: #787d80;
  font-size: 1rem;
  line-height: 1.3;
  margin: 5px;
  text-transform: uppercase;
`;

const CollectiveWebsiteText = styled(CardText)`
  font-weight: normal;
  text-align: center;
  color: #0096f9;
  font-size: 1.2rem;
  line-height: 1.3;
  margin: 0px;
`;

const CardFooter = styled.div`
  font-size: 1.1rem;
  width: 100%;
  height: 100%;
  text-align: center;
  border-top: 1px solid;
  border-color: ${themeGet('colors.black.200')};
`;

const StatsContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  justify-content: space-around;
`;

const StatsItemContainer = styled.div`
  height: 100%;
  width: 50%;
`;

const StatsItemContainerWithBorder = styled(StatsItemContainer)`
  border-left: 1px solid;
  border-color: ${themeGet('colors.black.200')};
`;

const StatsItem = styled.div`
  text-align: center;
  margin: auto;
`;

const StatsItemValue = styled(StatsItem)`
  font-weight: bold;
  text-align: center;
  color: #303233;
  font-size: 1rem;
  margin: 12px 2px 0px;
`;

const StatsItemLabel = styled(StatsItem)`
  font-size: 1rem;
  text-align: center;
  font-weight: 300;
  color: #303233;
`;

class PledgedCollectiveCard extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    membership: PropTypes.object,
  };

  render() {
    const { collective } = this.props;

    const pledgeStats = (collective.pledges || []).reduce(
      (stats, { totalAmount }) => {
        stats.backers++;
        stats.totalAmount += totalAmount;
        return stats;
      },
      {
        totalAmount: 0,
        backers: 0,
      },
    );

    let website = collective.website;
    if (!website && collective.githubHandle) {
      website = `https://github.com/${collective.githubHandle}`;
    }

    return (
      <StyledCard height={380} borderRadius={8} bg="#ffffff">
        <CardHeader>
          <LogoBorder />
          <LogoContainer>
            <LinkCollective collective={collective}>
              <Avatar src={defaultPledgedLogo} type={collective.type} radius={70} />
            </LinkCollective>
          </LogoContainer>
        </CardHeader>
        <CardBody>
          <LinkCollective collective={collective}>
            <CollectiveNameText>{collective.name}</CollectiveNameText>
          </LinkCollective>
          <CollectiveDescriptionText>
            <FormattedMessage id="pledgedCollective" defaultMessage="Pledged Collective" />
          </CollectiveDescriptionText>
          <CollectiveWebsiteText className="website">{website}</CollectiveWebsiteText>

          <NextLink href={`${collective.slug}/pledges/new`} passHref>
            <StyledButton mt={4} width={1} buttonStyle="primary" buttonSize="small" minWidth={150}>
              <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
            </StyledButton>
          </NextLink>
        </CardBody>
        <CardFooter>
          {pledgeStats && (
            <StatsContainer>
              <StatsItemContainer>
                <StatsItemValue>
                  <Currency value={pledgeStats.totalAmount} currency={collective.currency} />
                </StatsItemValue>
                <StatsItemLabel>
                  <FormattedMessage id="collective.card.stats.totalAmount" defaultMessage={'total amount'} />
                </StatsItemLabel>
              </StatsItemContainer>
              <StatsItemContainerWithBorder>
                <StatsItemValue>{pledgeStats.backers}</StatsItemValue>
                <StatsItemLabel>
                  <FormattedMessage
                    id="collective.card.stats.backersSoFar"
                    defaultMessage="{n, plural, one {backer so far} other {backers so far}}"
                    values={{ n: pledgeStats.backers }}
                  />
                </StatsItemLabel>
              </StatsItemContainerWithBorder>
            </StatsContainer>
          )}
        </CardFooter>
      </StyledCard>
    );
  }
}

export default PledgedCollectiveCard;
