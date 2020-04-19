import {EventEmitter} from "../node_modules/djipevents/dist/djipevents.esm.min.js";
import {WebMidi} from "./WebMidi.js";

/**
 * The `OutputChannel` class represents a single output channel (1-16) from an output device. This
 * object is derived from the host's MIDI subsystem and cannot be instantiated directly.
 *
 * All 16 `OutputChannel` objects can be found inside the output's [channels]{@link Output#channels}
 * property.
 *
 * @param {Output} output The output this channel belongs to
 * @param {number} number The channel's number (1-16)
 */
export class OutputChannel extends EventEmitter {

  constructor(output, number) {

    super();

    /**
     * The {@link Output} this channel belongs to
     * @type {Output}
     */
    this.output = output;

    /**
     * The channel's number (1-16)
     * @type {number}
     */
    this.number = number;

  }

  /**
   * Sends a MIDI message at the scheduled timestamp. It is usually not necessary to use this method
   * directly as you can use one of the simpler helper methods such as `playNote()`, `stopNote()`,
   * `sendControlChange()`, etc.
   *
   * Details on the format of MIDI messages are available in the summary of
   * [MIDI messages]{@link https://www.midi.org/specifications/item/table-1-summary-of-midi-message}
   * from the MIDI Manufacturers Association.
   *
   * @param status {Number} The MIDI status byte of the message (128-255). This is a combination of
   * the command and the channel.
   *
   * @param [data=[]] {Array} An array of unsigned integers for the message. The number of data
   * bytes varies depending on the status byte. It is perfectly legal to send no data for some
   * message types (use `undefined` or an empty array in this case). Each byte must be between 0 and
   * 255.
   *
   * @param [timestamp=0] {number} The timestamp (DOMHighResTimeStamp) at which to send the message.
   * You can use [WebMidi.time]{@link WebMidi#time} to retrieve the current timestamp. To send
   * immediately, leave blank or use 0.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': The value at index 0 is greater
   * than 0xFF.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': The value at index 2 is greater
   * than 0xFF.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': Running status is not allowed at
   * index 2.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': Message is incomplete.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': Reserved status is not allowed at
   * index 0.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': System exclusive message is not
   * allowed at index 0.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': Unexpected end of system
   * exclusive message at index 0.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': Unexpected status byte at index
   * 1.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': Unexpected status byte at index
   * 2.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  send(status, data = [], timestamp) {
    this.output.send(status, data, timestamp);
    return this;
  }

  /**
   * Sends a MIDI **key aftertouch** message at the scheduled time. This is a key-specific
   * aftertouch. For a channel-wide aftertouch message, use
   * [setChannelAftertouch()]{@link Output#setChannelAftertouch}.
   *
   * @param note {number|string|Array}  The note for which you are sending an aftertouch value. The
   * notes can be specified in one of two ways. The first way is by using the MIDI note number (an
   * integer between 0 and 127). The second way is by using the note name followed by the octave
   * (C3, G#4, F-1, Db7). The octave range should be between -1 and 9. The lowest note is C-1 (MIDI
   * note number 0) and the highest note is G9 (MIDI note number 127). It is also possible to use
   * an array of note names and/or numbers.
   *
   * @param [pressure=0.5] {number} The pressure level (between 0 and 1). An invalid pressure value
   * will silently trigger the default behaviour. If the `useRawValue` option is set to `true`, the
   * pressure can be defined by using an integer between 0 and 127.
   *
   * @param {Object} [options={}]
   *
   * @param {boolean} [options.useRawValue=false] A boolean indicating whether the value should be
   * considered a float between 0 and 1.0 (default) or a raw integer between 0 and 127.
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @return {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setKeyAftertouch(note, pressure, options = {}) {

    // Validation
    pressure = parseFloat(pressure);
    if (isNaN(pressure)) pressure = 0.5;
    if (options.useRawValue) pressure = pressure / 127;
    if (pressure < 0 || pressure > 1) {
      throw new RangeError("Pressure value must be between 0 and 1.");
    }

    WebMidi.getValidNoteArray(note).forEach(n => {

      this.send(
        (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.keyaftertouch << 4) + (this.number - 1),
        [n.number, Math.round(pressure * 127)],
        WebMidi.convertToTimestamp(options.time)
      );

    });

    return this;

  }

  /**
   * Sends a MIDI **control change** message to the channel at the scheduled time. The control
   * change message to send can be specified numerically or by using one of the following common
   * names:
   *
   *  * `bankselectcoarse` (#0)
   *  * `modulationwheelcoarse` (#1)
   *  * `breathcontrollercoarse` (#2)
   *  * `footcontrollercoarse` (#4)
   *  * `portamentotimecoarse` (#5)
   *  * `dataentrycoarse` (#6)
   *  * `volumecoarse` (#7)
   *  * `balancecoarse` (#8)
   *  * `pancoarse` (#10)
   *  * `expressioncoarse` (#11)
   *  * `effectcontrol1coarse` (#12)
   *  * `effectcontrol2coarse` (#13)
   *  * `generalpurposeslider1` (#16)
   *  * `generalpurposeslider2` (#17)
   *  * `generalpurposeslider3` (#18)
   *  * `generalpurposeslider4` (#19)
   *  * `bankselectfine` (#32)
   *  * `modulationwheelfine` (#33)
   *  * `breathcontrollerfine` (#34)
   *  * `footcontrollerfine` (#36)
   *  * `portamentotimefine` (#37)
   *  * `dataentryfine` (#38)
   *  * `volumefine` (#39)
   *  * `balancefine` (#40)
   *  * `panfine` (#42)
   *  * `expressionfine` (#43)
   *  * `effectcontrol1fine` (#44)
   *  * `effectcontrol2fine` (#45)
   *  * `holdpedal` (#64)
   *  * `portamento` (#65)
   *  * `sustenutopedal` (#66)
   *  * `softpedal` (#67)
   *  * `legatopedal` (#68)
   *  * `hold2pedal` (#69)
   *  * `soundvariation` (#70)
   *  * `resonance` (#71)
   *  * `soundreleasetime` (#72)
   *  * `soundattacktime` (#73)
   *  * `brightness` (#74)
   *  * `soundcontrol6` (#75)
   *  * `soundcontrol7` (#76)
   *  * `soundcontrol8` (#77)
   *  * `soundcontrol9` (#78)
   *  * `soundcontrol10` (#79)
   *  * `generalpurposebutton1` (#80)
   *  * `generalpurposebutton2` (#81)
   *  * `generalpurposebutton3` (#82)
   *  * `generalpurposebutton4` (#83)
   *  * `reverblevel` (#91)
   *  * `tremololevel` (#92)
   *  * `choruslevel` (#93)
   *  * `celestelevel` (#94)
   *  * `phaserlevel` (#95)
   *  * `databuttonincrement` (#96)
   *  * `databuttondecrement` (#97)
   *  * `nonregisteredparametercoarse` (#98)
   *  * `nonregisteredparameterfine` (#99)
   *  * `registeredparametercoarse` (#100)
   *  * `registeredparameterfine` (#101)
   *
   * Note: as you can see above, not all control change message have a matching common name. This
   * does not mean you cannot use the others. It simply means you will need to use their number
   * instead of their name.
   *
   * To view a detailed list of all available **control change** messages, please consult "Table 3 -
   * Control Change Messages" from the [MIDI Messages](
   * https://www.midi.org/specifications/item/table-3-control-change-messages-data-bytes-2)
   * specification.
   *
   * @param {number|string} controller The MIDI controller name or number (0-119).
   *
   * @param {number} [value=0] The value to send (0-127).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} Controller numbers must be between 0 and 119.
   * @throws {RangeError} Invalid controller name.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  sendControlChange(controller, value, options = {}) {

    if (typeof controller === "string") {

      controller = WebMidi.MIDI_CONTROL_CHANGE_MESSAGES[controller];
      if (controller === undefined) throw new TypeError("Invalid controller name.");

    } else {

      controller = Math.floor(controller);
      if (!(controller >= 0 && controller <= 119)) {
        throw new RangeError("Controller numbers must be between 0 and 119.");
      }

    }

    this.send(
      (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.controlchange << 4) + (this.number - 1),
      [controller, value],
      WebMidi.convertToTimestamp(options.time)
    );

    return this;

  };

  /**
   * Selects a MIDI non-registered parameter so it is affected by data entry, data increment and
   * data decrement messages.
   *
   * @private
   *
   * @param parameter {number[]} A two-position array specifying the two control bytes (0x63, 0x62)
   * that identify the registered parameter.
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   */
  _selectNonRegisteredParameter(parameter, time) {

    parameter[0] = Math.floor(parameter[0]);
    if (!(parameter[0] >= 0 && parameter[0] <= 127)) {
      throw new RangeError("The control63 value must be between 0 and 127.");
    }

    parameter[1] = Math.floor(parameter[1]);
    if (!(parameter[1] >= 0 && parameter[1] <= 127)) {
      throw new RangeError("The control62 value must be between 0 and 127.");
    }

    this.sendControlChange(0x63, parameter[0], {time: time});
    this.sendControlChange(0x62, parameter[1], {time: time});

  };

