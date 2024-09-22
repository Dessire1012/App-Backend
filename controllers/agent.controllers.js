const { invokeAgent } = require('../services/agent.services');

const handleAgentInvocation = async (req, res) => {
    const { agentId, agentAliasId, sessionId, prompt } = req.body;

    try {
        const result = await invokeAgent(agentId, agentAliasId, sessionId, prompt);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to invoke agent', details: error.message });
    }
};

module.exports = {
    handleAgentInvocation
};
