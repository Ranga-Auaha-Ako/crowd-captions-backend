require('dotenv').config();
module.exports = {
    development: {
        database: process.env.POSTGRES_DB,
        username: "crowdcaptions",
        password: "crowdcaptions",
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        dialect: 'postgres',
        panopto_username: process.env.panopto_username,
        panopto_password: process.env.panopto_password,
        panopto_clientId: process.env.panopto_clientId,
        panopto_clientSecret: process.env.panopto_clientSecret
    },
    production: {
        database: {
            rest: {
                database: process.env.POSTGRES_DB,
                username: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASS,
                host: process.env.POSTGRES_HOST,
                port: process.env.POSTGRES_PORT,
                dialect: 'postgres'
            },
        },
    },
};