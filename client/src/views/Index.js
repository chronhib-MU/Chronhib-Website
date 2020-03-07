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
import React from 'react';
// javascript plugin for creating charts
import Chart from 'chart.js';
// reactstrap components
import { Container } from 'reactstrap';

// core components
import { chartOptions, parseOptions } from '../variables/charts.js';

import Header from '../components/Headers/Header.js';

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeNav: 1,
      chartExample1Data: 'data1'
    };
    if (window.Chart) {
      parseOptions(Chart, chartOptions());
    }
  }
  toggleNavs = (e, index) => {
    e.preventDefault();
    this.setState({
      activeNav: index,
      chartExample1Data: this.state.chartExample1Data === 'data1' ? 'data2' : 'data1'
    });
  };
  render() {
    return (
      <div>
        {<Header />}
        {/* Page content */}
        <Container className="mt--7" fluid></Container>
      </div>
    );
  }
}

export default Index;