  /**
   * Deselects the currently active MIDI registered parameter so it is no longer affected by data
   * entry, data increment and data decrement messages.
   *
   * Current best practice recommends doing that after each call to
   * [_setCurrentRegisteredParameter()]{@link Output#_setCurrentRegisteredParameter}.
   *
   * @private
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   */
  _deselectRegisteredParameter(time) {
    this.sendControlChange(0x65, 0x7F, {time: time});
    this.sendControlChange(0x64, 0x7F, {time: time});
  };

  /**
   * Selects a MIDI registered parameter so it is affected by data entry, data increment and data
   * decrement messages.
   *
   * @private
   *
   * @param parameter {Array} A two-position array specifying the two control bytes (0x65, 0x64)
   * that identify the registered parameter.
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   */
  _selectRegisteredParameter(parameter, time) {

    parameter[0] = Math.floor(parameter[0]);
    if (!(parameter[0] >= 0 && parameter[0] <= 127)) {
      throw new RangeError("The control65 value must be between 0 and 127");
    }

    parameter[1] = Math.floor(parameter[1]);
    if (!(parameter[1] >= 0 && parameter[1] <= 127)) {
      throw new RangeError("The control64 value must be between 0 and 127");
    }

    this.sendControlChange(0x65, parameter[0], {time: time});
    this.sendControlChange(0x64, parameter[1], {time: time});

  };

