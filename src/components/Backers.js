import React from 'react';
import { css } from 'glamor';
import Button from './Button';
import colors from '../constants/colors';
import api from '../lib/api';

const styles = {
  backers: css({
    width: '100%'
  })
}

class Backers extends React.Component {

  static propTypes = {
    actions: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  }

  render() {
    return (
      <div className={styles.backers}>
        {this.users.map((user, index) =>
          <img src={user.avatar} />
        )}
      </div>
    )
  }

}

export default Backers;