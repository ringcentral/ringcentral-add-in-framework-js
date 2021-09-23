import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { RingCentralNotificationIntegrationHelper } from 'ringcentral-notification-integration-helper'

import { App } from './components/Root';
import { Client } from './lib/client';

const integrationHelper = new RingCentralNotificationIntegrationHelper()
const client = new Client(window.clientConfig);
window.client = client;

ReactDOM.render(
  <App integrationHelper={integrationHelper} client={client} />,
  document.querySelector('div#viewport'),
);
