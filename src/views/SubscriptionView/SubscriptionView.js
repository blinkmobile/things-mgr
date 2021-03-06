import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { List } from 'immutable';

import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentSend from 'material-ui/svg-icons/content/send';
import Divider from 'material-ui/Divider';
import DropDownMenu from 'material-ui/DropDownMenu';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import { List as MDList, ListItem } from 'material-ui/List';
import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';

import { isTelephone } from '../../lib/string';
import {
  subscriptionNewRecipient,
  subscriptionEditRecipient,
  subscriptionSetSubject,
  subscriptionsSubmit
} from '../../redux/modules/subscription';
import { getSortedUsersPatients, usersRequest } from '../../redux/modules/users';

import classes from './SubscriptionView.css';

export class SubscriptionView extends React.Component {
  static propTypes = {
    recipients: PropTypes.instanceOf(List),
    subject: PropTypes.string,
    subscriptionNewRecipient: PropTypes.func.isRequired,
    subscriptionEditRecipient: PropTypes.func.isRequired,
    subscriptionSetSubject: PropTypes.func.isRequired,
    subscriptionsSubmit: PropTypes.func.isRequired,
    users: PropTypes.instanceOf(List),
    usersRequest: PropTypes.func.isRequired
  };

  constructor () {
    super();
    this.handleReceipientChange = this.handleReceipientChange.bind(this);
    this.handleSendClick = this.handleSendClick.bind(this);
    this.handleSubjectChange = this.handleSubjectChange.bind(this);
  }

  handleReceipientChange (event, index) {
    this.props.subscriptionEditRecipient(index, event.target.value);
  }

  handleSubjectChange (event, index, value) {
    this.props.subscriptionSetSubject(value);
  }

  handleSendClick () {
    this.props.subscriptionsSubmit();
  }

  componentDidMount () {
    // automatically refresh user listing
    this.props.usersRequest();
  }

  render () {
    const {
      recipients, subject, users,
      subscriptionNewRecipient
    } = this.props;

    return (
      <Paper className={classnames([classes.self])}>
        <label>Invitation to follow</label>
        <DropDownMenu ref='subject' onChange={this.handleSubjectChange} value={subject}>
          <MenuItem value='' primaryText='Pick someone' />
          {users.map((item) => {
            const id = item.get('id');
            const name = `${item.get('lastname')}, ${item.get('firstname')}`;
            return <MenuItem key={id} value={id} primaryText={name} />;
          })}
        </DropDownMenu>

        <Divider />

        <MDList>
          {recipients.map((recipient, index) => {
            const type = isTelephone(recipient) ? 'tel' : 'email';
            const textProps = {
              fullWidth: true,
              hintText: 'recipient phone or email',
              onChange: (event) => this.handleReceipientChange(event, index),
              type,
              value: recipient
            };
            return (
              <ListItem key={index}>
                <TextField {...textProps} />
              </ListItem>
            );
          })}
        </MDList>

        {(() => {
          if (subject && recipients.size) {
            return (
              <FloatingActionButton className={classes.send} onMouseUp={this.handleSendClick} secondary>
                <ContentSend />
              </FloatingActionButton>
            );
          }
          if (!recipients.size) {
            return <p>Add recipients, they will be invited to subscribe</p>;
          }
        })()}

        <FloatingActionButton className={classes.add} onMouseUp={subscriptionNewRecipient}>
          <ContentAdd />
        </FloatingActionButton>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  recipients: state.getIn(['subscription', 'recipients']),
  subject: state.getIn(['subscription', 'subject']),
  users: getSortedUsersPatients(state)
});
export default connect((mapStateToProps), {
  subscriptionNewRecipient,
  subscriptionEditRecipient,
  subscriptionSetSubject,
  subscriptionsSubmit,
  usersRequest
})(SubscriptionView);
