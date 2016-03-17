import md5 from 'md5';

import { store } from '../redux/store';

// register environment variables in config/_base.js
const getUrl = process.env.ENTITY_HTTP_GET_API;
const postUrl = process.env.ENTITY_HTTP_POST_API;

// getAuthorisation () => String
const getAuthorisation = () => {
  const login = store.getState().get('login');
  const username = login.get('username');
  const password = login.get('password');

  return `bearer ${username} ${md5(password)}`;
};

// getEntities (type: String) => Promise
export const getEntities = (type) => {
  return fetch(`${getUrl}?entity=${type}`, {
    headers: {
      Authorisation: getAuthorisation()
    },
    method: 'GET',
    mode: 'cors'
  })
    .then((res) => res.json());
};

/*
interface GetDispatchOptions {
  actionError: Function,
  actionSuccess: Function,
  dispatch: Function,
  type: String
}
*/
// getEntities (options: GetDispatchOptions) => Promise
export const getEntitiesAndDispatch = ({ actionSuccess, actionError, dispatch, type }) => {
  return getEntities(type)
    .then((data) => {
      if (data.error || data.errors) {
        dispatch(actionError(new Error(data.error || data.errors)));
        return;
      }
      dispatch(actionSuccess(data[type]));
    })
    .catch((err) => dispatch(actionError(err)));
};

// getEntities (type: String, data: Object[]) => Promise
export const postEntities = (type, data) => {
  const formData = new FormData();
  formData.append('args', JSON.stringify({ [type]: data }));
  return fetch(`${postUrl}?entity=${type}`, {
    body: formData,
    headers: {
      Authorisation: getAuthorisation()
    },
    method: 'POST',
    mode: 'cors'
  })
    .then((res) => res.json());
};
