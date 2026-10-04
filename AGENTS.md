# Esmeralda Secrets — Project Instructions

You are the primary autonomous developer for this project.

Your job is to take the existing Esmeralda Secrets repository and turn it into a complete, functional web application.

## Main objective

Finish the Esmeralda project from the existing codebase.

Do not merely explain what needs to be done. Inspect the repository, implement the required changes, test them, fix errors, and leave the project in a working state.

## Existing infrastructure

The project currently contains a web/PWA frontend and a Cloudflare Worker backend.

Existing Cloudflare Worker endpoint:

https://nameless-block-036e.workers.dev/

The project may also use OpenRouter for AI functionality.

Before changing anything, inspect all existing files and understand the current architecture.

## Important rules

1. Do not delete working functionality without a good reason.
2. Do not replace the entire project with an unrelated application.
3. Preserve the existing Esmeralda identity and project name.
4. Prefer simple, reliable web technologies.
5. Make the application usable on Android phones and tablets.
6. Do not require a desktop computer for normal use.
7. Do not expose API keys or secrets in frontend code.
8. Backend/API secrets must remain server-side.
9. Fix existing errors before adding unnecessary complexity.
10. Test every important feature after implementation.
11. If something is broken, diagnose and repair it instead of simply describing the problem.
12. Continue working through the task until the application is functional.

## Esmeralda concept

Esmeralda is intended to be a personal AI assistant with a distinctive identity.

She should eventually provide:

- conversational AI;
- research assistance;
- public-source investigation capabilities;
- organized presentation of findings;
- a distinctive Esmeralda personality;
- a polished mobile-first interface;
- the ability to evolve into a larger AI research product.

The application should feel like one coherent product, not a collection of unrelated demos.

## Current development priority

First make the core application reliable.

The final working flow should be:

User opens Esmeralda
→ enters a message
→ Esmeralda sends the request to the backend
→ backend communicates with the configured AI provider
→ response returns safely to the frontend
→ Esmeralda displays the response clearly.

Then progressively implement the research/investigation functionality.

## UI requirements

Create a modern, elegant interface suitable for Esmeralda.

Requirements:

- mobile-first;
- responsive on Android phones and tablets;
- fast loading;
- clear chat interface;
- readable messages;
- obvious input field;
- send button;
- loading state;
- error state;
- polished visual identity;
- preserve the Esmeralda name.

Do not introduce unnecessary frameworks if the existing project can accomplish the task with simple HTML, CSS and JavaScript.

## Backend requirements

Inspect the existing Cloudflare Worker implementation.

Ensure:

- correct Cloudflare Worker syntax;
- correct fetch handler;
- correct CORS handling;
- correct OPTIONS handling;
- safe API-key handling;
- useful error messages;
- valid JSON responses;
- no secrets exposed to the browser.

If the existing Worker is incomplete or incorrect, repair it.

## AI provider

Inspect the existing implementation to determine whether OpenRouter or another provider is already configured.

Do not invent or expose API keys.

Use environment variables/secrets where appropriate.

If a required secret is missing, clearly document which secret needs to be configured rather than putting a fake key into the repository.

## Research capabilities

After the core chat works, prepare the architecture for public-source research.

The research system should be designed to support:

- web research;
- source collection;
- source comparison;
- fact extraction;
- structured notes;
- confidence indicators;
- links to public sources;
- distinction between verified facts and unverified claims.

Do not fabricate evidence.

Do not present speculation as fact.

Only use lawful public information.

## Quality control

Before considering the project finished:

1. Inspect the complete repository.
2. Check every relevant source file.
3. Check for JavaScript syntax errors.
4. Check frontend/backend communication.
5. Check CORS.
6. Check mobile layout.
7. Check error handling.
8. Check that no secret/API key is committed.
9. Test the main user flow.
10. Fix problems discovered during testing.
11. Leave clear documentation for anything that cannot be completed automatically.

## Working method

Work autonomously.

Do not stop after identifying problems.

For each problem:

Analyze
→ implement a fix
→ test
→ inspect the result
→ fix remaining errors
→ continue.

Do not ask the user to manually write code unless absolutely necessary.

When possible, make the changes directly in the repository.

## Definition of done

The project should not be considered finished merely because the code looks correct.

It is finished when:

- the application loads;
- the UI works on Android;
- the user can send a message;
- the backend receives it;
- the AI response returns;
- the response is displayed;
- errors are handled;
- secrets are protected;
- the project has a clear path toward the research/investigation features.

At the end, provide a concise summary of:

- what was implemented;
- what was fixed;
- what was tested;
- what remains;
- any configuration the user must still perform.

Do not claim something works unless it was actually tested.
