import { List } from 'immutable';
import { combineReducers } from 'redux-immutable';

import { postSubscriptionsAndDispatch } from '../../lib/api';

export const SUBSCRIPTION_CLEAR_RECIPIENTS = 'SUBSCRIPTION_CLEAR_RECIPIENTS';
export const subscriptionClearRecipients = () => ({
  type: SUBSCRIPTION_CLEAR_RECIPIENTS
});

export const SUBSCRIPTION_SET_SUBJECT = 'SUBSCRIPTION_SET_SUBJECT';
export const subscriptionSetSubject = (user) => ({
  type: SUBSCRIPTION_SET_SUBJECT,
  payload: user
});

export const SUBSCRIPTION_NEW_RECIPIENT = 'SUBSCRIPTION_NEW_RECIPIENT';
export const subscriptionNewRecipient = () => ({
  type: SUBSCRIPTION_NEW_RECIPIENT
});

export const SUBSCRIPTION_EDIT_RECIPIENT = 'SUBSCRIPTION_EDIT_RECIPIENT';
export const subscriptionEditRecipient = (index, recipient) => ({
  type: SUBSCRIPTION_EDIT_RECIPIENT,
  payload: { index, recipient }
});

export const SUBSCRIPTION_TRIM_RECIPIENTS = 'SUBSCRIPTION_TRIM_RECIPIENTS';
export const subscriptionTrimRecipients = () => ({
  type: SUBSCRIPTION_TRIM_RECIPIENTS
});

export const SUBSCRIPTIONS_SUBMIT = 'SUBSCRIPTIONS_SUBMIT';
export const subscriptionsSubmit = () => (dispatch, getState) => {
  dispatch({ type: SUBSCRIPTION_TRIM_RECIPIENTS });
  dispatch({ type: SUBSCRIPTIONS_SUBMIT });
  return postSubscriptionsAndDispatch({
    actionError: subscriptionsSubmitError,
    actionSuccess: subscriptionsSubmitSuccess,
    data: getState().get('subscription').toJS(),
    dispatch
  });
};

export const SUBSCRIPTIONS_SUBMIT_SUCCESS = 'SUBSCRIPTIONS_SUBMIT_SUCCESS';
export const subscriptionsSubmitSuccess = () => (dispatch, getState) => {
  dispatch({ type: SUBSCRIPTIONS_SUBMIT_SUCCESS });
  dispatch({ type: SUBSCRIPTION_CLEAR_RECIPIENTS });
};

export const SUBSCRIPTIONS_SUBMIT_ERROR = 'SUBSCRIPTIONS_SUBMIT_ERROR';
export const subscriptionsSubmitError = (error) => ({
  type: SUBSCRIPTIONS_SUBMIT_ERROR,
  payload: error,
  error: true
});

const recipientsReducer = (state = List.of(''), action) => {
  if (action.type === SUBSCRIPTION_CLEAR_RECIPIENTS) {
    return List.of('');
  }
  if (action.type === SUBSCRIPTION_EDIT_RECIPIENT) {
    const { index, recipient } = action.payload;
    return state.set(index, recipient.trim());
  }
  if (action.type === SUBSCRIPTION_NEW_RECIPIENT) {
    return state.push('');
  }
  if (action.type === SUBSCRIPTION_TRIM_RECIPIENTS) {
    return state.filter((recipient) => !!recipient.trim());
  }
  return state;
};

const subjectReducer = (state = '', action) => {
  if (action.type === SUBSCRIPTION_SET_SUBJECT) {
    return action.payload;
  }
  return state;
};

export const subscriptionReducer = combineReducers({
  recipients: recipientsReducer,
  subject: subjectReducer
});