  /**
   * Sets the value of the currently selected MIDI registered parameter.
   *
   * @private
   *
   * @param data {number|number[]}
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   */
  _setCurrentRegisteredParameter(data, time) {

    data = [].concat(data);

    // MSB
    data[0] = parseInt(data[0]);
    if (!isNaN(data[0]) && data[0] >= 0 && data[0] <= 127) {
      this.sendControlChange(0x06, data[0], {time: time});
    } else {
      throw new RangeError("The msb value must be between 0 and 127.");
    }

    if (data.length < 2) return this;

    // LSB
    data[1] = parseInt(data[1]);

    if (!isNaN(data[1]) && data[1] >= 0 && data[1] <= 127) {
      this.sendControlChange(0x26, data[1], {time: time});
    } else {
      throw new RangeError("The lsb value must be between 0 and 127.");
    }

  }

  /**
   * Decrements the specified MIDI registered parameter by 1. Here is the full list of parameter
   * names that can be used with this function:
   *
   *  * Pitchbend Range (0x00, 0x00): `"pitchbendrange"`
   *  * Channel Fine Tuning (0x00, 0x01): `"channelfinetuning"`
   *  * Channel Coarse Tuning (0x00, 0x02): `"channelcoarsetuning"`
   *  * Tuning Program (0x00, 0x03): `"tuningprogram"`
   *  * Tuning Bank (0x00, 0x04): `"tuningbank"`
   *  * Modulation Range (0x00, 0x05): `"modulationrange"`
   *  * Azimuth Angle (0x3D, 0x00): `"azimuthangle"`
   *  * Elevation Angle (0x3D, 0x01): `"elevationangle"`
   *  * Gain (0x3D, 0x02): `"gain"`
   *  * Distance Ratio (0x3D, 0x03): `"distanceratio"`
   *  * Maximum Distance (0x3D, 0x04): `"maximumdistance"`
   *  * Maximum Distance Gain (0x3D, 0x05): `"maximumdistancegain"`
   *  * Reference Distance Ratio (0x3D, 0x06): `"referencedistanceratio"`
   *  * Pan Spread Angle (0x3D, 0x07): `"panspreadangle"`
   *  * Roll Angle (0x3D, 0x08): `"rollangle"`
   *
   * @param parameter {String|number[]} A string identifying the parameter's name (see above) or a
   * two-position array specifying the two control bytes (0x65, 0x64) that identify the registered
   * parameter.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws TypeError The specified parameter is not available.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  decrementRegisteredParameter(parameter, options = {}) {

    if (!Array.isArray(parameter)) {
      if (!WebMidi.MIDI_REGISTERED_PARAMETER[parameter]) {
        throw new TypeError("The specified parameter is not available.");
      }
      parameter = WebMidi.MIDI_REGISTERED_PARAMETER[parameter];
    }

    this._selectRegisteredParameter(parameter, this.number, options.time);
    this.sendControlChange(0x61, 0, this.number, {time: options.time});
    this._deselectRegisteredParameter(options.time);

    return this;

  };

  /**
   * Increments the specified MIDI registered parameter by 1. Here is the full list of parameter
   * names that can be used with this function:
   *
   *  * Pitchbend Range (0x00, 0x00): `"pitchbendrange"`
   *  * Channel Fine Tuning (0x00, 0x01): `"channelfinetuning"`
   *  * Channel Coarse Tuning (0x00, 0x02): `"channelcoarsetuning"`
   *  * Tuning Program (0x00, 0x03): `"tuningprogram"`
   *  * Tuning Bank (0x00, 0x04): `"tuningbank"`
   *  * Modulation Range (0x00, 0x05): `"modulationrange"`
   *  * Azimuth Angle (0x3D, 0x00): `"azimuthangle"`
   *  * Elevation Angle (0x3D, 0x01): `"elevationangle"`
   *  * Gain (0x3D, 0x02): `"gain"`
   *  * Distance Ratio (0x3D, 0x03): `"distanceratio"`
   *  * Maximum Distance (0x3D, 0x04): `"maximumdistance"`
   *  * Maximum Distance Gain (0x3D, 0x05): `"maximumdistancegain"`
   *  * Reference Distance Ratio (0x3D, 0x06): `"referencedistanceratio"`
   *  * Pan Spread Angle (0x3D, 0x07): `"panspreadangle"`
   *  * Roll Angle (0x3D, 0x08): `"rollangle"`
   *
   * @param parameter {String|number[]} A string identifying the parameter's name (see above) or a
   * two-position array specifying the two control bytes (0x65, 0x64) that identify the registered
   * parameter.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws Error The specified parameter is not available.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  incrementRegisteredParameter(parameter, options = {}) {

    if (!Array.isArray(parameter)) {
      if (!WebMidi.MIDI_REGISTERED_PARAMETER[parameter]) {
        throw new Error("The specified parameter is not available.");
      }
      parameter = WebMidi.MIDI_REGISTERED_PARAMETER[parameter];
    }

    this._selectRegisteredParameter(parameter, options.time);
    this.sendControlChange(0x60, 0, {time: options.time});
    this._deselectRegisteredParameter(options.time);

    return this;

  }

  /**
   * Plays a note or an array of notes on the channel. The first parameter is the note to play. It
   * can be a single value or an array of the following valid values:
   *
   *  - A MIDI note number (integer between `0` and `127`)
   *  - A note name, followed by the octave (e.g. `"C3"`, `"G#4"`, `"F-1"`, `"Db7"`)
   *  - A {@link Note} object
   *
   * The `playNote()` method sends a **note on** MIDI message for all specified notes on all
   * specified channels. If a `duration` is set in the `options` parameter or in the {@link Note}
   * object's [duration]{@link Note#duration} property, it will also schedule a **note off** message
   * to end the note after said duration. If no `duration` is set, the note will simply play until
   * a matching **note off** message is sent with [stopNote()]{@link OutputChannel#stopNote} or
   * [sendNoteOff()]{@link OutputChannel#sendNoteOff}.
   *
   *  The execution of the **note on** command can be delayed by using the `time` property of the
   * `options` parameter.
   *
   * When using {@link Note} objects, the durations and velocities defined in the {@link Note}
   * objects have precedence over the ones specified via the method's `options` parameter.
   *
   * **Note**: As per the MIDI standard, a **note on** message with an attack velocity of `0` is
   * functionally equivalent to a **note off** message.
   *
   * @param note {number|string|Note|number[]|string[]|Note[]} The note(s) to play. The notes can be
   * specified by using a MIDI note number (0-127), a note name (e.g. C3, G#4, F-1, Db7), a
   * {@link Note} object or an array of the previous types. When using a note name, octave range
   * must be between -1 and 9. The lowest note is C-1 (MIDI note number 0) and the highest
   * note is G9 (MIDI note number 127).
   *
   * @param {Object} [options={}]
   *
   * @param {number} [options.duration=undefined] The number of milliseconds (integer) after which a
   * **note off** message will be scheduled. If left undefined, only a **note on** message is sent.
   *
   * @param {number} [options.attack=0.5] The velocity at which to play the note (between `0` and
   * `1`). If the `rawAttack` option is also defined, it will have priority. An invalid velocity
   * value will silently trigger the default of `0.5`.
   *
   * @param {number} [options.rawAttack=0.5] The attack velocity at which to play the note (between
   * `0` and `127`). This has priority over the `attack` property. An invalid velocity value will
   * silently trigger the default of `0.5`.
   *
   * @param {number} [options.release=0.5] The velocity at which to release the note (between `0`
   * and `1`). If the `rawRelease` option is also defined, it will have priority. An invalid
   * velocity value will silently trigger the default of `0.5`. This is only used with the
   * **note off** event triggered when `options.duration` is set.
   *
   * @param {number} [options.rawRelease=0.5] The velocity at which to release the note (between `0`
   * and `127`). This has priority over the `release` property. An invalid velocity value will
   * silently trigger the default of `0.5`. This is only used with the **note off** event triggered
   * when `options.duration` is set.
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  playNote(note, options = {}) {

    // Send note on message and, optionally, note off message
    this.sendNoteOn(note, options);
    if (!isNaN(options.duration)) this.sendNoteOff(note, options);

    return this;

  }

  /**
   * Sends a **note off** message for the specified notes on the channel. The first parameter is the
   * note. It can be a single value or an array of the following valid values:
   *
   *  - A MIDI note number (integer between `0` and `127`)
   *  - A note name, followed by the octave (e.g. `"C3"`, `"G#4"`, `"F-1"`, `"Db7"`)
   *  - A {@link Note} object
   *
   *  The execution of the **note off** command can be delayed by using the `time` property of the
   * `options` parameter.
   *
   * When using {@link Note} objects, the release velocity defined in the {@link Note} objects has
   * precedence over the one specified via the method's `options` parameter.
   *
   * @param note {number|string|Note|number[]|string[]|Note[]} The note(s) to stop. The notes can be
   * specified by using a MIDI note number (0-127), a note name (e.g. C3, G#4, F-1, Db7), a
   * {@link Note} object or an array of the previous types. When using a note name, octave range
   * must be between -1 and 9. The lowest note is C-1 (MIDI note number 0) and the highest
   * note is G9 (MIDI note number 127).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @param {number} [options.release=0.5] The velocity at which to release the note
   * (between `0` and `1`).  If the `rawRelease` option is also defined, `rawRelease` will have
   * priority. An invalid velocity value will silently trigger the default of `0.5`.
   *
   * @param {number} [options.rawRelease=0.5] The velocity at which to release the note
   * (between `0` and `127`). If the `release` option is also defined, `rawRelease` will have
   * priority. An invalid velocity value will silently trigger the default of `64`.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  sendNoteOff(note, options) {

    // Compatibility warning
    if (options.rawVelocity) {
      options.rawRelease = options.velocity;
      console.warn(
        "The 'rawVelocity' option is deprecated. Use 'rawRelease' instead."
      );
    }
    if (options.velocity) {
      options.release = options.velocity;
      console.warn("The 'velocity' option is deprecated. Use 'attack' instead.");
    }

    let nVelocity = 64;

    options = options || {};

    if (options.rawRelease) {
      if (
        !isNaN(options.rawRelease) &&
        options.rawRelease >= 0
        && options.rawRelease <= 127
      ) {
        nVelocity = options.rawRelease;
      }
    } else {
      if (
        !isNaN(options.release) &&
        options.release >= 0 &&
        options.release <= 1
      ) {
        nVelocity = options.release * 127;
      }
    }

    // Send note off messages
    let o = {rawRelease: nVelocity};

    WebMidi.getValidNoteArray(note, o).forEach(n => {
      this.send(
        (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.noteoff << 4) + (this.number - 1),
        [n.number, n.rawRelease],
        WebMidi.convertToTimestamp(options.time)
      );
    });

    return this;

  }

  /**
   * This is an alias to the [sendNoteOff()]{@link OutputChannel#sendNoteOff} method.
   *
   * @see {@link OutputChannel#sendNoteOff}
   *
   * @param note
   * @param options
   * @returns {Output}
   */
  stopNote(note, options) {
    return this.sendNoteOff(note, options);
  }

