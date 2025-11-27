1.Code to get the use details:

from fyers_api import fyersModel
from fyers_api import accessToken
    session=accessToken.SessionModel(client_id="APP ID",
    secret_key="SECRET ID",redirect_uri="https://trade.fyers.in/", 
    response_type="code", grant_type="authorization_code",
    state="abcdefg",scope="",nonce="")
    response = session.generate_authcode()
    auth_code="auth_code" 

    session.set_token(auth_code)
    response = session.generate_token()
    access_token = response["access_token"]
    fyers = fyersModel.FyersModel(client_id="APP ID", 
    token=access_token,log_path="E:/python")
    profile=fyers.get_profile()
    print(profile["data"]["name"])

2.In order to connect to fyers API . We need 3 things.

-App ID - Provide in .env file
-Secret Key -  - Provide in .env file
-Auth_code - In order to get the authentication code we need to authorize our login to fyers. First we should create a URL to authorize our login.


-Copy and paste this URL in browser, you are redirected to a URL 

🆕 **API v3 update:** Fyers has deprecated the v1/v2 login endpoints (`https://api.fyers.in/api/v1/auth`).  
The AlgoNova backend now uses the official `fyers-apiv3` SDK, which serves login pages from  
`https://api-t1.fyers.in/api/v3/generate-authcode`. Make sure your firewall/browser allows this domain.

---

### ✅ Environment variable checklist

Add the following entries to your `.env` file so that the backend can discover the credentials automatically:

```
FYERS_CLINT_ID=<your app id, e.g. ABCD1234-100>
FYERS_SECRET_KEY=<secret key from Fyers dashboard>
FYERS_REDIRECT_URI=http://localhost:8000/api/fyers/callback
FYERS_SCOPE=
FYERS_STATE=algonova-fyers
FRONTEND_BASE_URL=http://localhost:9000
FRONTEND_LOGIN_URL=http://localhost:9000/login
FYERS_TOKEN_PATH=fyers_token.json
```

- `FYERS_CLINT_ID` mirrors the spelling used on the Fyers portal and is now also accepted by the service alongside `FYERS_APP_ID`/`FYERS_CLIENT_ID`.
- `FYERS_REDIRECT_URI` must match the redirect configured in the Fyers app console. For local development, keep it pointed to the FastAPI callback (`/api/fyers/callback`).
- `FYERS_SCOPE` can stay blank for standard trading permissions.
- `FRONTEND_BASE_URL` tells the backend which origin opened the popup so it can `postMessage` the access token back securely.
- `FYERS_TOKEN_PATH` is where the backend caches the Fyers access_token + profile (used for refreshing profile data later).

Once the values are saved, restart `uvicorn` so `python-dotenv` can reload the updated configuration. The login button on the frontend will now fetch `/api/fyers/login-url` successfully and redirect you to the official Fyers consent screen.