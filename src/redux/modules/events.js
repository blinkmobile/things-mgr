import { List, fromJS } from 'immutable';
import { createSelector } from 'reselect';

import { getEventsAndDispatch } from '../../lib/api';
import { getTagsMap } from './tags';
import { store } from '../store';
import { Event } from '../../components/Event/Event.js';

export const EVENTS_REQUEST = 'EVENTS_REQUEST';
export const eventsRequest = () => (dispatch, getState) => {
  dispatch({ type: EVENTS_REQUEST });
  return getEventsAndDispatch({
    actionError: eventsRequestError,
    actionSuccess: eventsRequestSuccess,
    dispatch
  });
};

export const EVENTS_REQUEST_SUCCESS = 'EVENTS_REQUEST_SUCCESS';
export const eventsRequestSuccess = (events) => ({
  type: EVENTS_REQUEST_SUCCESS,
  payload: events
});

export const EVENTS_REQUEST_ERROR = 'EVENTS_REQUEST_ERROR';
export const eventsRequestError = (error) => ({
  type: EVENTS_REQUEST_ERROR,
  payload: error,
  error: true
});

// potentialIds (payload: { deviceid: String, data: String }) => String[]
export const potentialIds = ({ deviceid, data }) => {
  // these now come through as `null` sometimes :S
  let result = [];
  if (data) {
    result.push(...[
      data.toLowerCase(),
      data.toUpperCase(),
      data.toLowerCase().replace(/^3000/, ''),
      data.toUpperCase().replace(/^3000/, '')
    ]);
  }
  if (deviceid) {
    result.push(...[
      deviceid.toLowerCase(),
      deviceid.toUpperCase()
    ]);
  }
  return result;
};

// firstMatch (map: Map, ids: String[]) => Map
export const firstMatch = (map, ids) => {
  for (let id of ids) {
    let value = map.get(id);
    if (value) {
      return value;
    }
  }
  return null;
};

// ensurePayloadUser (tagsMap: Map) => (payload: Map) => Map
const ensurePayloadUser = (tagsMap) => (payload) => {
  if (payload.get('user')) {
    return payload;
  }
  const user = firstMatch(tagsMap, potentialIds(payload));
  if (user) {
    console.log(payload.toJS(), user);
  }
  return user ? payload.set('user', user) : payload;
};

// ensureEventUser (tagsMap: Map) => (event: Map) => Map
const ensureEventUser = (tagsMap) => (event) => {
  if (event.getIn(['tags', 'user'])) {
    return event;
  }
  // ensure each payload refers to a user
  const payloads = event.getIn(['tags', 'payload']);
  if (payloads && payloads.size) {
    return event.setIn(['tags', 'payload'], payloads.map(ensurePayloadUser(tagsMap)));
  }
  return event;
};

function sortNewestDateFirst (a, b) {
  const aDate = a.get('date');
  const bDate = a.get('date');
  if (aDate === bDate) {
    return 0;
  }
  if (aDate > bDate) {
    return -1;
  }
  return 1;
}

// is this event useful outside of the event log (e.g. widgets) ?
const isUseful = ({ name, tags: { devices, host, messages, payload, tag, type, user } }) => !!(
  (type === 'beacon' || type === 'wifi')
);

function filterUseful (event) {
  return Event.canRender(event) || isUseful(event);
}

// state entries are newest to oldest
export const eventsReducer = (state = new List(), action) => {
  if (action.type === EVENTS_REQUEST_SUCCESS) {
    // incoming entries are newest to oldest
    const incoming = fromJS(action.payload.filter(filterUseful));
    const tagsMap = getTagsMap(store.getState());
    if (!getLatestEvent(state)) {
      // no events, so seed with payload
      return incoming.map(ensureEventUser(tagsMap));
    }
    // only add events we don't have yet
    let oldIds = state.map((event) => event.get('_id'));
    let newEvents = incoming.filter((event) => !oldIds.includes(event.get('_id')));
    newEvents = newEvents.map(ensureEventUser(tagsMap));
    // use the last 120 of all the events we have now
    const allEvents = newEvents.concat(state)
      .sort(sortNewestDateFirst);
    return allEvents.size > 120 ? allEvents.setSize(120) : allEvents;
  }
  if (action.type === EVENTS_REQUEST_ERROR) {
    console.log(action.type, action.payload);
    console.error(action.payload);
  }
  return state;
};

export const getEvents = (state) => state.get('events') || new List();

export const getLatestEvent = (state) => state.first();

export const getEventsByTagsType = createSelector(
  [getEvents],
  (events) => events.groupBy((event) => event.getIn(['tags', 'type']))
);

export const getBeaconEvents = createSelector(
  [getEventsByTagsType],
  (eventGroups) => eventGroups.get('beacon') || new List()
);

export const getWifiEvents = createSelector(
  [getEventsByTagsType],
  (eventGroups) => eventGroups.get('wifi') || new List()
);

export const getRecentBeaconEvent = createSelector(
  [getBeaconEvents],
  (events) => {
    const event = events.first();
    if (event) {
      const date = new Date(event.get('date'));
      const now = new Date();
      if (date > now - 1 * 60 * 1e3) {
        return event;
      }
    }
    return null;
  }
);

export const getRecentWifiEvents = createSelector(
  [getWifiEvents],
  (events) => events.filter((event) => {
    const date = new Date(event.get('date'));
    const now = new Date();
    return date > now - 15 * 60 * 1e3;
  })
);

export const getRecentWifiEvent = createSelector(
  [getRecentWifiEvents],
  (events) => events.first() || null
);

const getEventPayload = (event) => event.getIn(['tags', 'payload']);

export const countBeacons = createSelector(
  [getRecentBeaconEvent],
  (event) => event ? getEventPayload(event).count() : 0
);

export const countWifi = createSelector(
  [getRecentWifiEvent],
  (event) => event ? getEventPayload(event).count() : 0
);

const mapPayloadToMAC = (payload) => payload.get('MAC');

export const countWifiDwellers = createSelector(
  [getRecentWifiEvents],
  (events) => {
    if (events.size < 2) {
      return 0;
    }
    const first = events.first();
    const rest = events.rest();
    const currentMACs = getEventPayload(first).map(mapPayloadToMAC);
    const olderMACs = [].concat(...rest.map((event) => {
      return getEventPayload(event).map(mapPayloadToMAC);
    }).toJS());
    return currentMACs.count((mac) => olderMACs.includes(mac));
  }
);
