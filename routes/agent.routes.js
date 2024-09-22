const express = require('express');
const { handleAgentInvocation } = require('../controllers/agent.controllers');
const router = express.Router();

router.post('/invoke-agent', handleAgentInvocation);

module.exports = router;