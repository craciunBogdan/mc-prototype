# Mobile Computing Prototype
In order to run this on mobile devices, you need to run it using TLS. Otherwise, `AudioContext` will not work.
One way of doing this is to use `live-server-https`. In order to set this up, follow these steps:
1. If you don't have `live-server` installed, run `npm install -g live-server`.
2. In the `mc-prototype` folder, run `npm install --save live-server-https`.
3. Run the server using `live-server --https=./node_modules/live-server-https`. This should launch a tab with the webpage on your default browser. If it complains about certificate that means it is working fine. Just continue to the page.
4. You can now also access the page and use all of its functionalities from a mobile device.

As of right now, the prototype can only do the following:
* Play a series of specified frequencies for a specified duration
* Record the currently loudest frequency (kinda)