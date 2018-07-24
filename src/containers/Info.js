import React, { Component } from 'react'

import '../App.css'
import Footer from '../components/Footer'

const infoStyle = {
  padding: '20px',
  width: '100%',
  minHeight: '100px',
  backgroundColor: 'rgba(240, 240, 240, 0.7)',
  boxShadow:'5px 5px rgba(0, 0, 0, 1)'
};

const infoStyle2 = {
  marginRight: 'auto',
  marginLeft: 'auto',
  marginTop: '40px',
  marginBottom: '40px',
  padding: '20px',
  width: '700px',
  position: 'relative',
  minHeight: '100px',
  backgroundColor: 'rgba(240, 240, 240, 0.7)',
  boxShadow:'5px 5px rgba(0, 0, 0, 1)'
};

const imageStyle = {
  position: 'relative',
  width: '100%',
  borderStyle:'solid',
  borderWidth:'1px',
  backgroundImage:'url(\'/images/vaporbg.jpg\')'
}

const imageStyle2 = {
  position: 'relative',
  width: '100%',
  borderStyle:'solid',
  borderWidth:'1px',
  backgroundImage:'url(\'/images/vaporbg2.jpg\')'
}

const imageStyle3 = {
  position: 'relative',
  width: '100%',
  borderStyle:'solid',
  borderWidth:'1px',
  backgroundImage:'url(\'/images/vaporbg3.jpg\')'
}


class Info extends Component {
  constructor(props) {
    super(props)

    this.state = {
    }
  }

  static defaultProps = {
  }

  componentWillMount() {
  }

  render() {
    return (
      <div style={{overflowX: 'hidden'}}>
        <div style={{textAlign: 'center', marginTop: '50px', marginBottom: '50px'}}>
          <h1>Lorem ipsum dolor sit amet</h1>
          <h1>Vivamus et quam eros</h1>
          <h1>Suspendisse a augue neque</h1>
        </div>
        <div className="row" style={{padding: '30px'}}>
          <div className="col-md-12" style={{textAlign: 'center'}}>
            <div style={infoStyle2}>
              <h1>Nulla ornare maximus consectetu</h1>
              <p>Maecenas nulla eros, fringilla vitae finibus non, fermentum blandit augue. Ut mollis sodales pretium. Phasellus sed arcu pellentesque</p>
            </div>
          </div>
        </div>
        <div className="row" style={{padding: '30px'}}>
          <div className="col-md-6">
            <img src="/images/nujaks/arm.png" alt="Nuja" style={imageStyle3}></img>
          </div>
          <div className="col-md-6">
            <div style={infoStyle}>
              <h1>Etiam ac efficitur massa, sit amet</h1>
              <p>Nulla vehicula quam vitae molestie pharetra. Nam fermentum accumsan lectus, vel venenatis enim tincidunt quis. Ut sed diam et augue viverra porta et a tellus. Sed et sem a dolor tempus iaculis ut sit amet velit</p>
            </div>
          </div>
        </div>
        <div className="row" style={{padding: '30px'}}>
          <div className="col-md-6">
            <div style={infoStyle}>
              <h1>Nam placerat ligula augue, et imperdiet</h1>
              <p>Mauris odio nisi, tristique at molestie in, dignissim sed velit. Vestibulum et neque a velit tincidunt congue. Nam in posuere leo. Nullam a turpis sed elit rutrum </p>
            </div>
          </div>
          <div className="col-md-6">
            <img src="/images/nujaks/cardPrez.png" alt="Nuja" style={imageStyle}></img>
          </div>
        </div>
        <div className="row" style={{padding: '30px'}}>
          <div className="col-md-6">
            <img src="/images/nujaks/weapon.png" alt="Nuja" style={imageStyle2}></img>
          </div>
          <div className="col-md-6">
            <div style={infoStyle}>
              <h1>Nullam ullamcorper fringilla neque</h1>
              <p>Nunc sodales efficitur ipsum, posuere eleifend felis condimentum ac. Nullam dictum ipsum id erat hendrerit mollis. Phasellus sed dui ut enim commodo mollis</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}


export default Info
