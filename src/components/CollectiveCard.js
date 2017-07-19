import { FormattedMessage, FormattedDate } from 'react-intl';

export default ({ user, type }) => (
  <a href={`/${user.username}`}>
    <div className={`CollectiveCard ${type}`}>
      <style jsx>{`

      `}</style>
      <img src={user.avatar} />
      <p className='name'>{user.name}</p>
      <div className='tier border-top border-gray px3 py2'>
        <p className='name'>{user.tier.name}</p>
        <p className='since'>
          <FormattedMessage id='CollectiveCard.since' defaultMessage={`since`} />&nbsp;
          <FormattedDate value={user.createdAt} month='long' year='numeric' />
        </p>
      </div>
    </div>
  </a>
);