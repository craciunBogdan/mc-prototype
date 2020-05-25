# Mobile Computing Prototype

## Setup

In order to run this on mobile devices, you need to run it using TLS. Otherwise, `AudioContext` will not work.
One way of doing this is to use `live-server-https`. In order to set this up, follow these steps:
1. If you don't have `live-server` installed, run `npm install -g live-server`.
2. In the `mc-prototype` folder, run `npm install --save live-server-https`.
3. From the `mc-prototype` folder, run the server using `live-server --https=./node_modules/live-server-https`. This should launch a tab with the webpage on your default browser. If it complains about certificate that means it is working fine. Just continue to the page.
4. You can now also access the page and use all of its functionalities from a mobile device as long as they are connected to the same network as the machine that is running the server.

## Functionalities

As of right now, the prototype can do the following:
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

`MARK TONE` is defined equal to 2,000 Hz, which is also the minimum frequency recognised by the protocol, with the exception of the `SEPARATOR TONE` (more on that later). The maximum frequency recognised by the protocol is 20,000 Hz. If 2 consecutive `CONTENT TONES` have the same frequency, we insert a `SEPARATOR TONE` between them, which is the frequency representation of the value `-1`.

## How to use

In order to use the application you need 2 different devices, both of which must have a microphone and a speaker. We will call them `Device A` and `Device B`. We will transmit data from `Device A` to `Device B`.

1. Open the webpage of the application on both devices.
2. On `Device A`, select the type of data you want to transmit using the `Data type` field.
3. On `Device A`, enter the value you want to transmit in the `Value to transmit` field. Make sure to follow the format for each data type specified in the [Functionalities](#functionalities) section.
4. On `Device A`, press submit (or Enter).
5. On `Device B`, select the type of data you want to receive using the `Data type` field (this should be the same as the one on `Device A`).
6. On `Device B`, press submit (or Enter).
7. On `Device B`, press `Start Recording`.
8. On `Device A`, press `Start Audio Playback`.
9. Wait for `Device A` to shut up. Quick note: some frequencies are high enough that you might not hear them, so it would be safer to just give `Device A` a little time, even if it is quiet.
10. On `Device B`, press `Stop Recording`. You should (hopefully) see the value you wanted to transmit in the table above the `Start Recording` button.
11. On `Device A`, press `Stop Audio Playback`.