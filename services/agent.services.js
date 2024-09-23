const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const client = new BedrockAgentRuntimeClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID
    }
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
            try {
                const jsonData = JSON.parse(jsonPart[0]);
                const bytesContent = jsonData.bytes;
                const decodedContent = Buffer.from(bytesContent, 'base64').toString('utf-8'); // Decodificar contenido
                // Procesa el contenido decodificado aquí
                return { outputText: decodedContent }; // o extrae la información que necesites
            } catch (jsonError) {
                //console.error('Error parsing JSON:', jsonError);
                throw jsonError;
            }
        } else {
            throw new Error('No se encontró JSON en el outputText');
        }
    } catch (error) {
        //console.error('Error invoking agent:', error);
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
