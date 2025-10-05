# AI Prompts Used

This document contains all the prompts I used with Claude Code to build Voice Pal.

## Initial Setup & Requirements

**Prompt 1:**
```
i just closed a terminal that used claude code, is there a way to get the prompts i sent/chat history?
```
*Response: Learned that chat history isn't saved between sessions*

**Prompt 2:**
```
ok so in cfai, complete an assignment to build a type of AI-powered application on Cloudflare.
An AI-powered application should include the following components:
LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
User input via chat or voice (recommend using Pages or Realtime)
Memory or state
Find additional documentation here. i believe that i am missing the 2nd and 4th requirements
currently. i think a solution is to add durable objects, is that the case? if so, please
implement it for me. context, this is a chatbot llm that uses voice
```
*Response: Confirmed I already had Durable Objects and memory/state implemented*

## Bug Fixes & Testing

**Prompt 3:**
```
yes but does it work? please check. also what does durable objects do exactly. how does it
check the 2nd and 4th requirements
```
*Response: Tested the application and explained Durable Objects functionality*

**Prompt 4:**
```
couple things. so during testing, when i said something, the ai prompt sent back an empty
text box, and when i reloaded the page, all i can see is the prompt i sent, and none of
the ai responses. fix these 2 issues
```
*Response: Started debugging streaming response issues*

**Prompt 5:**
```
X [ERROR] Error processing chat request: TypeError: response.pipeTo is not a function
when i send a prompt, it says this
```
*Response: Fixed pipeTo error by correcting stream handling*

**Prompt 6:**
```
please fix this. earlier, this was working just fine before the changes you made for
sessions management. why. please think about the fix, and then fix it
```
*Response: Reverted to original working approach with returnRawResponse*

**Prompt 7:**
```
again, i reloaded the page, and it does not save anything. why is this difficult. if it
saves all of my prompts, why doesn't it show the entire conversation with the ai responses?
```
*Response: Started debugging why assistant messages weren't being saved*

**Prompt 8:**
```
[Shows error logs]
when i send a prompt, it says this
```
*Response: Added logging to debug stream parsing*

**Prompt 9:**
```
[Shows chunk parsing logs]
```
*Response: Fixed JSON parsing by accumulating chunks into a buffer instead of parsing line-by-line*

## Features & Understanding

**Prompt 10:**
```
ok it saves when i reload. quick question, how does this work exactly. i went into an
incognito browser, and don't see the chat history, as expected.
```
*Response: Explained session persistence with localStorage and Durable Objects*

**Prompt 11:**
```
add a clear conversation button that replaces the send button
```
*Response: Added red Clear button next to (not replacing) Send button with DELETE endpoint*

## Documentation & Verification

**Prompt 12:**
```
ok can you open links in claudecode? or view website links?
```
*Response: Explained WebFetch capability*

**Prompt 13:**
```
ok back to the requirements: [lists requirements]
and the doc link is this https://developers.cloudflare.com/agents/, please read the doc
link, and check if my app has the components
```
*Response: Verified all 4 requirements are met using WebFetch to read the docs*

**Prompt 14:**
```
so this is github clone that i cloned onto my local pc. how do i upload the changes i
made to github? https://github.com/albert97567/cfai
```
*Response: Guided through git add, commit, and push process*

**Prompt 15:**
```
ok going into the read me can you make sure that it is all right and completely captures
the project? also, write parts of it in my own voice
```
*Response: Rewrote README in casual, personal voice with complete documentation*

## Final Submission

**Prompt 16:**
```
To be considered, your repository name must be prefixed with cf_ai_, must include a
README.md file with project documentation and clear running instructions to try out
components (either locally or via deployed link). AI-assisted coding is encouraged, but
you must include AI prompts used in PROMPTS.md
```
*Response: Created this PROMPTS.md file*

---

## Summary

All coding was done with Claude Code AI assistant. The process involved:

1. **Initial Implementation**: Setting up Durable Objects for state management
2. **Debugging**: Fixing streaming response issues and message persistence
3. **Feature Additions**: Adding clear conversation functionality
4. **Documentation**: Creating comprehensive README and verifying requirements
5. **Git Management**: Committing and pushing to GitHub

The AI helped with:
- Understanding Durable Objects architecture
- Debugging stream parsing and message storage
- Writing clean, documented code
- Creating user-friendly documentation
- Git workflow guidance

Total development time: ~2-3 hours with AI assistance
