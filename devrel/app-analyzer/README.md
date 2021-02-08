# Application Analyzer

Decompiles approval program for given application identifier. 

## Requirements

- nodeJS
- algosdk
- `algod` APIs
- `goal` installed and accessible in `$PATH`. 

## Usage

- modify **appid-to-teal.js**
  - `algod` API provider settings (default: Sandbox)
    - `algodToken` 
    - `algodServer`
    - `algodPort`
  - `appId` provide the application identifier
- `$ node appid-to-teal.js`
- Inspect output files
  - **appid.teal.tok** compiled binary from base64 approval program
  - **appid.teal.pack** decompiled approval program with packed values
  - **appid.teal** derived source code of approval program

## Testing

- compile source TEAL with `goal` and compare to Approval hash
  - `$ goal clerk compile appid.teal`
  - `$ goal app info --app-id $APP_ID`

## TODO:

- Add: global state values
- Add: source for Clear program
- Add: compare schema allocation to global/local utilization
- Add: list of accounts opted in to application
- Add: visual program analyser
