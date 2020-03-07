/*!

=========================================================
* Argon Dashboard React - v1.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
// reactstrap components
// import { Container } from 'reactstrap';
// core components
import AdminNavbar from '../components/Navbars/AdminNavbar.js';
// import AdminFooter from '../components/Footers/AdminFooter.js';
import Sidebar from '../components/Sidebar/Sidebar.js';

import routes from '../routes.js';

function Admin(props) {
  // console.log(routes);
  // Used to target the body -  to set the page position to the top
  const mainContentRef = useRef(null);

  // A special wrapper for <Route> that knows how to
  // handle "sub"-routes by passing them in a `routes`
  // prop to the component it renders.

  const getBrandText = path => {
    // gets route name
    for (let i = 0; i < routes.length; i++) {
      if (props.location.pathname.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return 'Brand';
  };
  useEffect(e => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    mainContentRef.current.scrollTop = 0;
  }, []);
  return (
    <Router>
      <Sidebar
        {...props}
        routes={routes}
        logo={{
          innerLink: '/admin/index',
          imgSrc: require('@creative-tim-official/argon-dashboard-free/assets/img/brand/blue.png'),
          imgAlt: '...'
        }}
      />
      <div className="main-content" ref={mainContentRef}>
        <AdminNavbar {...props} brandText={getBrandText(props.location.pathname)} />
        <Switch>
          {routes
            .filter(route => {
              return route.layout === '/admin';
            })
            .map((route, i) => {
              return (
                <Route
                  key={i}
                  path={route.layout + route.path}
                  render={props => (
                    // pass the sub-routes down to keep nesting
                    <route.component {...props} />
                  )}
                />
              );
            })}
          <Redirect from="*" to="/admin/index" />
        </Switch>
        {/*
          <Container fluid>
          <AdminFooter />
          </Container>
        */}
      </div>
    </Router>
  );
}

export default Admin;
