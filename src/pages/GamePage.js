import React, { Component } from 'react'
import { DrizzleContext } from "@drizzle/react-plugin"

import store from '../store'
import {getTurn, getState} from '../utils/stateChannelUtils'

import Board from '../components/Board'
import Loading from '../components/Loading'
import Navbar from '../components/Navbar'
import GameSidebar from '../components/GameSidebar'
import GameOptions from '../components/GameOptions'

import '../App.css'

class GamePageComp extends Component {
  constructor(props) {
    super(props)

    this.state = {
      initialized: false,
    }
  }

  async componentDidMount () {
    // Request the initial state of the board from the smart contract
    const {boardId, gameId, drizzleContext} = this.props

    if (drizzleContext.initialized) {
        // Call the getInitialState method
        const {drizzle, drizzleState} = drizzleContext

        try {
          // Get the state from the state channel server
          const state = await getState(boardId, gameId)
          const turn = await getTurn(boardId, gameId)

          // Verify the state returned exist
          if (state && turn !== -1) {
            const playerIndex = await drizzle.contracts.BoardHandler.methods.getGamePlayerIndex(
              boardId,
              gameId,
              drizzleState.accounts[0]
            ).call()

            // Send the new state to redux
            store.dispatch({
              type: 'NEW_GAMESTATE', 
              payload: {
                  newState: state,
                  boardId,
                  gameId,
                  playerIndex: parseInt(playerIndex),
                  turn,
              }
            })
          }
        } catch (err) {
          store.dispatch({
            type: 'RESET_STATE', 
          })
        }

        this.setState({initialized: true})
    }
  }

  render() {
    const {initialized} = this.state
    const {drizzleContext} = this.props

    if (!initialized) {
        return <Loading />
    }

    return(
      <div>
        <Navbar />
        <div className="row">
          <div className="col-md-8 col-xs-12">

              <div className="row" style={{padding: '10px'}}>
                <div className="col-md-12 col-sx-12" style={{width:'100%'}}>
                  <Board />
                </div>
                <div className="col-md-12 col-sx-12" style={{width:'100%', marginBottom: '100px'}}>
                  <GameOptions drizzleContext={drizzleContext} />
                </div>
              </div>
          </div>
          <div className="col-md-4 col-xs-12" style={{padding:'30px'}}>
            <GameSidebar drizzleContext={drizzleContext} />
          </div>
        </div>
      </div>
    )
  }
}

// Drizzle consumer
class GamePage extends Component {
    render() {
        return(
            <DrizzleContext.Consumer>
            { drizzleContext => {
                const {initialized} = drizzleContext
                if(!initialized) {
                    return <Loading />
                } else {
                    return <GamePageComp 
                      drizzleContext={drizzleContext} 
                      boardId={this.props.match.params.boardId} 
                      gameId={this.props.match.params.gameId} 
                    />
                }
              }
            }
            </DrizzleContext.Consumer>
        )
    }
}

export default GamePage



