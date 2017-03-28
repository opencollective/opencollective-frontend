import { FormattedMessage, FormattedDate } from 'react-intl';

export default ({ user, type }) => (
  <a href={`/${user.username}`}>
    <div className={`UserCard ${type}`}>
      <style jsx>{`
        .UserCard {
          display: inline-block;
          cursor: pointer;
          width: 12rem;
          border-radius: 5px;
          box-shadow: 0 1px 3px rgba(46, 77, 97,.2);
          text-align: center;
          padding-top: 2rem;
          margin: 1rem;
          background: white;
        }
        .UserCard:hover {
          box-shadow: 0 1px 5px rgba(46, 77, 97,.4);
        }
        .UserCard.sponsor {
          width: 17.5rem;
        }
        img {
          max-width: 15rem;
          max-height: 5rem;
        }
        .tier {
          padding: 1rem 0.5rem;
          margin: 0;
          min-height: 27px;
          border-top: 1px solid #dde1e4;
          overflow: hidden;
        }
        .name {
          color: #7fadf2;
        }
        .tier .name {
          font-weight: 700;
          text-transform: uppercase;
          color: #75cc1f;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 0.6875rem;
          letter-spacing: 1.47px;
          margin-bottom: 0.3rem;
        }        
        .tier .since {
          font-size: .6875rem;
          letter-spacing: 0.05rem;
          opacity: 0.5;
          margin: 0;
        }
      `}</style>
      <img src={user.avatar} />
      <p className='name'>{user.name}</p>
      <div className='tier border-top border-gray px3 py2'>
        <p className='name'>{user.tier.name}</p>
        <p className='since'>
          <FormattedMessage id='UserCard.since' defaultMessage={`since`} />&nbsp;
          <FormattedDate value={user.createdAt} month='long' year='numeric' />
        </p>
      </div>
    </div>
  </a>
);