  /**
   * Sends a **note on** message for the specified notes on the channel. The first parameter is the
   * note. It can be a single value or an array of the following valid values:
   *
   *  - A MIDI note number (integer between `0` and `127`)
   *  - A note name, followed by the octave (e.g. `"C3"`, `"G#4"`, `"F-1"`, `"Db7"`)
   *  - A {@link Note} object
   *
   *  The execution of the **note on** command can be delayed by using the `time` property of the
   * `options` parameter.
   *
   * When using {@link Note} objects, the attack velocity defined in the {@link Note} objects has
   * precedence over the one specified via the method's `options` parameter. Also, the `duration` is
   * ignored. If you want to also send a **note off** message, use the
   * [playNote()]{@link Output#playNote} method instead.
   *
   * **Note**: As per the MIDI standard, a **note on** message with an attack velocity of `0` is
   * functionally equivalent to a **note off** message.
   *
   * @param note {number|string|Note|number[]|string[]|Note[]} The note(s) to play. The notes can be
   * specified by using a MIDI note number (0-127), a note name (e.g. C3, G#4, F-1, Db7), a
   * {@link Note} object or an array of the previous types. When using a note name, octave range
   * must be between -1 and 9. The lowest note is C-1 (MIDI note number 0) and the highest
   * note is G9 (MIDI note number 127).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @param {number} [options.attack=0.5] The velocity at which to play the note (between `0` and
   * `1`).  If the `rawAttack` option is also defined, `rawAttack` will have priority. An invalid
   * velocity value will silently trigger the default of `0.5`.
   *
   * @param {number} [options.rawAttack=0.5] The velocity at which to release the note (between `0`
   * and `127`). If the `attack` option is also defined, `rawAttack` will have priority. An invalid
   * velocity value will silently trigger the default of `64`.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  sendNoteOn(note, options = {}) {

    // Compatibility warnings
    if (options.rawVelocity) {
      options.rawAttack = options.velocity;
      options.rawRelease = options.release;
      console.warn(
        "The 'rawVelocity' option is deprecated. Use 'rawAttack' or 'rawRelease' instead."
      );
    }
    if (options.velocity) {
      options.attack = options.velocity;
      console.warn("The 'velocity' option is deprecated. Use 'attack' instead.");
    }

    let nVelocity = 64;

    if (options.rawAttack) {
      if (
        !isNaN(options.attack) &&
        options.attack >= 0 &&
        options.attack <= 127
      ) {
        nVelocity = options.attack;
      }
    } else {
      if (
        !isNaN(options.attack) &&
        options.attack >= 0 &&
        options.attack <= 1
      ) {
        nVelocity = options.attack * 127;
      }
    }

    let o = {rawAttack: nVelocity};

    WebMidi.getValidNoteArray(note, o).forEach(n => {
      this.send(
        (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.noteon << 4) + (this.number - 1),
        [n.number, n.rawAttack],
        WebMidi.convertToTimestamp(options.time)
      );
    });

    return this;

  }

  /**
   * Sends a MIDI **channel mode** message. The channel mode message to send can be specified
   * numerically or by using one of the following common names:
   *
   *   * `"allsoundoff"` (#120)
   *   * `"resetallcontrollers"` (#121)
   *   * `"localcontrol"` (#122)
   *   * `"allnotesoff"` (#123)
   *   * `"omnimodeoff"` (#124)
   *   * `"omnimodeon"` (#125)
   *   * `"monomodeon"` (#126)
   *   * `"polymodeon"` (#127)
   *
   * It should be noted that, per the MIDI specification, only `localcontrol` and `monomodeon` may
   * require a value that's not zero. For that reason, the `value` parameter is optional and
   * defaults to 0.
   *
   * To make it easier, all channel mode messages have a matching helper method:
   *
   *   - [turnSoundOff()]{@link Output#turnSoundOff}
   *   - [resetAllControllers()]{@link Output#resetAllControllers}
   *   - [setLocalControl()]{@link Output#turnSoundOff}
   *   - [turnNotesOff()]{@link Output#turnNotesOff}
   *   - [setOmniMode()]{@link Output#setOmniMode}
   *   - [setPolyphonicMode()]{@link Output#setPolyphonicMode}
   *
   * @param command {number|string} The numerical identifier of the channel mode message (integer
   * between 120-127) or its name as a string.
   *
   * @param [value] {number} The value to send (integer between 0-127).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {TypeError} Invalid channel mode message name.
   * @throws {RangeError} Channel mode controller numbers must be between 120 and 127.
   * @throws {RangeError} Value must be an integer between 0 and 127.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  sendChannelMode(command, value, options = {}) {

    if (typeof command === "string") {
      command = WebMidi.MIDI_CHANNEL_MODE_MESSAGES[command];
    } else {
      command = parseInt(command);
    }

    if (isNaN(command) || !(command >= 120 && command <= 127)) {
      throw new TypeError("Invalid channel mode message name or number.");
    }

    value = parseInt(value) || 0;

    if (value < 0 || value > 127) {
      throw new RangeError("Value must be an integer between 0 and 127.");
    }

    this.send(
      (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.channelmode << 4) + (this.number - 1),
      [command, value],
      WebMidi.convertToTimestamp(options.time)
    );

    return this;

  }

  /**
   * Sets OMNI mode to `"on"` or `"off"`. MIDI's OMNI mode causes the instrument to respond to
   * messages from all channels.
   *
   * It should be noted that support for OMNI mode is not as common as it used to be.
   *
   * @param [state=true] {boolean} Whether to activate OMNI mode (`true`) or not (`false`).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {TypeError} Invalid channel mode message name.
   * @throws {RangeError} Channel mode controller numbers must be between 120 and 127.
   * @throws {RangeError} Value must be an integer between 0 and 127.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setOmniMode(state, options = {}) {

    if (state === undefined || state) {
      this.sendChannelMode("omnimodeon", 0, options);
    } else {
      this.sendChannelMode("omnimodeoff", 0, options);
    }

    return this;

  }

  /**
   * Sends a MIDI **channel aftertouch** message. For key-specific aftertouch, you should instead
   * use [setKeyAftertouch()]{@link Output#setKeyAftertouch}.
   *
   * @param [pressure=0.5] {number} The pressure level (between 0 and 1). An invalid pressure value
   * will silently trigger the default behaviour. If the `rawValue` option is set to `true`, the
   * pressure can be defined by using an integer between 0 and 127.
   *
   * @param {Object} [options={}]
   *
   * @param {boolean} [options.rawValue=false] A boolean indicating whether the value should be
   * considered a float between 0 and 1.0 (default) or a raw integer between 0 and 127.
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setChannelAftertouch(pressure, options = {}) {

    // Validation
    pressure = parseFloat(pressure);
    if (isNaN(pressure)) pressure = 0.5;
    if (options.rawValue) pressure = pressure / 127;
    if (pressure < 0 || pressure > 1) {
      throw new RangeError("Pitch bend value must be between 0 and 1.");
    }

    this.send(
      (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.channelaftertouch << 4) + (this.number - 1),
      [Math.round(pressure * 127)],
      WebMidi.convertToTimestamp(options.time)
    );

    return this;

  }

  /**
   * Sends a **master tuning** message. The value is decimal and must be larger than -65 semitones
   * and smaller than 64 semitones.
   *
   * Because of the way the MIDI specification works, the decimal portion of the value will be
   * encoded with a resolution of 14bit. The integer portion must be between -64 and 63
   * inclusively. This function actually generates two MIDI messages: a **Master Coarse Tuning** and
   * a **Master Fine Tuning** RPN messages.
   *
   * @param [value=0.0] {number} The desired decimal adjustment value in semitones (-65 < x < 64)
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} The value must be a decimal number between larger than -65 and smaller
   * than 64.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setMasterTuning(value, options = {}) {

    value = parseFloat(value) || 0.0;

    if (value <= -65 || value >= 64) {
      throw new RangeError(
        "The value must be a decimal number larger than -65 and smaller than 64."
      );
    }

    let coarse = Math.floor(value) + 64;
    let fine = value - Math.floor(value);

    // Calculate MSB and LSB for fine adjustment (14bit resolution)
    fine = Math.round((fine + 1) / 2 * 16383);
    let msb = (fine >> 7) & 0x7F;
    let lsb = fine & 0x7F;

    this.setRegisteredParameter("channelcoarsetuning", coarse, {time: options.time});
    this.setRegisteredParameter("channelfinetuning", [msb, lsb], {time: options.time});

    return this;

  }

  /**
   * Sends a **modulation depth range** message to adjust the depth of the modulation wheel's range.
   * The range can be specified with the `semitones` parameter, the `cents` parameter or by
   * specifying both parameters at the same time.
   *
   * @param [semitones=0] {number} The desired adjustment value in semitones (integer between
   * 0 and 127).
   *
   * @param [cents=0] {number} The desired adjustment value in cents (integer between 0 and 127).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} The msb value must be between 0 and 127
   * @throws {RangeError} The lsb value must be between 0 and 127
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setModulationRange(semitones, cents, options = {}) {

    this.setRegisteredParameter(
      "modulationrange", [semitones, cents], {time: options.time}
    );

    return this;

  }

  /**
   * Sets a non-registered parameter (NRPN) to the specified value. The NRPN is selected by passing
   * in a two-position array specifying the values of the two control bytes. The value is specified
   * by passing in a single integer (most cases) or an array of two integers.
   *
   * NRPNs are not standardized in any way. Each manufacturer is free to implement them any way
   * they see fit. For example, according to the Roland GS specification, you can control the
   * **vibrato rate** using NRPN (1, 8). Therefore, to set the **vibrato rate** value to **123** you
   * would use:
   *
   * ```js
   * WebMidi.outputs[0].channels[0].setNonRegisteredParameter([1, 8], 123);
   * ```
   *
   * In some rarer cases, you need to send two values with your NRPN messages. In such cases, you
   * would use a 2-position array. For example, for its **ClockBPM** parameter (2, 63), Novation
   * uses a 14-bit value that combines an MSB and an LSB (7-bit values). So, for example, if the
   * value to send was 10, you could use:
   *
   * ```js
   * WebMidi.outputs[0].channels[0].setNonRegisteredParameter([2, 63], [0, 10]);
   * ```
   *
   * For further implementation details, refer to the manufacturer's documentation.
   *
   * @param parameter {number[]} A two-position array specifying the two control bytes (0x63,
   * 0x62) that identify the non-registered parameter.
   *
   * @param [data=[]] {number|number[]} An integer or an array of integers with a length of 1 or 2
   * specifying the desired data.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} The control value must be between 0 and 127.
   * @throws {RangeError} The msb value must be between 0 and 127
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setNonRegisteredParameter(parameter, data, options = {}) {

    data = [].concat(data);

    this._selectNonRegisteredParameter(parameter, this.number, options.time);
    this._setCurrentRegisteredParameter(data, this.number, options.time);
    this._deselectRegisteredParameter(options.time);

    return this;

  }

  /**
   * Sends a MIDI **pitch bend** message at the scheduled time.
   *
   * @param value {number} The intensity level of the bend (between -1.0 and 1.0). A value of zero
   * means no bend. If the `rawValue` option is set to `true`, the intensity can be defined by using
   * an integer between 0 and 127. In this case, a value of 64 means no bend.
   *
   * @param {Object} [options={}]
   *
   * @param {boolean} [options.rawValue=false] A boolean indicating whether the value should be
   * considered as a float between -1.0 and 1.0 (default) or as raw integer between 0 and 127.
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} Pitch bend value must be between -1.0 and 1.0.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setPitchBend(value, options = {}) {

    // Validation
    value = parseFloat(value);
    if (isNaN(value)) value = 0;
    if (options.rawValue) value = value / 127 * 2 - 1;
    if (value < -1 || value > 1) {
      throw new RangeError("Pitch bend value must be between -1.0 and 1.0.");
    }

    let nLevel = Math.round((value + 1) / 2 * 16383);
    let msb = (nLevel >> 7) & 0x7F;
    let lsb = nLevel & 0x7F;

    this.send(
      (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.pitchbend << 4) + (this.number - 1),
      [lsb, msb],
      WebMidi.convertToTimestamp(options.time)
    );

    return this;

  }

  /**
   * Sends a pitch bend range message at the scheduled time so that the instrument adjusts the range
   * of its pitch bend lever. The range can be specified with the `semitones` parameter (msb), the
   * `cents` parameter (lsb) or by specifying both parameters at the same time.
   *
   * @param semitones {number} The desired adjustment value in semitones (integer between 0-127).
   * While nothing imposes that in the specification, it is very common for manufacturers to limit
   * the range to 2 octaves (-12 semitones to 12 semitones).
   *
   * @param [cents=0] {number} The desired adjustment value in cents (integer between 0-127).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} The msb value must be between 0 and 127.
   * @throws {RangeError} The lsb value must be between 0 and 127.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setPitchBendRange(semitones, cents, options = {}) {

    this.setRegisteredParameter(
      "pitchbendrange", [semitones, cents], {time: options.time}
    );

    return this;

  }

  /**
   * Sends a MIDI **program change** message at the scheduled time.
   *
   * **Note**: since version 3.0, the program number is an integer between 1 and 128. In versions
   * 1.0 and 2.0, the number was between 0 and 127. This change aligns WebMidi.js with most devices
   * that use a numbering scheme starting at 1.
   *
   * @param [program=1] {number} The MIDI patch (program) number (1-128)
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {TypeError} Failed to execute 'send' on 'MIDIOutput': The value at index 1 is greater
   * than 0xFF.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   *
   */
  setProgram(program, options = {}) {

    program = parseFloat(program) - 1;

    this.send(
      (WebMidi.MIDI_CHANNEL_VOICE_MESSAGES.programchange << 4) + (this.number - 1),
      [program],
      WebMidi.convertToTimestamp(options.time)
    );

    return this;

  }

