import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styled from 'styled-components';
import { defineMessages, FormattedMessage, FormattedDate, FormattedTime, injectIntl } from 'react-intl';
import dynamic from 'next/dynamic';
import { Github } from 'styled-icons/fa-brands/Github';
import { Twitter } from 'styled-icons/fa-brands/Twitter';
import { ExternalLinkAlt } from 'styled-icons/fa-solid/ExternalLinkAlt';
import momentTimezone from 'moment-timezone';
import moment from 'moment';
import { get } from 'lodash';
import { withUser } from './UserProvider';
import { prettyUrl, imagePreview } from '../lib/utils';
import Currency from './Currency';
import Avatar from './Avatar';
import Logo from './Logo';
import { defaultBackgroundImage, CollectiveType } from '../lib/constants/collectives';
import Link from './Link';
import UserCompany from './UserCompany';
import CollectiveNavbar from './CollectiveNavbar';
import Container from './Container';
import { AllSectionsNames } from './collective-page/_constants';

// Dynamicly load HTMLEditor to download it only if user can edit the page
const GoalsCover = dynamic(() => import('./GoalsCover'));
const MenuBar = dynamic(() => import('./MenuBar'));
const TopBackersCoverWithData = dynamic(() => import('./TopBackersCoverWithData'));

const ContributeLink = styled(Link)`
  --webkit-appearance: none;
  font-size: 1.4rem;
  font-weight: 500;
  height: 3.6rem;
  border: 2px solid #ffffff;
  border-radius: 500px;
  color: #ffffff;
  background-color: #3385ff;
  padding: 7px 28px;
  :hover {
    border: 2px solid #2e8ae6;
    color: #ffffff;
  }
  :active {
    background-color: #297acc;
    border-color: #297acc;
  }
`;

