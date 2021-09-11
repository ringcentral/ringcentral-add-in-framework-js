import React, { useState, useEffect } from 'react';
import {
  RcThemeProvider,
  RcLoading,
  RcAlert,
  RcButton,
  RcText,
} from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  justify-content: center;
  align-items: center;
`;

export function App({ integrationHelper, client }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [authorized, setAuthorized] = useState(client.authorized);
  const [userInfo, setUserInfo] = useState({});

  // Listen authorized state to load webhook data:
  useEffect(() => {
    // Listen RingCentral app submit event to submit data to server
    integrationHelper.on('submit', async (e) => {
        return {
          status: true,
        }
    });
    if (!authorized) {
      setUserInfo({});
      return;
    }
    async function getInfo() {
      setLoading(true);
      try {
        const userInfo = await client.getUserInfo();
        if (userInfo) {
          setUserInfo(userInfo);
        }
      } catch (e) {
        console.error(e);
        if (e.message === 'Unauthorized') {
          setError('Authorization required.');
          setAuthorized(false);
        } else {
          setError('Fetch data error please retry later');
        }
      }
      setLoading(false);
    }
    getInfo();
  }, [authorized]);

  return (
    <RcThemeProvider>
      <RcLoading loading={loading}>
        {
          (error && error.length > 0) ? (
            <RcAlert severity="warning" onClose={() => setError('')}>
              {error}
            </RcAlert>
          ) : null
        }
        <Container>
          {
            (!authorized) ? (
              <div>
                <RcButton onClick={() => {
                  setLoading(true);
                  integrationHelper.openWindow(client.authPageUri);
                  async function onAuthCallback(e) {
                    if (e.data && e.data.authCallback) {
                      window.removeEventListener('message', onAuthCallback);
                      if (e.data.authCallback.indexOf('error') > -1) {
                        setError('Authorization error')
                        setLoading(false);
                        return;
                      }
                      try {
                        // Authorize
                        await client.authorize(e.data.authCallback);
                        setAuthorized(true);
                      } catch (e) {
                        console.error(e);
                        setError('Authorization error please retry later.')
                      }
                      setLoading(false);
                    }
                  }
                  window.addEventListener('message', onAuthCallback);
                  setTimeout(() => {
                    setLoading(false);
                  }, 2000);
                }}>
                  Connect to 3rd Party Service
                </RcButton>
              </div>
            ) : (
              <div>
                <RcText >Hello {userInfo.id}</RcText>
                <br/>
                <RcButton onClick={async () => {
                  setLoading(true);
                  try {
                    // Subscribe
                    await client.subscribe();
                    integrationHelper.send({ canSubmit: true });  // enable 'Finish' button on Add-In setup shell
                    setLoading(false);
                  } catch (e) {
                    console.error(e);
                    setLoading(false);
                    setError('Subscription error please retry later.');
                  }
                }}>
                  Subscribe
                </RcButton>
                <br/>
                <br/>
                <RcButton onClick={async () => {
                  setLoading(true);
                  try {
                    // Logout and Unsubcribe
                    await client.logout();
                    setLoading(false);
                    setAuthorized(false);
                  } catch (e) {
                    console.error(e);
                    setLoading(false);
                    setError('Logout error please retry later.');
                  }
                }}>
                  Unsubscribe and Logout
                </RcButton>
              </div>)
          }
        </Container>
      </RcLoading>
    </RcThemeProvider>
  );
}
