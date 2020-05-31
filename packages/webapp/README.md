# Mobile Computing Prototype

## Setup

Run `npm install` before running the project.
This will ensure you have all the dependencies to enjoy the app.

## Running

### Desktop only
Run `npm start`.
This will start the react app on [localhost:3000](http://localhost:3000).

### Mobile + Desktop
In order to run this on mobile devices, you need to run it using TLS.
Otherwise, `AudioContext` will not work.
Running the server on HTTPS with react is pretty easy.

Run `npm run start:https` or `($env:HTTPS = "true") -and (npm start)` if you're on Powershell, and you're set!

## Functionalities

As of right now, the prototype can do the following:
* Request a value of a certain type from another device.
* Transmit a value through audio. This value can be of one of the following types: `Color`, `Integer` or `String`.
* Receive a value through audio of one of the types listed above.

The values for each data type have the following format:

1. Color: 3 values, separated by commas, in the range [0, 255]. These represent the RGB value of the color. Example: `255, 0, 255`.
2. Integer: 1 value, representing the integer. At most 4,294,967,295 (I think, I haven't tested it actually). Example: `90055000`
3. String: 1 value, a string. Example: `Hello`

## Protocol

We are using the following protocol:

    MARK TONE
    CONTENT TONE
    CONTENT TONE
    CONTENT TONE
    MARK TONE

`MARK TONE` can be of 2 types: `REQUEST MARK TONE`, with the frequency representation of the value `-2`, and `RESPONSE MARK TONE`, with the frequency representation of the value `16`. The maximum frequency recognised by the protocol is 4,960 Hz, while the minimum frequency recognised is 1,739 Hz. If 2 consecutive `CONTENT TONES` have the same frequency, we insert a `SEPARATOR TONE` between them, which is the frequency representation of the value `-1`.

A `CONTENT TONE` contains half a byte of information (which is apparently called a [nibble](https://en.wikipedia.org/wiki/Units_of_information#Nibble)).

## How to use

In order to use the application you need 2 different devices, both of which must have a microphone and a speaker. We will call them `Device A` and `Device B`. We will transmit data from `Device A` to `Device B`.

1. Open the webpage of the application on both devices.
2. On `Device B`, press the button corresponding to the type of data you want to request.
3. On `Device A`, press `Start Recording`.
4. On `Device B`, press `Start Audio Playback`.
5. Once `Device B` shuts up, press `Stop Recording` on `Device A`. Hopefully, now `Device A` will know what type of data `Device B` wants and will set this type automatically in the `Data type` field.
6. On `Device A`, enter the value you want to transmit in the `Value to transmit` field. Make sure to follow the format for each data type specified in the [Functionalities](#functionalities) section.
7. On `Device A`, press submit (or Enter).
8. On `Device B`, press `Start Recording`.
9. On `Device A`, press `Start Audio Playback`.
10. Wait for `Device A` to shut up.
11. On `Device B`, press `Stop Recording`. You should (hopefully) see the value you wanted to transmit in the table above the `Start Recording` button.