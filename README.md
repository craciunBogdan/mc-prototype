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
