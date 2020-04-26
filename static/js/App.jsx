import React from 'react';
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom';

import Dashboard   from './components/Dashboard.jsx';
import Login       from './components/Login.jsx';
import DrumMachine from './components/DrumMachine.jsx';

class App extends React.Component {
  render() {
    return (
      <Router>
        <div>
          <nav>
            <ul>
              <li>
                <Link to='/'>Dashboard</Link>
              </li>
              <li>
                <Link to='/login'>Login</Link>
              </li>
              <li>
                <Link to='/drum-machine'>Drum machine</Link>
              </li>
            </ul>
          </nav>

          <Switch>
            <Route exact path='/' component={Dashboard}/>
            <Route path='/login' component={Login}/>
            <Route path='/drum-machine' component={DrumMachine}/>
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
