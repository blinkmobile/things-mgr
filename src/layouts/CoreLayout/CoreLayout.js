import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import classnames from 'classnames';
import 'normalize.css/normalize.css';
import 'react-data-grid/themes/react-data-grid.css';

import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';

import BusStatus from '../../components/BusStatus/BusStatus.js';
import NavTabs from '../../components/NavTabs/NavTabs';

import '../../styles/core.css';
import classes from './CoreLayout.css';

// Note: Stateless/function components *will not* hot reload!
// react-transform *only* works on component classes.
//
// Since layouts rarely change, they are a good place to
// leverage React's new Stateless Functions:
// https://facebook.github.io/react/docs/reusable-components.html#stateless-functions
//
// CoreLayout is a pure function of its props, so we can
// define it with a plain javascript function...
function CoreLayout ({ children }) {
  const appProps = {
    children: [
      <Link key='l' to='/login'><FlatButton label='Login' /></Link>
    ],
    className: classes.appbar,
    showMenuIconButton: false,
    title: 'Royal Western Hospital'
  };

  if (process.env.USE_CASE === 'dashboard') {
    appProps.children.unshift(<a key='s'><BusStatus className={classes.busStatus} /></a>);
  }

  const selfClasses = [classes.self];
  const viewClasses = [classes.view];
  if (process.env.USE_CASE === 'dashboard') {
    selfClasses.push(classes.flexSelf);
    viewClasses.push(classes.flexView);
  }
  return (
    <div className={classnames(selfClasses)}>
      <AppBar {...appProps} />
      {process.env.USE_CASE !== 'dashboard' ? <NavTabs /> : null}
      <div className={classnames(viewClasses)}>
        {children}
      </div>
    </div>
  );
}

CoreLayout.propTypes = {
  children: PropTypes.element
};

export default CoreLayout;
