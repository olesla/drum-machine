// https://dev.opera.com/articles/drum-sounds-webaudio/

import React, { useCallback } from 'react';
const axios = require('axios');

class DrumMachine extends React.Component {
  constructor(props) {
    super(props);
    this.play = this.play.bind(this);

    this.context = new AudioContext();
    this.kick    = new Kick(this.context);
    this.hihat   = new HiHat(this.context);
    this.snare   = new Snare(this.context);
    // this.hihat   = new HiHat(this.context);
    this.now     = this.context.currentTime;
  }

  render () {
    return (
      <div>
        <button onClick={this.play}>Play</button>
      </div>
    );
  }

  play() {
    for (let i = 0; i < 8; i++) {
      this.hihat.trigger(this.now + (i * 0.25));
    }

    this.kick.trigger(this.now);
    this.snare.trigger(this.now + 0.5);
    this.kick.trigger(this.now + 1);
    this.kick.trigger(this.now + 1.25);
    this.snare.trigger(this.now + 1.5);
  }
}

export default DrumMachine;

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
   * @param {Object<AudioContext>} context 
   */
  constructor(context) {
    this.context = context;
    this.gain    = {};
    this.osc     = {};
  }

  setup() {
    this.gain = this.context.createGain();
    this.osc  = this.context.createOscillator();
    this.osc.connect(this.gain);
    this.gain.connect(this.context.destination);
  }

  trigger(time) {
    this.setup();
    this.osc.frequency.setValueAtTime(150, time);
    this.gain.gain.setValueAtTime(1, time);

    this.osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    this.gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    this.osc.start(time);
    this.osc.stop(time + 0.5);
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
   * @param {Object<AudioContext>} context 
   */
  constructor(context) {
    this.context = context;
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
    const bufferSize = this.context.sampleRate;
    const buffer     = this.context.createBuffer(
      1, bufferSize, this.context.sampleRate
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
    this.noise        = this.context.createBufferSource();
    this.noise.buffer = this.noiseBuffer();

    // We set the cutoff frequency of the filter at 1000 Hz. This means noise
    // below 1000 Hz will be removed. We also need to shape the amplitude of
    // the noise burst using an envelope, as we did before with the snare drum.
    const noiseFilter = this.context.createBiquadFilter();
    noiseFilter.type  = 'highpass';
    noiseFilter.frequency.value = 1000;
    this.noise.connect(noiseFilter);

    this.noiseEnvelope = this.context.createGain();
    noiseFilter.connect(this.noiseEnvelope);
    this.noiseEnvelope.connect(this.context.destination);

    // A short burst of filtered noise on its own doesn’t create a very good
    // sounding snare. Adding a sharp “snap” to the front of the sound helps to
    // make the snare sound more percussive. We can achieve this using an
    // oscillator set to generate a triangle waveform, and again shape that
    // using a GainNode as an envelope.
    this.osc      = this.context.createOscillator();
    this.osc.type = 'triangle';

    this.oscEnvelope = this.context.createGain();
    this.osc.connect(this.oscEnvelope);
    this.oscEnvelope.connect(this.context.destination);
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
   * @param {Object<AudioContext>} context 
   */
  constructor(context) {
    this.context = context;
    this.buffer  = {};
    this.load();
  }

  async load() {
    const response = await axios({
      method      : 'get',
      url         : 'dist/samples/hihat.wav',
      responseType: 'arraybuffer',
    });
    this.buffer = this.context.decodeAudioData(response.data, audioBuffer => {
      this.buffer = audioBuffer;
    });
  }

  setup() {
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.context.destination);
  }

  trigger(time) {
    this.setup();
    this.source.start(time);
  }
}