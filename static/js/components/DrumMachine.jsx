// https://dev.opera.com/articles/drum-sounds-webaudio/

import React, { useCallback } from 'react';
const axios = require('axios');
const Tone = require('tone');

class DrumMachine extends React.Component {
  constructor(props) {
    super(props);

    const audioContext = new AudioContext();
    this.state = {
      playing      : false,
      canvasContext: {},
      audioContext : audioContext,
      now          : audioContext.currentTime,
      subDivision  : 8,
      playing      : false,
      repeatId     : null,
      sounds       : {}
    };

    this.play    = this.play.bind(this);
    this.canvas  = React.createRef();
    this.drumset = React.createRef();
    this.imageCanvas = React.createRef();
  }

  render() {
    const columns = [];
    for (let i = 0; i < this.state.subDivision; i++)
      columns.push(<SequencerColumn key={i}/>);
    
    return (
      <div id='drum-machine'>
        <div id='sequencer'>
          <button className='button' onClick={() => this.setState({subDivision: 8})}>8th</button>
          <button className='button' onClick={() => this.setState({subDivision: 16})}>16th</button>

          <div className='flex'>
            <SequencerColumnName/>
            <div className='column-container'>
              {columns}
            </div>
          </div>
        </div>
        <button className='button' onClick={this.play}>{this.state.playing ? 'Stop' : 'Play'}</button>
        <img ref={this.drumset} className='hidden' src='/dist/images/drumset.jpg'/>
        <canvas ref={this.imageCanvas} width='512' height='384'></canvas>
        <canvas className='drum-canvas' ref={this.canvas} width='512' height='384'></canvas>
      </div>
    );
  }

  componentDidMount() {
    const canvasContext = this.canvas.current.getContext('2d');
    this.setState({
      canvasContext,
      sounds : {
        hihat: new HiHat(this.state.audioContext, canvasContext),
        kick : new Kick(this.state.audioContext, canvasContext),
        snare: new Snare(this.state.audioContext, canvasContext),
      }
    });
    
    // add some event listener to the image
    // figure out when images have finished loading
    setTimeout(() => {
      const context = this.imageCanvas.current.getContext('2d');
      context.drawImage(this.drumset.current, 0, 0);
    }, 500);
  }

  play() {
    if (this.state.playing) {
      this.setState({playing: false});
      Tone.Transport.clear(this.repeatId);
      return;
    }

    this.setState({playing: true});
    let index    = 0;
    const columns = document.querySelectorAll('.column-container > .column');

    this.repeatId = Tone.Transport.scheduleRepeat(time => {
      const step  = index % this.state.subDivision;
      const boxes = columns[step].children;

      for (const box of boxes)
        if (box.classList.contains('active')) {
          this.state.sounds[box.dataset.instrument].trigger(time);
          //this.updateCanvas(box.dataset.instrument);
        }

      index++;
    }, `${this.state.subDivision}n`);

    Tone.Transport.start();
  }
}
export default DrumMachine;

class SequencerColumnName extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <div className="column">
        <div className='box box-dark'>Kick</div>
        <div className='box box-dark'>Snare</div>
        <div className='box box-dark'>Hi-Hat</div>
      </div>
    );
  }
}

class SequencerColumn extends React.Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
  }

  render() {
    return(
      <div className='column'>
        <div className='box' data-instrument='kick'  onClick={this.toggle}>&nbsp;</div>
        <div className='box' data-instrument='snare' onClick={this.toggle}>&nbsp;</div>
        <div className='box' data-instrument='hihat' onClick={this.toggle}>&nbsp;</div>
      </div>
    );
  }

  toggle(event) {
    event.target.classList.toggle('active');
  }
}

/**
 * A lot of people have researched the acoustics of drums and how they make
 * sound. For two-skinned drums, such as the kick drum, they’ve noticed that
 * the sound starts at a higher frequency — the ‘attack’ phase when the striker
 * hits the skin — and then rapidly falls away to a lower frequency. While this
 * is happening, the volume of the sound also decreases. Once we’ve struck the
 * drum there’s nothing to keep producing sound so it simply decays.
 */
class Kick {
  /**
   * @param {AudioContext} audioContext 
   * @param {CanvasRenderingContext2D} canvasContext
   */
  constructor(audioContext, canvasContext) {
    this.audioContext  = audioContext;
    this.canvasContext = canvasContext;
    this.gain    = {};
    this.osc     = {};
    this.name = 'Kick';
  }

  setup() {
    this.gain = this.audioContext.createGain();
    this.osc  = this.audioContext.createOscillator();
    this.osc.connect(this.gain);
    this.gain.connect(this.audioContext.destination);
  }

  trigger(time) {
    this.setup();
    this.osc.frequency.setValueAtTime(150, time);
    this.gain.gain.setValueAtTime(1, time);

    this.osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    this.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    this.osc.start(time);
    this.osc.stop(time + 0.5);
    this.canvasContext.fillStyle = 'green';
    this.canvasContext.fillRect(245,200,50,50);
    setTimeout(() => this.canvasContext.clearRect(0, 0, 512, 384), 150);
  }
}

