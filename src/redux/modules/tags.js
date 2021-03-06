import { List, Map, fromJS } from 'immutable';
import { createSelector } from 'reselect';

import { getEntitiesAndDispatch, postEntitiesAndDispatch } from '../../lib/api';
import { insertUpdate } from '../../lib/resource.js';
import { getUsersMap } from './users';

export const TAGS_EDIT = 'TAGS_EDIT';
export const tagsEdit = (index, changes) => ({
  type: TAGS_EDIT,
  payload: { index, changes }
});

export const TAGS_INSERT_UPDATE = 'TAGS_INSERT_UPDATE';
export const tagsInsertUpdate = (id, resource) => ({
  type: TAGS_INSERT_UPDATE,
  payload: { id, resource }
});

export const TAGS_NEW = 'TAGS_NEW';
export const tagsNew = () => ({ type: TAGS_NEW });

export const TAGS_REQUEST = 'TAGS_REQUEST';
export const tagsRequest = () => (dispatch, getState) => {
  dispatch({ type: TAGS_REQUEST });
  return getEntitiesAndDispatch({
    actionError: tagsRequestError,
    actionSuccess: tagsRequestSuccess,
    dispatch,
    type: 'tags'
  });
};

export const TAGS_REQUEST_SUCCESS = 'TAGS_REQUEST_SUCCESS';
export const tagsRequestSuccess = (tags) => ({
  type: TAGS_REQUEST_SUCCESS,
  payload: tags
});

export const TAGS_REQUEST_ERROR = 'TAGS_REQUEST_ERROR';
export const tagsRequestError = (error) => ({
  type: TAGS_REQUEST_ERROR,
  payload: error,
  error: true
});

export const TAGS_SUBMIT = 'TAGS_SUBMIT';
export const tagsSubmit = () => (dispatch, getState) => {
  dispatch({ type: TAGS_SUBMIT });
  return postEntitiesAndDispatch({
    actionError: tagsSubmitError,
    actionSuccess: tagsSubmitSuccess,
    data: getState().get('tags').toJS(),
    dispatch,
    type: 'tags'
  });
};

export const TAGS_SUBMIT_SUCCESS = 'TAGS_SUBMIT_SUCCESS';
export const tagsSubmitSuccess = (tags) => ({
  type: TAGS_SUBMIT_SUCCESS,
  payload: tags
});

export const TAGS_SUBMIT_ERROR = 'TAGS_SUBMIT_ERROR';
export const tagsSubmitError = (error) => ({
  type: TAGS_SUBMIT_ERROR,
  payload: error,
  error: true
});

const initialState = new List();

const ACTION_HANDLERS = {

  [TAGS_INSERT_UPDATE]: (state, { payload: { id, resource } }) => {
    return insertUpdate(state, id, resource);
  }

};

export const tagsReducer = (state = initialState, action) => {
  if (action.type === TAGS_EDIT) {
    const { index, changes } = action.payload;
    const resourceChanges = { links: {} };
    Object.keys(changes).forEach((key) => {
      if (key === 'id') {
        resourceChanges[key] = changes[key];
      }
      if (key === 'users' || key === 'readers') {
        resourceChanges.links[key] = changes[key];
      }
    });
    return state.mergeDeepIn([index], resourceChanges);
  }
  if (action.type === TAGS_NEW) {
    return state.push(fromJS({
      id: `t${state.size}`,
      links: {
        users: '',
        readers: ''
      },
      status: 'inactive',
      type: 'RFID'
    }));
  }
  if (action.type === TAGS_REQUEST_SUCCESS) {
    return fromJS(action.payload);
  }
  if (action.type === TAGS_REQUEST_ERROR) {
    console.log(action.type, action.payload);
    console.error(action.payload);
  }

  const handler = ACTION_HANDLERS[action.type];
  return handler ? handler(state, action) : state;
};

export const getTags = (state) => state.get('tags') || new List();

export const getTagsMap = createSelector(
  [getTags, getUsersMap],
  (tags, usersMap) => tags.reduce((map, tag) => {
    const name = usersMap.get(tag.getIn(['links', 'users']));
    return map.set(tag.get('id'), name);
  }, new Map())
);
