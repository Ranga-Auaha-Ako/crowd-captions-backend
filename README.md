# COMPSCI 399 2021 (Semester two) Team 10

## Getting Started

### Getting authenticated

To allow this tool to authenticate with the Panopto API, you'll need to create an administrator user. We reccomend you make one specifically for this tool, which will help isolate anything the API does within Panopto.

Once you've made a user, you'll need a client ID and Secret. To do that, follow the instructions here: https://support.panopto.com/s/article/support-panopto-com-s-article-oauth2-client-setup. You want to create an API Key with the type "User Based Server Application".

Once you have the client ID and secret, create a `.env` file, and fill it with your credentials and the URL of your hosted Panopto server:

```
panopto_host=https://xxx.xxx.panopto.com
panopto_username=xxx
panopto_password=xxx
panopto_clientId=xxx
panopto_clientSecret=xxx
```

This should be enough to have things spin up and work in development, so let's move on to:

### Running the project

To start developing, grab your OS-specific version of [Docker](https://www.docker.com/get-started). Then:

1. Open up a terminal in the root directory of the project
2. Run `docker-compose up`

Everything should download and configure automatically. Confirm things are working by visiting http://localhost:8000/. If you see "received on port: 8000", you're good to go.


## Stack

- NodeJS with Express

# UPDATE LOG:

v0.1:
- restructure the files
- added npm packages: esm, pg, dotenv, sequlize
- added .env file for global variables
- added server.js for all backend codes
- added folder config
- added file config.js for database connection
- changed folder router to routes
- changed localhost port from 3000 to 4000

v0.2:
- added router draft in router.js

v0.3:
- Use Docker & Docker-Compose to manage development environments