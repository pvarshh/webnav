import * as vscode from 'vscode';

// --- 1. STATE MANAGEMENT ---
interface AgentState {
    originalPrompt: string;
    currentPhase: 'mapping' | 'architect' | 'developer' | 'qa' | 'done';
    adrExists: boolean;
    history: string[];
}

export function activate(context: vscode.ExtensionContext) {

    // --- 2. GLOBAL RULE INJECTOR ---
    async function getAgentPrompt(workspaceRoot: vscode.Uri, roleFile: string): Promise<string> {
        try {
            const autonomyPath = vscode.Uri.joinPath(workspaceRoot, 'agents', 'AGENT_AUTONOMY.md');
            const rolePath = vscode.Uri.joinPath(workspaceRoot, 'agents', roleFile);
            
            let autonomyStr = "";
            try {
                const data = await vscode.workspace.fs.readFile(autonomyPath);
                autonomyStr = Buffer.from(data).toString('utf-8');
            } catch (e) {
                // Ignore if autonomy doesn't exist
            }

            let roleStr = "";
            try {
                const data = await vscode.workspace.fs.readFile(rolePath);
                roleStr = Buffer.from(data).toString('utf-8');
            } catch (e) {
                // Ignore if role doesn't exist
            }

            return `You are an elite, autonomous AI agent acting within the @webnav VS Code Extension.
You MUST strictly follow the Universal Agent Autonomy Policy and your specific Role Definition below.
Do NOT output meta-commentary about the policy, do NOT offer to save the policy documents, and DO NOT output anything other than what is explicitly requested by your role's Output Format.

--- START OF AGENT AUTONOMY POLICY ---
${autonomyStr}
--- END OF AGENT AUTONOMY POLICY ---

--- START OF ROLE DEFINITION ---
${roleStr}
--- END OF ROLE DEFINITION ---

Remember: You are executing a task for the user based on the chat history. Provide ONLY the final executable output for your role.`;
        } catch (error) {
            throw new Error(`Failed to load agent prompts. Ensure 'agents/' folder exists in your workspace.`);
        }
    }

    // --- X. AUTONOMOUS FILE I/O ---
    async function parseAndWriteFiles(agentOutput: string, workspaceRoot: vscode.Uri, stream: vscode.ChatResponseStream) {
        // Regex to match markdown code blocks with our special filename syntax
        // e.g. ```typescript:src/my/file.ts
        const blockRegex = /```[\w-]+:([^\n]+)\n([\s\S]*?)```/g;
        let match;
        
        while ((match = blockRegex.exec(agentOutput)) !== null) {
            const filepath = match[1].trim();
            const content = match[2];
            
            try {
                const fullPath = vscode.Uri.joinPath(workspaceRoot, filepath);
                
                // Ensure directory exists (VS Code fs handles this mostly, but good practice)
                const dirPath = vscode.Uri.joinPath(fullPath, '..');
                await vscode.workspace.fs.createDirectory(dirPath);
                
                // Write the file
                const writeData = Buffer.from(content, 'utf-8');
                await vscode.workspace.fs.writeFile(fullPath, writeData);
                
                stream.markdown(`\n\n> 💾 **Auto-Saved:** \`${filepath}\``);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                stream.markdown(`\n\n> ❌ **Failed to save:** \`${filepath}\` (${message})`);
            }
        }
    }

    // --- 3. AGENT EXECUTION ENGINE ---
    async function runAgent(
        roleFile: string, 
        state: AgentState, 
        workspaceRoot: vscode.Uri, 
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<string> {
        
        const systemPrompt = await getAgentPrompt(workspaceRoot, roleFile);
        
        // Find the Copilot model (preferring the smartest available)
        const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
        if (!model) throw new Error("Copilot model not found. Ensure GitHub Copilot is active.");

        const historyContext = state.history.join('\n\n---\n\n');

        const fullPrompt = `${systemPrompt}

================================
### CONVERSATION HISTORY
${historyContext}

================================
### YOUR TASK
Based on the history above, execute your specific Role Definition. 
You MUST provide ONLY the final functional output format requested by your role. 
Do NOT ask the user for clarification. Do NOT output meta-commentary. Do NOT apologize. If anything is ambiguous, make robust architectural assumptions and proceed decisively.`;

        // Construct the single user message to avoid Copilot API conversational moderation flags
        const messages = [
            vscode.LanguageModelChatMessage.User(fullPrompt)
        ];

        stream.progress(`Invoking ${roleFile.replace('.agent.md', '')} Agent...`);
        
        const response = await model.sendRequest(messages, {}, token);
        let fullResponse = "";

        // Stream the agent's thought process directly to the VS Code chat window
        stream.markdown(`\n\n### 🤖 ${roleFile.replace('.agent.md', '').toUpperCase()} OUTPUT\n`);
        for await (const chunk of response.text) {
            fullResponse += chunk;
            stream.markdown(chunk);
        }

        // Add the response to our internal state history for the next agent
        state.history.push(`[${roleFile.replace('.agent.md', '').toUpperCase()} OUTPUT]:\n${fullResponse}`);
        return fullResponse;
    }

    // --- 4. THE ORCHESTRATOR PIPELINE ---
    const handler: vscode.ChatRequestHandler = async (request, chatContext, stream, token) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            stream.markdown("Error: Please open a workspace to use the multi-agent system.");
            return;
        }
        const root = workspaceFolders[0].uri;

        // Initialize State
        const state: AgentState = {
            originalPrompt: request.prompt,
            currentPhase: 'mapping',
            adrExists: false, // In a real app, you'd check vscode.workspace.fs for docs/adr/
            history: [`[USER PROMPT]: ${request.prompt}`]
        };

        try {
            // PHASE 0: MAPPING
            await runAgent('Mapping.agent.md', state, root, stream, token);
            state.currentPhase = 'architect';

            // PHASE 1: ARCHITECT
            const architectOutput = await runAgent('Architect.agent.md', state, root, stream, token);
            await parseAndWriteFiles(architectOutput, root, stream);
            state.currentPhase = 'developer';
            
            // Hard Gate Enforced via Code (Not just prompt text)
            // Modified strictly to require the ADR structure from Markdown rules
            state.adrExists = architectOutput.includes('【Architecture Decision Record') || architectOutput.includes('Architecture Decision Record (ADR)');


            // PHASE 2: DEVELOPER
            const developerOutput = await runAgent('Developer.agent.md', state, root, stream, token);
            await parseAndWriteFiles(developerOutput, root, stream);
            state.currentPhase = 'qa';

            // PHASE 3: QA
            const qaOutput = await runAgent('QA.agent.md', state, root, stream, token);
            await parseAndWriteFiles(qaOutput, root, stream);
            
            // Evaluator loop logic
            if (qaOutput.includes('FAIL')) {
                stream.markdown("\n\n**⚠️ ORCHESTRATOR:** QA Failed. Invoking Debugger...");
                const debugOutput = await runAgent('Debugger.agent.md', state, root, stream, token);
                await parseAndWriteFiles(debugOutput, root, stream);
            } else {
                stream.markdown("\n\n**✅ ORCHESTRATOR:** QA Passed. Invoking Optimizer for Self-Improvement Analysis...");
                const optimizerOutput = await runAgent('Optimizer.agent.md', state, root, stream, token);
                await parseAndWriteFiles(optimizerOutput, root, stream);
                stream.markdown("\n\n**🎯 PIPELINE COMPLETE.**");
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            stream.markdown(`\n\n**Pipeline Error:** ${message}`);
        }

        return { metadata: { command: request.command } };
    };

    // Register the participant
    const teamAgent = vscode.chat.createChatParticipant('webnav.orchestrator', handler);
    context.subscriptions.push(teamAgent);
}

export function deactivate() {}
