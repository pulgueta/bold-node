# Bold Node.js SDK

Implement Bold seamlessly in your application.

## Prerequisites

- Node.js (v22 or higher recommended)
- pnpm (v10.28.2 or higher)

## Installation

### Clone the repository

```bash
git clone https://github.com/pulgueta/bold-node
cd bold-node
```

### Install dependencies

```bash
pnpm install
```

## Usage

> **Note:** This SDK is currently in early development. More features will be added soon.

After installing dependencies, you can build the project:

```bash
pnpm build
```

## Development

### Building

To build the project:

```bash
pnpm build
```

This will compile TypeScript files using `tsup` and output the built files to the `dist` directory.

## Project Structure

```
bold-node/
├── src/
│   └── index.ts      # Main entry point
├── dist/             # Build output (generated)
├── package.json
├── tsconfig.json
└── tsup.config.ts    # Build configuration file
```

## License

MIT © Andrés Rodríguez
