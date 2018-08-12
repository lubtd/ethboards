import React, { Component } from 'react'

import store from '../store'

import Bar from '../components/Bar'
import Map from '../containers/Map'
import MapInitial from '../containers/MapInitial'
import Sidebar from '../containers/Sidebar'
import PlayerList from '../containers/PlayerList'

var SW = require('../utils/stateWrapper')


class Play extends Component {
  constructor(props) {
    super(props)

    this.updateServerLoop = this.updateServerLoop.bind(this)

    this.state = {
      nujaBattle: store.getState().web3.nujaBattleInstance,
      serverManager: store.getState().web3.serverManagerInstance,
      serverState: 0,
      server: 0,
      matchId: 0
    }

    store.subscribe(() => {
      this.setState({
        nujaBattle: store.getState().web3.nujaBattleInstance,
        serverManager: store.getState().web3.serverManagerInstance,
      })
    })
  }

  static defaultProps = {
  }

  componentWillMount() {
    var self = this
    var serverId = this.props.match.params.serverid

    // Update the server for the state channel
    if (isNaN(serverId) == false) {

      // Get the id of the current match
      if (self.state.nujaBattle != null && self.state.serverManager != null) {

        self.state.serverManager.methods.getServerState(parseInt(serverId)).call().then(function(serverState) {

          if(serverState == 2) {
            self.state.serverManager.methods.getServerCurrentMatch(parseInt(serverId)).call().then(function(matchId) {
              SW.updateServer(matchId)
              self.setState({matchId: parseInt(matchId)})
              setTimeout(self.updateServerLoop, 1000)
            })
          }
          self.setState({server: parseInt(serverId), serverState: parseInt(serverState)})
        })
      }
    }
  }

  // Loop to periodically check if server has been updated
  updateServerLoop() {
    SW.updateServer(this.state.matchId)
    setTimeout(this.updateServerLoop, 2000)
  }


  render() {

    var content = null

    if(this.state.serverState == 0) {
      // No map as server is offline
      content =
        <div>
          <Bar style={{paddingRight:'10px'}} />
          <div className="col-md-4" style={{paddingLeft:0, paddingRight:0}}>
            <Sidebar server={this.state.server} serverState={this.state.serverState} />
          </div>
          <div className="col-md-8" style={{paddingRight:0, paddingLeft:0}}>

            <div className="container-fluid" style={{overflowY: 'scroll', height: '100vh', paddingLeft:0, paddingRight:0}}>
              <div className="row" style={{padding: '30px'}}>
                <h1>Server offline</h1>
              </div>
            </div>
          </div>
        </div>
    }
    else if(this.state.serverState == 1) {
      // Initial map without player list
      content =
        <div>
          <Bar style={{paddingRight:'10px'}} />
          <div className="col-md-4" style={{paddingLeft:0, paddingRight:0}}>
            <Sidebar server={this.state.server} serverState={this.state.serverState} />
          </div>
          <div className="col-md-8" style={{paddingRight:0, paddingLeft:0}}>

            <div className="container-fluid" style={{overflowY: 'scroll', height: '100vh', paddingLeft:0, paddingRight:0}}>
              <div className="row" style={{padding: '30px'}}>
                <div className="col-md-12" style={{width:'100%', paddingLeft:'30px'}}>
                  <MapInitial server={this.state.server} />
                </div>
              </div>
            </div>
          </div>
        </div>
    }
    else {

      // State channel map and player list
      content =
        <div>
          <Bar style={{paddingRight:'10px'}} />
          <div className="col-md-4" style={{paddingLeft:0, paddingRight:0}}>
            <Sidebar server={this.state.server} serverState={this.state.serverState} />
          </div>
          <div className="col-md-8" style={{paddingRight:0, paddingLeft:0}}>

            <div className="container-fluid" style={{overflowY: 'scroll', height: '100vh', paddingLeft:0, paddingRight:0}}>
              <div className="row" style={{padding: '30px'}}>
                <div className="col-md-12" style={{width:'100%', paddingLeft:'30px'}}>
                  <Map server={this.state.server} />
                </div>
                <div className="col-md-12" style={{width:'100%', top:'560px'}}>
                  <h1 style={{marginBottom: '40px'}}>Players :</h1>
                  <PlayerList server={this.state.server} />
                </div>
              </div>
            </div>
          </div>
        </div>
    }

    return(content)
  }
}

export default Play