class CollectiveCover extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      id: PropTypes.number,
      type: PropTypes.string,
      path: PropTypes.string,
      slug: PropTypes.string,
      name: PropTypes.string,
      currency: PropTypes.string,
      backgroundImage: PropTypes.string,
      isHost: PropTypes.bool,
      isActive: PropTypes.bool,
      isArchived: PropTypes.bool,
      startsAt: PropTypes.string,
      endsAt: PropTypes.string,
      timezone: PropTypes.string,
      company: PropTypes.string,
      website: PropTypes.string,
      twitterHandle: PropTypes.string,
      githubHandle: PropTypes.string,
      description: PropTypes.string,
      stats: PropTypes.shape({
        totalAmountSpent: PropTypes.number,
        totalAmountRaised: PropTypes.number,
      }),
      host: PropTypes.shape({
        slug: PropTypes.string,
        name: PropTypes.string,
      }),
      parentCollective: PropTypes.shape({
        slug: PropTypes.string,
        name: PropTypes.string,
      }),
    }).isRequired,
    /** Defines the calls to action displayed next to the NavBar items. Match PropTypes of `CollectiveCallsToAction` */
    callsToAction: PropTypes.shape({
      hasContact: PropTypes.bool,
      hasSubmitExpense: PropTypes.bool,
      hasApply: PropTypes.bool,
      hasDashboard: PropTypes.bool,
    }),
    href: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    style: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
    cta: PropTypes.object, // { href, label }
    displayContributeLink: PropTypes.bool,
    selectedSection: PropTypes.oneOf(AllSectionsNames),
    /** If true, the component will never render the new collective navbar */
    forceLegacy: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      contribute: { id: 'collective.contribute', defaultMessage: 'contribute' },
      apply: {
        id: 'host.apply.btn',
        defaultMessage: 'Apply with {collective}',
      },
      ADMIN: { id: 'roles.admin.label', defaultMessage: 'Collective Admin' },
      MEMBER: { id: 'roles.member.label', defaultMessage: 'Core Contributor' },
    });

    this.description = props.description || props.collective.description;

    if (props.collective.type === 'EVENT') {
      const eventLocationRoute = props.href ? `${props.href}#location` : '#location';
      this.description = (
        <div>
          {props.collective.description && <div className="eventDescription">{props.collective.description}</div>}
          <Link route={eventLocationRoute}>
            {!props.collective.startsAt &&
              console.warn(
                `Event: props.collective.startsAt should not be empty. props.collective.id: ${props.collective.id}`,
              )}
            {props.collective.startsAt && (
              <React.Fragment>
                <FormattedDate
                  value={props.collective.startsAt}
                  timeZone={props.collective.timezone}
                  weekday="short"
                  day="numeric"
                  month="long"
                />
                , &nbsp;
                <FormattedTime value={props.collective.startsAt} timeZone={props.collective.timezone} />
                &nbsp; - &nbsp;
              </React.Fragment>
            )}
            {props.collective.endsAt && (
              <React.Fragment>
                <FormattedDate
                  value={props.collective.endsAt}
                  timeZone={props.collective.timezone}
                  weekday="short"
                  day="numeric"
                  month="long"
                  year="numeric"
                />
                , &nbsp;
                <FormattedTime value={props.collective.endsAt} timeZone={props.collective.timezone} />
                &nbsp;{' '}
                {moment()
                  .tz(props.collective.timezone)
                  .zoneAbbr()}{' '}
                (<FormattedMessage id="EventCover.EventTime" defaultMessage="Event Time" />)
              </React.Fragment>
            )}
            <br />
            {this.checkTimeDiff() && (
              <em>
                {props.collective.startsAt && (
                  <React.Fragment>
                    <FormattedDate
                      value={props.collective.startsAt}
                      timeZone={momentTimezone.tz.guess()}
                      weekday="short"
                      day="numeric"
                      month="long"
                    />
                    , &nbsp;
                    <FormattedTime value={props.collective.startsAt} timeZone={momentTimezone.tz.guess()} />
                    &nbsp; - &nbsp;
                  </React.Fragment>
                )}

                {props.collective.endsAt && (
                  <React.Fragment>
                    <FormattedDate
                      value={props.collective.endsAt}
                      timeZone={momentTimezone.tz.guess()}
                      weekday="short"
                      day="numeric"
                      month="long"
                      year="numeric"
                    />
                    , &nbsp;
                    <FormattedTime value={props.collective.endsAt} timeZone={momentTimezone.tz.guess()} />
                    &nbsp;{' '}
                    {moment()
                      .tz(momentTimezone.tz.guess())
                      .zoneAbbr()}{' '}
                    (<FormattedMessage id="EventCover.LocalTime" defaultMessage="Your Time" />)
                  </React.Fragment>
                )}
                <br />
              </em>
            )}
            {get(props.collective, 'location.name') && (
              <FormattedMessage
                id="EventCover.Location"
                defaultMessage="Location: {location}"
                values={{ location: get(props.collective, 'location.name') }}
              />
            )}
          </Link>
        </div>
      );
    }
  }

  getMemberTooltip(member) {
    const { intl } = this.props;
    let tooltip = member.member.name;
    if (this.messages[member.role]) {
      tooltip += `
${this.messages[member.role] ? intl.formatMessage(this.messages[member.role]) : member.role}`;
    }
    const description = member.description || member.member.description;
    if (description) {
      tooltip += `
${description}`;
    }
    return tooltip;
  }

  checkTimeDiff() {
    if (this.props.collective.timezone) {
      const eventTimezone = moment()
        .tz(this.props.collective.timezone)
        .format('Z');
      const browserTimezone = moment()
        .tz(momentTimezone.tz.guess())
        .format('Z');
      return eventTimezone !== browserTimezone;
    }
  }

  render() {
    const { collective, className, LoggedInUser, intl, forceLegacy } = this.props;
    const { company, type, website, twitterHandle, githubHandle, stats } = collective;
    const canEdit = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const ncpIsDefault = process.env.NCP_IS_DEFAULT === 'true';
    const collectiveHasV2 = get(collective, 'settings.collectivePage.useV2');
    const useNewCollectiveNavbar = !forceLegacy && (ncpIsDefault || collectiveHasV2);
    const isEvent = type === CollectiveType.EVENT;

    if (!isEvent && useNewCollectiveNavbar && collective && collective.slug) {
      return (
        <Container mb={4}>
          <CollectiveNavbar
            collective={collective}
            isAdmin={canEdit}
            showEdit
            callsToAction={this.props.callsToAction}
            selected={this.props.selectedSection}
          />
        </Container>
      );
    }

    const href = this.props.href || collective.path || `/${collective.slug}`;
    const title = this.props.title || collective.name;
    const backgroundImage = imagePreview(
      collective.backgroundImage || get(collective, 'parentCollective.backgroundImage'),
      defaultBackgroundImage[collective.type],
      { height: 500 },
    );
    const style = {
      backgroundImage: `url('${backgroundImage}')`,
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
    };

    let cta;
    if (this.props.cta) {
      if (this.props.cta.href) {
        const label = this.props.cta.label;
        cta = (
          <ContributeLink href={this.props.cta.href}>
            {this.messages[label] ? intl.formatMessage(this.messages[label]) : label}
          </ContributeLink>
        );
      } else {
        cta = this.props.cta;
      }
    } else if (this.props.displayContributeLink) {
      cta = (
        <ContributeLink href={`/${collective.slug}/contribute`}>
          {intl.formatMessage(this.messages['contribute'])}
        </ContributeLink>
      );
    }

    const showGoalsCover =
      get(collective, 'stats.balance') > 0 ||
      get(collective, 'stats.yearlyBudget') > 0 ||
      get(collective, 'settings.goals[0].title');

    return (
      <div
        className={classNames('CollectiveCover', className, type, {
          defaultBackgroundImage: !collective.backgroundImage ? true : false,
          archiveCollective: collective.isArchived,
        })}
      >
        <style jsx>
          {`
            .cover {
              align-items: center;
              position: relative;
              text-align: center;
              min-height: 30rem;
              width: 100%;
              overflow: hidden;
            }
            .small .cover {
              height: auto;
              min-height: 22rem;
            }
            .backgroundCover {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 0;
            }
            .host label {
              font-weight: 300;
              margin-right: 5px;
              opacity: 0.75;
            }
            .content {
              z-index: 1;
              position: relative;
              display: flex;
              flex-direction: column;
              justify-content: space-around;
              align-items: center;
              color: black;
              margin-top: 70px;
            }
            .small .content {
              margin-top: 0px;
            }
            .content,
            .content a {
              color: white;
              text-shadow: 1px 0 1px rgba(0, 0, 0, 0.8), 0 -1px 1px rgba(0, 0, 0, 0.8), 0 1px 1px rgba(0, 0, 0, 0.8),
                -1px 0 1px rgba(0, 0, 0, 0.8);
            }
            .defaultBackgroundImage .content,
            .defaultBackgroundImage .content a {
              text-shadow: none;
            }
            .content a:hover {
              color: #444;
              text-decoration: underline !important;
            }
            .content a:hover {
              color: #444;
              text-decoration: underline !important;
            }
            .USER .cover {
              display: block;
            }
            .COLLECTIVE .content {
              margin-top: 0px;
            }
            .logo {
              max-width: 20rem;
              max-height: 10rem;
              margin: 2rem auto;
              display: block;
            }
            .USER .logo {
              border: 3px solid #fff;
              box-shadow: 0 0 0 2px #75cc1f;
              border-radius: 50%;
              margin: 3rem auto;
            }
            .USER.small .logo {
              margin: 2rem auto;
            }
            h1 {
              font-size: 3rem;
              margin: 1.5rem;
            }
            .contact {
              display: flex;
              flex-direction: row;
              justify-content: center;
              flex-wrap: wrap;
            }
            .contact div {
              margin: 1rem;
            }
            .members {
              display: flex;
              justify-content: center;
              margin: 2rem 0;
            }
            .members a {
              margin: 0.3rem;
            }
            .avatar {
              float: left;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              margin: 0 0.5rem;
              background-repeat: no-repeat;
              background-position: center center;
              background-size: cover;
              border: 2px solid #fff;
              box-shadow: 0 0 0 1px #75cc1f;
            }
            .MoreBackers {
              font-size: 2rem;
              line-height: 36px;
              margin-left: 1rem;
            }
            .statsContainer {
              position: relative;
              margin-top: 3rem;
              padding: 3rem 1rem;
              z-index: 1;
              font-size: 1.3rem;
              display: flex;
              flex-direction: column;
              justify-content: center;
              color: white;
            }
            .statsContainer.goals {
              background-color: #252729;
            }
            .topContributors {
              margin-top: -6rem;
              min-height: 30px;
            }
            .statsContainer .value {
              font-size: 3rem;
            }
            .stat {
              margin: 1rem;
            }
            .counter {
              margin: 1rem 0px;
            }
            .counter .-character {
              font-size: 22px;
              font-weight: bold;
              margin: 1px;
            }
            .counter .-digit {
              display: inline-block;
              width: 20px;
              height: 28px;
              border-radius: 3px;
              background-color: rgba(0, 0, 0, 0.6);
              border: solid 1px #000000;
              font-size: 22px;
              color: #ffffff;
              font-weight: bold;
              line-height: 1.25;
              margin: 1px;
            }
            .USER .cta,
            .ORGANIZATION .cta {
              margin: 4rem 0;
            }
            @media (max-width: 600px) {
              h1 {
                font-size: 2.5rem;
              }
            }
            .small .contact,
            .small .stats,
            .small .statsContainer,
            .small .members {
              display: none;
            }
            .archiveCollective {
              -webkit-filter: grayscale(100%);
              -moz-filter: grayscale(100%);
              -ms-filter: grayscale(100%);
              filter: grayscale(100%);
            }
            .cta {
              margin-top: 20px;
            }
          `}
        </style>
        <style jsx global>
          {`
            .CollectiveCover .content a {
              color: white;
            }
          `}
        </style>
        <div className={`cover ${collective.type}`}>
          <div className="backgroundCover" style={style} />

          <div className="content">
            {collective.slug && (
              <Link route={href} className="goBack">
                {collective.type === 'USER' ? (
                  <Avatar collective={collective} className="logo" radius="10rem" />
                ) : (
                  <Logo collective={collective} className="logo" height="10rem" />
                )}
              </Link>
            )}
            <h1>{title}</h1>
            {this.description && <div className="description">{this.description}</div>}
            {className !== 'small' && (
              <div>
                {company && (
                  <p className="company">
                    <UserCompany company={company} />
                  </p>
                )}
                {collective.type !== 'EVENT' && (
                  <div className="contact">
                    {collective.host && collective.isActive && (
                      <div className="host">
                        <label>
                          <FormattedMessage
                            id="collective.cover.hostedBy"
                            defaultMessage="Hosted by {host}"
                            values={{
                              host: <Link route={`/${collective.host.slug}`}>{collective.host.name}</Link>,
                            }}
                          />
                        </label>
                      </div>
                    )}
                    {collective.host && !collective.isActive && canEdit && (
                      <div className="host">
                        <label>
                          <FormattedMessage
                            id="collective.cover.pendingApprovalFrom"
                            defaultMessage="Pending approval from {host}"
                            values={{
                              host: <Link route={`/${collective.host.slug}`}>{collective.host.name}</Link>,
                            }}
                          />
                        </label>
                      </div>
                    )}
                    {twitterHandle && (
                      <div className="twitterHandle">
                        <a href={`https://twitter.com/${twitterHandle}`} target="_blank" rel="noopener noreferrer">
                          <Twitter size="1em" /> @{twitterHandle}
                        </a>
                      </div>
                    )}
                    {githubHandle && (
                      <div className="githubHandle">
                        <a href={`https://github.com/${githubHandle}`} target="_blank" rel="noopener noreferrer">
                          <Github size="1em" /> {githubHandle}
                        </a>
                      </div>
                    )}
                    {website && (
                      <div className="website">
                        <a href={website} target="_blank" rel="noopener noreferrer">
                          <ExternalLinkAlt size="1em" /> {prettyUrl(website)}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {collective.type === 'EVENT' && (
                  <div className="contact">
                    <div className="parentCollective">
                      <FormattedMessage
                        id="Event.CreatedBy"
                        defaultMessage="Created by: {CollectiveLink}"
                        values={{
                          CollectiveLink: (
                            <Link route={`/${collective.parentCollective.slug}`}>
                              {collective.parentCollective.name}
                            </Link>
                          ),
                        }}
                      />
                    </div>
                  </div>
                )}
                {collective.type !== 'COLLECTIVE' && cta && <div className="cta">{cta}</div>}
              </div>
            )}
          </div>

          {['USER', 'ORGANIZATION'].includes(collective.type) &&
            stats &&
            stats.totalAmountSpent > 0 &&
            !collective.isHost && (
              <div className="statsContainer">
                <div className="stat">
                  <div className="totalAmountSpent value">
                    <Currency value={stats.totalAmountSpent} currency={collective.currency} />
                  </div>
                  <FormattedMessage
                    id="collective.stats.totalAmountSpent.label"
                    defaultMessage="Total amount contributed"
                  />
                </div>
                {stats.totalAmountRaised > 0 && (
                  <div className="stat">
                    <div className="totalAmountRaised value">
                      <Currency value={stats.totalAmountRaised} currency={collective.currency} />
                    </div>
                    <FormattedMessage
                      id="collective.stats.totalAmountRaised.label"
                      defaultMessage="Total amount raised"
                    />
                  </div>
                )}
              </div>
            )}

          {collective.type === 'COLLECTIVE' && collective.isActive && collective.host && (
            <div className={`statsContainer ${showGoalsCover ? 'goals' : ''}`}>
              {className !== 'small' && collective.type === 'COLLECTIVE' && (
                <div className="topContributors">
                  <TopBackersCoverWithData collective={this.props.collective} LoggedInUser={LoggedInUser} limit={10} />
                </div>
              )}

              {className !== 'small' && collective.type === 'COLLECTIVE' && showGoalsCover && (
                <GoalsCover collective={collective} LoggedInUser={LoggedInUser} />
              )}

              {cta && <div className="cta">{cta}</div>}
            </div>
          )}
        </div>

        {className !== 'small' && <MenuBar collective={collective} cta={cta} />}
      </div>
    );
  }
}

export default injectIntl(withUser(CollectiveCover));
