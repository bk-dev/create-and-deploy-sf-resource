Provides a simple way of bundling and deploying a given directory to the specified Salesforce environment.


## Requirements

The first iteration of this application will only work on a MAC OS due to tight integration with the keychain service. The goal is to implement some form of OAuth2 authentication to provide cross-platform compatibility.


## Install

```
$ npm install ma-deploy-bundle -g
```

## Usage

```
$ ma-deploy-bundle -d ./path/to/bundleDir
```

A JSON file will be created in the root directory after a series of prompts. This will NOT be deleted automatically after deployment. The JSON contains information to deploy a bundle to the same Salesforce environment without repeated prompts.