import React, { Component } from 'react'
import store from '../store'

var ipfsAPI = require('ipfs-api')
var weaponJson = require('../../build/contracts/Weapon.json')

import imageConverter from '../utils/imageConverter'
var noop = function() {};

class WeaponDesc extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: store.getState().web3.web3Instance,
      imageData: '',
      name: '',
      description: ''
    }

    store.subscribe(() => {
      this.setState({
        web3: store.getState().web3.web3Instance,
      });
    });
  }

  static defaultProps = {
    contractAddress: null
  }

  componentWillMount() {
    var weaponContract = new self.state.web3.eth.Contract(weaponJson.abi, this.props.contractAddress)
    var ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001')

    if (weaponContract != null) {
      weaponContract.methods.getMetadata().call().then(function(ret) {
        ipfs.files.get(ret + '/sprite.gif', function (err, files) {
          self.setState({imageData: "data:image/gif;base64,"+imageConverter(files[0].content)})
        })
        ipfs.files.get(ret + '/name/default', function (err, files) {
          self.setState({name: files[0].content.toString('utf8')})
        })
        ipfs.files.get(ret + '/description/default', function (err, files) {
          self.setState({description: files[0].content.toString('utf8')})
        })
      });
    }
  }

  render() {
    return (
      <div style={infoStyle}>
        <div className="row" style={{padding: '10px'}}>
          <div className="col-md-6" style={{}}>
            <img src={this.state.imageData} style={{width: '100%'}}></img>
          </div>
          <div className="col-md-6" style={{}}>
            <p>{this.state.name}</p>
            <p>{this.state.description}</p>
          </div>
        </div>
      </div>
    );
  }
}

const infoStyle = {
  position: 'relative',
  padding: '20px',
  width: '80%',
  minHeight: '100px',
  backgroundColor: 'rgba(240, 240, 240, 0.7)',
  boxShadow:'5px 5px rgba(0, 0, 0, 1)',
  marginRight: 'auto',
  marginLeft: 'auto',
  marginBottom: '20px'
};

export default WeaponDesc