/**
 * A snare drum has a rigid shell holding two, taut drum membranes. When the
 * top membrane is struck, a series of wire springs held underneath the lower
 * membrane rattle in sympathy. There’s a complexity to the snare sound that
 * makes it more challenging to synthesise. But we can tackle it in stages to
 * make the process easier.
 */
class Snare {
  /**
   * @param {AudioContext} audioContext
   * @param {CanvasRenderingContext2D} canvasContext
   */
  constructor(audioContext, canvasContext) {
    this.audioContext = audioContext;
    this.canvasContext = canvasContext;
    this.name = 'Snare';
  }

  /**
   * First, the rattle of the wire snare underneath the drum can be synthesised
   * using a burst of noise. We can create noise using a random number generator
   * 
   * In this code we create a “buffer” of individual samples, which we can later 
   * trigger at a precise time. The call to createBuffer specifies that the
   * buffer has a single channel, 44100 individual samples, at a sample rate
   * of 44100 Hz. That is, 1 second of audio in total. This should be sufficient
   * for our purposes since the sound of an individual snare hit is very short.
   *
   * We fill the buffer with random numbers between -1 and 1. This even
   * distribution of random numbers creates “white” noise, which is noise with
   * equal energy at every frequency.
   */
  noiseBuffer() {
    const bufferSize = this.audioContext.sampleRate;
    const buffer     = this.audioContext.createBuffer(
      1, bufferSize, this.audioContext.sampleRate
    );

    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++)
      output[i] = Math.random() * 2 - 1;

    return buffer;
  }

  /**
   * Removing some of the lowest frequency sound from this noise creates a more
   * realistic sounding snare. We can do that using a filter
   */
  setup() {
    this.noise        = this.audioContext.createBufferSource();
    this.noise.buffer = this.noiseBuffer();

    // We set the cutoff frequency of the filter at 1000 Hz. This means noise
    // below 1000 Hz will be removed. We also need to shape the amplitude of
    // the noise burst using an envelope, as we did before with the snare drum.
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type  = 'highpass';
    noiseFilter.frequency.value = 1000;
    this.noise.connect(noiseFilter);

    this.noiseEnvelope = this.audioContext.createGain();
    noiseFilter.connect(this.noiseEnvelope);
    this.noiseEnvelope.connect(this.audioContext.destination);

    // A short burst of filtered noise on its own doesn’t create a very good
    // sounding snare. Adding a sharp “snap” to the front of the sound helps to
    // make the snare sound more percussive. We can achieve this using an
    // oscillator set to generate a triangle waveform, and again shape that
    // using a GainNode as an envelope.
    this.osc      = this.audioContext.createOscillator();
    this.osc.type = 'triangle';

    this.oscEnvelope = this.audioContext.createGain();
    this.osc.connect(this.oscEnvelope);
    this.oscEnvelope.connect(this.audioContext.destination);
  }

  trigger(time) {
    this.setup();
    this.noiseEnvelope.gain.setValueAtTime(1, time);
    this.noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    this.noise.start(time);

    this.osc.frequency.setValueAtTime(100, time);
    this.oscEnvelope.gain.setValueAtTime(0.7, time);
    this.oscEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    this.osc.start(time);

    this.osc.stop(time + 0.2);
    this.noise.stop(time + 0.2);

    this.canvasContext.fillStyle = 'red';
    //this.canvasContext.fillRect(160,230,50,50);
    this.canvasContext.beginPath();
    this.canvasContext.arc(190, 260, 50, 0, 2 * Math.PI);
    this.canvasContext.fill();
    this.canvasContext.stroke(); 
    setTimeout(() => this.canvasContext.clearRect(0, 0, 512, 384), 150);
  }
}

/**
 * Synthesising a realistic-sounding hi-hat is hard. When you strike a disk
 * of metal the sound that is produced is a complex mixture of unevenly-spaced
 * harmonics which decay at different rates. It’s not an impossible task, and
 * if you’re interested there’s some further reading below, but for this post
 * we’re going to cheat a little by sampling an existing sound. By doing this
 * you’ll also learn how sampling, taking short recordings of sound and using
 * them as the basis of new sounds, can be achieved with the Web Audio API.
 */
class HiHat {
  /**
   * @param {AudioContext} audioContext
   * @param {CanvasRenderingContext2D} canvasContext
   */
  constructor(audioContext, canvasContext) {
    this.audioContext  = audioContext;
    this.canvasContext = canvasContext;
    this.buffer = {};
    this.name   = 'Hi-Hat';
    this.load();
  }

  async load() {
    const response = await axios({
      method      : 'get',
      url         : 'dist/samples/hihat.wav',
      responseType: 'arraybuffer',
    });
    this.buffer = this.audioContext.decodeAudioData(response.data, audioBuffer => {
      this.buffer = audioBuffer;
    });
  }

  setup() {
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.audioContext.destination);
  }

  trigger(time) {
    this.setup();
    this.source.start(time);

    this.canvasContext.fillStyle = 'pink';
    // this.canvasContext.fillRect(40,230,50,50);
    this.canvasContext.arc(40, 230, 50, 0, 2 * Math.PI);
    this.canvasContext.fill();
    setTimeout(() => this.canvasContext.clearRect(0, 0, 512, 384), 150);
  }
}
