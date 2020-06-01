# Webapp

Read the README.md in `packages/webapp` for more info.

You can start the app from the root folder by running:

- `node webapp.js` (hopefully also runs on windows) - this starts the app in non-HTTPS and installs packages if `node_modules` folder is missing. 
    - Optional parameters:
        - `--install` (force `npm install` before running).
        - `--https` (runs the app in https mode)

Don't forget to `cd` into that directory first when running other commands.