const AdminBro = require('admin-bro')
const AdminBroExpress = require('@admin-bro/express')
const AdminBroSequelize = require('@admin-bro/sequelize')


const express = require('express')
const app = express()
const db = require("../models");

AdminBro.registerAdapter(AdminBroSequelize)
const adminBro = new AdminBro({
  databases: [db],
  rootPath: '/admin',
})

const router = AdminBroExpress.buildRouter(adminBro)

module.exports = router