  /**
   * Sets the specified MIDI registered parameter to the desired value. The value is defined with
   * up to two bytes of data (msb, lsb) that each can go from 0 to 127.
   *
   * MIDI
   * [registered parameters]
   * (https://www.midi.org/specifications-old/item/table-3-control-change-messages-data-bytes-2)
   * extend the original list of control change messages. The MIDI 1.0 specification lists only a
   * limited number of them. Here are the original registered parameters with the identifier that
   * can be used as the first parameter of this function:
   *
   *  * Pitchbend Range (0x00, 0x00): `"pitchbendrange"`
   *  * Channel Fine Tuning (0x00, 0x01): `"channelfinetuning"`
   *  * Channel Coarse Tuning (0x00, 0x02): `"channelcoarsetuning"`
   *  * Tuning Program (0x00, 0x03): `"tuningprogram"`
   *  * Tuning Bank (0x00, 0x04): `"tuningbank"`
   *  * Modulation Range (0x00, 0x05): `"modulationrange"`
   *
   * Note that the **Tuning Program** and **Tuning Bank** parameters are part of the *MIDI Tuning
   * Standard*, which is not widely implemented.
   *
   * Another set of extra parameters have been later added for 3D sound controllers. They are:
   *
   *  * Azimuth Angle (0x3D, 0x00): `"azimuthangle"`
   *  * Elevation Angle (0x3D, 0x01): `"elevationangle"`
   *  * Gain (0x3D, 0x02): `"gain"`
   *  * Distance Ratio (0x3D, 0x03): `"distanceratio"`
   *  * Maximum Distance (0x3D, 0x04): `"maximumdistance"`
   *  * Maximum Distance Gain (0x3D, 0x05): `"maximumdistancegain"`
   *  * Reference Distance Ratio (0x3D, 0x06): `"referencedistanceratio"`
   *  * Pan Spread Angle (0x3D, 0x07): `"panspreadangle"`
   *  * Roll Angle (0x3D, 0x08): `"rollangle"`
   *
   * @param parameter {string|number[]} A string identifying the parameter's name (see above) or a
   * two-position array specifying the two control bytes (e.g. `[0x65, 0x64]`) that identify the
   * registered parameter.
   *
   * @param [data=[]] {number|number[]} An single integer or an array of integers with a maximum
   * length of 2 specifying the desired data.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setRegisteredParameter(parameter, data, options = {}) {

    if (!Array.isArray(parameter)) {
      if (!WebMidi.MIDI_REGISTERED_PARAMETER[parameter]) {
        throw new Error("The specified parameter is not available.");
      }
      parameter = WebMidi.MIDI_REGISTERED_PARAMETER[parameter];
    }

    this._selectRegisteredParameter(parameter, this.number, options.time);
    this._setCurrentRegisteredParameter(data, this.number, options.time);
    this._deselectRegisteredParameter(options.time);

    return this;

  }

  /**
   * Sets the MIDI tuning bank to use. Note that the **Tuning Bank** parameter is part of the
   * *MIDI Tuning Standard*, which is not widely implemented.
   *
   * **Note**: since version 3.0, the bank number is an integer between 1 and 128. In versions
   * 1.0 and 2.0, the number was between 0 and 127. This change aligns WebMidi.js with most devices
   * that use a numbering scheme starting at 1.
   *
   * @param value {number} The desired tuning bank (1-128).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} The bank value must be between 1 and 128.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setTuningBank(value, options = {}) {

    value = parseInt(value);
    if (isNaN(value) || !(value >= 1 && value <= 128)) {
      throw new RangeError("The program value must be between 1 and 128.");
    }

    this.setRegisteredParameter("tuningbank", value - 1, this.number, {time: options.time});

    return this;

  }

  /**
   * Sets the MIDI tuning program to use. Note that the **Tuning Program** parameter is part of the
   * *MIDI Tuning Standard*, which is not widely implemented.
   *
   * **Note**: since version 3.0, the program number is an integer between 1 and 128. In versions
   * 1.0 and 2.0, the number was between 0 and 127. This change aligns WebMidi.js with most devices
   * that use a numbering scheme starting at 1.
   *
   * @param value {number} The desired tuning program (1-128).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @throws {RangeError} The program value must be between 1 and 128.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setTuningProgram(value, options = {}) {

    value = parseInt(value);
    if (isNaN(value) || !(value >= 1 && value <= 128)) {
      throw new RangeError("The program value must be between 1 and 128.");
    }

    this.setRegisteredParameter("tuningprogram", value - 1, this.number, {time: options.time});

    return this;

  }

  /**
   * Turns local control on or off. Local control is usually enabled by default. If you disable it,
   * the instrument will no longer trigger its own sounds. It will only send the MIDI messages to
   * its out port.
   *
   * @param [state=false] {boolean} Whether to activate local control (`true`) or disable it
   * (`false`).
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setLocalControl(state, options = {}) {
    if (state) {
      return this.sendChannelMode("localcontrol", 127, options);
    } else {
      return this.sendChannelMode("localcontrol", 0, options);
    }
  }

  /**
   * Sends an **all notes off** channel mode message. This will turn all currently playing notes
   * off. However, this does not prevent new notes from being played.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  turnNotesOff(options = {}) {
    return this.sendChannelMode("allnotesoff", 0, options);
  }

  /**
   * Sends an **all sound off** channel mode message. This will silence all sounds playing on that
   * channel but will not prevent new sounds from being triggered.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  turnSoundOff(options = {}) {
    return this.sendChannelMode("allsoundoff", 0, options);
  }

  /**
   * Sends a **reset all controllers** channel mode message. This resets all controllers, such as
   * the pitch bend, to their default value.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  resetAllControllers(options = {}) {
    return this.sendChannelMode("resetallcontrollers", 0, options);
  }

  /**
   * Sets the polyphonic mode. In `"poly"` mode (usually the default), multiple notes can be played
   * and heard at the same time. In `"mono"` mode, only one note will be heard at once even if
   * multiple notes are being played.
   *
   * @param {string} [mode=poly] The mode to use: `"mono"` or `"poly"`.
   *
   * @param {Object} [options={}]
   *
   * @param {number|string} [options.time] If `time` is a string prefixed with `"+"` and followed by
   * a number, the message will be delayed by that many milliseconds. If the value is a number
   * (DOMHighResTimeStamp), the operation will be scheduled for that time. If `time` is omitted, or
   * in the past, the operation will be carried out as soon as possible.
   *
   * @returns {OutputChannel} Returns the `OutputChannel` object so methods can be chained.
   */
  setPolyphonicMode(mode, options = {}) {
    if (mode === "mono") {
      return this.sendChannelMode("monomodeon", 0, options);
    } else {
      return this.sendChannelMode("polymodeon", 0, options);
    }
  }

}
