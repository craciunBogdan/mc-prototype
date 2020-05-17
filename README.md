# Mobile Computing Prototype
In order to run this on mobile devices, you need to run it using TLS. Otherwise, `AudioContext` will not work.
One way of doing this is to use `live-server-https`. In order to set this up, follow these steps:
1. If you don't have `live-server` installed, run `npm install -g live-server`.
2. In the `mc-prototype` folder, run `npm install --save live-server-https`.
3. From the `mc-prototype` folder, run the server using `live-server --https=./node_modules/live-server-https`. This should launch a tab with the webpage on your default browser. If it complains about certificate that means it is working fine. Just continue to the page.
4. You can now also access the page and use all of its functionalities from a mobile device as long as they are connected to the same network as the machine that is running the server.

As of right now, the prototype can only do the following:
* Play a series of specified frequencies for a specified duration
* Record a series of sounds and see what frequencies were played and for what duration (There is some leeway when it comes to what frequencies are the same. As long as there is a 50 Hz difference between 2 frequencies, they are considered one and the same).
* Record the currently loudest frequency (kinda)
* Receive a color through audio, decode it and turn the background of the page to that color. (Right now, it's buggy and generally pretty bad, but it kinda works)

For now, we are only able to transmit a color as data. We are using the following protocol:

    START TONE
    CONTENT TONE
    CONTENT TONE
    CONTENT TONE
    END TONE

BOTH `START TONE` and `END TONE` are 1000 Hz in frequency. `CONTENT TONE` splits the range [1100 Hz, 24000 Hz] into 256 sub-ranges, each representing 1 byte, forming in this way a 3 byte hex code representing a color.