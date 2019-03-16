import React, { Component } from 'react'

import store from '../store'
import '../css/killinterface.css'
var request = require('request')
var ethjs = require('ethereumjs-util')


class KillInterface extends Component {
  constructor(props) {
    super(props)

    this.killPlayer = this.killPlayer.bind(this)

    this.state = {
      playerToKill: null,
      playerIndex: 0,
      nujaBattle: store.getState().web3.nujaBattleInstance,
      serverManager: store.getState().web3.serverManagerInstance,
      account: store.getState().account.accountInstance,
      web3: store.getState().web3.web3Instance,
    }

    store.subscribe(() => {
      this.setState({
        nujaBattle: store.getState().web3.nujaBattleInstance,
        serverManager: store.getState().web3.serverManagerInstance,
        account: store.getState().account.accountInstance,
        web3: store.getState().web3.web3Instance,
      })
    })
  }

  static defaultProps = {
    server: 0
  }

  componentWillMount() {
    var self = this

    // Get the index of our player
    if (self.state.nujaBattle != null && self.state.serverManager != null) {
      self.state.serverManager.methods.getIndexFromAddress(self.props.server, self.state.account.address).call().then(function(playerIndex) {
        self.setState({playerIndex: playerIndex})
      })
    }

    // Get the id of the match
    self.state.serverManager.methods.getServerState(self.props.server).call().then(function(serverState) {
      if(serverState == 2) {
        self.state.serverManager.methods.getServerCurrentMatch(self.props.server).call().then(function(matchId) {

          // Get list of killed player
          request.post(
            'http://nujabattle.com/post/currentkilledplayers',
            { json: { matchId: matchId } },
            function (killedPlayerError, killedPlayerResponse, killedPlayerBody) {
              if (!killedPlayerError && killedPlayerResponse.statusCode == 200) {


                // Get list of already confirmed killed player
                self.state.nujaBattle.methods.getKilledArray(self.props.server).call().then(function(confirmedKilled) {
                  // WARNING: string ?

                  // The first that has not been confirmed is the player to kill
                  for(var i=0; i<killedPlayerBody.length; i++) {
                    if(!confirmedKilled[parseInt(killedPlayerBody[i].killed)]) {
                      self.setState({playerToKill: killedPlayerBody[i]})
                    }
                  }
                })

              }
            }
          )
        })
      }
    })
  }

  killPlayer(e) {
    e.preventDefault()

    if (this.state.nujaBattle != null && this.state.playerToKill != null) {

      var killer = this.state.playerToKill.killer
      var killed = this.state.playerToKill.killed
      var signaturesList = this.state.playerToKill.signaturesList.map(x => JSON.parse(x))
      var originState = this.state.playerToKill.originState

      // Fill parameters for killPlayer function
      var nbSignature = signaturesList.length

      var metadata = []
      var move = []
      var signatureRS = []
      var v = []

      for(var i=0; i<nbSignature; i++) {
        metadata.push(signaturesList[i].metadata.map(x => x.toString()))
        move.push(signaturesList[i].move.map(x => x.toString()))

        // empty signature means the turn has been timed out, no signature needed
        if(signaturesList[i].signature == '') {
          signatureRS.push(['0x50402d24bf1f5de1cd884e55bf6cc9146f871c1c36e731e17a17d34e1ca58723', '0x50402d24bf1f5de1cd884e55bf6cc9146f871c1c36e731e17a17d34e1ca58723'])
          v.push(0)
        }
        else {
          var rHex = signaturesList[i].signature.slice(0, 66)
          var sHex = '0x' + signaturesList[i].signature.slice(66, 130)
          signatureRS.push([rHex,sHex])

          var splittedSig = ethjs.fromRpcSig(signaturesList[i].signature)
          v.push(splittedSig.v)
        }
      }

      // Fill empty value with junk data
      for(; i<8; i++) {
        metadata.push(signaturesList[0].metadata)
        move.push(signaturesList[0].move)
        signatureRS.push(['0x50402d24bf1f5de1cd884e55bf6cc9146f871c1c36e731e17a17d34e1ca58723', '0x50402d24bf1f5de1cd884e55bf6cc9146f871c1c36e731e17a17d34e1ca58723'])
        v.push(0)
      }


      // Send transaction
      this.state.nujaBattle.methods.killPlayer(this.props.server, [killer,killed], metadata, move, signatureRS, v, originState, nbSignature).send({
        from: this.state.account.address,
        gasPrice: 2000000000,
        gas: '1000000'
      })
      .on('error', function(error){ console.log('ERROR: ' + error)})
      .on('transactionHash', function(transactionHash){ console.log('transactionHash: ' + transactionHash)})
      .on('receipt', function(receipt){
        console.log('receipt')
        console.log(receipt)
      })
      .on('confirmation', function(confirmationNumber, receipt){ console.log('confirmation')})
      .then(function(ret) {
        alert('Player killed')
        console.log('ret')
        console.log(ret)
      })
    }
  }


  render() {

    if(this.state.playerToKill != null) {
      // The player to kill is ourself, therefore we show another message
      if(this.state.playerToKill.killed == this.state.playerIndex) {
        return(
          <div>
            <h3>You are dead</h3>
            <div style={{textAlign: 'center'}}>
              <button style={{marginTop: '20px', marginBottom: '10px'}} onClick={this.killPlayer} className="buttonKill">Quit server</button>
            </div>
          </div>
        )
      }
      else {
        return(
          <div>
            <h3>Player {this.state.playerToKill.killed} has been killed</h3>
            <div style={{textAlign: 'center'}}>
              <button style={{marginTop: '20px', marginBottom: '10px'}} onClick={this.killPlayer} className="buttonKill">Confirm death</button>
            </div>
          </div>
        )
      }
    }
    else {
      return(null)
    }
  }
}

export default KillInterface
