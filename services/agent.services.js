const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const client = new BedrockAgentRuntimeClient({
    
});

const invokeAgent = async (agentId, agentAliasId, sessionId, prompt) => {
    try {
        const command = new InvokeAgentCommand({
            agentId,
            agentAliasId,
            enableTrace: false,
            sessionId,
            inputText: prompt
        });

        const response = await client.send(command);
        let outputText = '';

        const messageStream = response.completion.options.messageStream;
        if (messageStream) {
            // Combinar todos los chunks en un solo string
            outputText = await streamToString(messageStream.options.inputStream);
        }

        // Procesar outputText
        const jsonPart = outputText.match(/{.*}/s); // Busca el primer JSON en el string
        if (jsonPart) {
            const jsonData = JSON.parse(jsonPart[0]); // Convertir a objeto JSON
            // Extraer la respuesta del bot
            const outputText = jsonData.attribution.citations[0].generatedResponsePart.textResponsePart.text;
            return { outputText };
        } else {
            throw new Error('No se encontró JSON en el outputText');
        }
    } catch (error) {
        console.error('Error invoking agent:', error);
        throw error;
    }
};

// Función para convertir el stream en un string completo
const streamToString = async (inputStream) => {
    let completeText = '';
    for await (const chunk of inputStream) {
        const decodedChunk = Buffer.from(chunk, 'base64').toString();
        completeText += decodedChunk; // Agregar cada chunk al texto completo
    }
    return completeText;
};

module.exports = {
    invokeAgent
};
