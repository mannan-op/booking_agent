# Booking Agent

A Next.js admin dashboard for managing bookings, inventory, orders, analytics, and settings — a lightweight internal admin UI for teams running small booking or inventory workflows.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## Table of Contents
- [Acknowledgements](#acknowledgements)
- [API Reference](#api-reference)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Run Locally](#run-locally)
- [Environment Variables](#environment-variables)
- [Demo](#demo)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Acknowledgements

 - [Awesome Readme Templates](https://awesomeopensource.com/project/elangosundar/awesome-README-templates)
 - [Awesome README](https://github.com/matiassingers/awesome-readme)
 - [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)

## API Reference

#### Get all items

```http
	GET /api/items
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `api_key` | `string` | **Required**. Your API key |

#### Get item

```http
	GET /api/items/${id}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `id`      | `string` | **Required**. Id of item to fetch |

#### add(num1, num2)

Takes two numbers and returns the sum.

## Badges

Add badges from somewhere like: [shields.io](https://shields.io/)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![AGPL License](https://img.shields.io/badge/license-AGPL-blue.svg)](http://www.gnu.org/licenses/agpl-3.0)

## Appendix

Any additional information goes here.

## Demo

Insert gif or link to demo.

## Documentation

[Documentation](https://linktodocumentation)

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file or your environment:

```
API_KEY=
ANOTHER_API_KEY=
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/battery-query
```

## Live Chat Integration

The authenticated `/chat` page sends customer messages to `/api/chat`, which forwards them server-side to the n8n webhook. Set `N8N_WEBHOOK_URL` in `.env.local` to the n8n test URL while developing, or the production URL after Workflow 1 is activated.

When n8n runs in Docker and the mock middleware runs on Windows, configure n8n HTTP Request nodes with `http://host.docker.internal:8000`. Start the mock middleware from `workflows/mock-middleware-api` and verify `http://localhost:8000/v1/health` before testing the chat.

## Features

- Light/dark mode toggle
- Live previews
- Fullscreen mode
- Cross platform

## Tech Stack

- Next.js
- React 19
- Tailwind CSS
- shadcn UI primitives
- Recharts for charts
- pnpm as package manager

## Installation

Install dependencies (recommended with pnpm):

```bash
pnpm install
```

## Run Locally

Clone the project

```bash
git clone https://github.com/Huzaifa-Yaseen/VoltOps-Battery_Automation.git
cd booking_agent
```

Install dependencies

```bash
pnpm install
```

Start the dev server

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

## Usage / Examples

- Login at `/login` then navigate to the dashboard sections: analytics, inventory, orders, queries, review, settings.
- Reusable UI primitives live in `src/components/ui/`.

## Contributing

- Fork the repo → create a feature branch → open a PR. Include a short description and screenshots when relevant.
- Run `pnpm install` and `pnpm dev` locally. Follow existing style and run linter.

## License

No license file found in the repository. Add a `LICENSE` (for example MIT) if you want to make reuse permissions explicit.

## Authors & Acknowledgements

- Author: not set in `package.json` — consider adding an `author` field.
- Thanks to Next.js, Tailwind CSS, shadcn, Recharts, and other OSS projects used.

---

Generated from project template and repository metadata.
