# Cinnamon Bun

<p>
    <a href="https://github.com/charmbracelet/bubbletea"><img src="https://img.shields.io/badge/original-bubbletea-blue" alt="Original Bubble Tea"></a>
    <a href="https://github.com/yum-tty/cinnamon-bun"><img src="https://img.shields.io/badge/port-cinnamon--bun-green" alt="Cinnamon Bun Port"></a>
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/runtime-bun-black" alt="Bun Runtime"></a>
</p>

The fun, functional and stateful way to build terminal apps. A TypeScript port of [Bubble Tea](https://github.com/charmbracelet/bubbletea) for Bun.

Cinnamon Bun is based on [The Elm Architecture](https://guide.elm-lang.org/architecture/), which happens to work nicely with TypeScript. It's a delightful way to build terminal applications.

## Installation

```bash
bun add github:yum-tty/cinnamon-bun
```

Or install from a specific package:

```bash
bun add cinnamon-bun
```

## Quick Start

```typescript
import { NewProgram, Quit, type Model, type Msg, type Cmd } from "cinnamon-bun"

// Define your model
interface CounterModel {
  count: number
}

// Initialize the model
function init(): [Model, Cmd] {
  return [{ count: 0 }, null]
}

// Handle messages
function update(model: CounterModel, msg: Msg): [Model, Cmd] {
  if (msg?.type === "key") {
    switch (msg.name) {
      case "up":
        return [{ ...model, count: model.count + 1 }, null]
      case "down":
        return [{ ...model, count: model.count - 1 }, null]
      case "q":
        return [model, Quit()]
    }
  }
  return [model, null]
}

// Render the UI
function view(model: CounterModel): string {
  return `
Count: ${model.count}

Press up to increment, down to decrement, q to quit.
`
}

// Run the program
NewProgram({ model: { init, update, view } }).run()
```

## Architecture

Cinnamon Bun follows [The Elm Architecture](https://guide.elm-lang.org/architecture/):

1. **Model** - Your application state
2. **Init** - Returns the initial model and an optional command
3. **Update** - Handles messages and returns an updated model
4. **View** - Renders the UI based on the model

### The Model

The model is any type that holds your application state:

```typescript
interface MyModel {
  items: string[]
  cursor: number
  selected: Set<number>
}
```

### Commands

Commands are IO operations that return messages when complete:

```typescript
import { Batch, Sequence, Every, Tick } from "cinnamon-bun"

// Run multiple commands concurrently
const cmd = Batch(fetchData(), loadConfig())

// Run commands in sequence
const cmd = Sequence(saveFile(), sendNotification())

// Run a command every second
const cmd = Every(1000, (time) => ({ type: "tick", time }))

// Run a command after a delay
const cmd = Tick(500, () => ({ type: "delayed", data: null }))
```

### Messages

Messages are events that trigger updates:

```typescript
type Msg =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "set"; value: number }
  | { type: "quit" }
```

## Options

```typescript
import { NewProgram, WithAltScreen, WithFPS, WithMouseCellMotion } from "cinnamon-bun"

NewProgram(
  { model: { init, update, view } },
  WithAltScreen(),           // Use alternate screen buffer
  WithFPS(60),              // Set max FPS
  WithMouseCellMotion(),    // Enable mouse events
).run()
```

## Components

Cinnamon Bun works with [Cinnamon](https://github.com/cinnamon-eco/cinnamon) components:

```typescript
import { TextInput, Focus } from "cinnamon"
import { NewProgram, type Model, type Msg, type Cmd } from "cinnamon-bun"

const input = TextInput()

function init(): [Model, Cmd] {
  const [focused, cmd] = Focus(input)
  return [{ input: focused }, cmd]
}

function update(model: any, msg: Msg): [any, Cmd] {
  // Forward messages to components
  const [newInput, cmd] = TextInputUpdate(model.input, msg)
  return [{ ...model, input: newInput }, cmd]
}

function view(model: any): string {
  return TextInputView(model.input)
}

NewProgram({ model: { init, update, view } }).run()
```

## Styling

Use [Caramel](https://github.com/cinnamon-eco/caramel) for styling:

```typescript
import { NewStyle } from "caramel"

const style = NewStyle()
  .bold(true)
  .foreground("#7f00ff")
  .padding(1, 2)

function view(model: any): string {
  return style.render(`Count: ${model.count}`)
}
```

## Debugging

### Logging

You can't log to stdout with Cinnamon Bun because your TUI is busy occupying that. Log to a file instead:

```typescript
import { appendFileSync } from "fs"

if (process.env.DEBUG) {
  appendFileSync("debug.log", `${new Date().toISOString()} ${message}\n`)
}
```

### Terminal Reset

If your program crashes, the terminal may be in a bad state. Run:

```bash
reset
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [counter](./examples/counter.ts) - Simple counter app
- [shopping](./examples/shopping.ts) - Shopping list with selection

## Ecosystem

| Package | Description |
|---------|-------------|
| [Caramel](https://github.com/cinnamon-eco/caramel) | Style definitions (Lip Gloss port) |
| [Cinnamon](https://github.com/cinnamon-eco/cinnamon) | UI components (Bubbles port) |
| [Cinnamon Log](https://github.com/cinnamon-eco/log) | Logging (Log port) |
| [Cinnamon Prompts](https://github.com/cinnamon-eco/prompts) | Interactive prompts (Huh port) |
| [Cinnamon Marshmallow](https://github.com/cinnamon-eco/marshmallow) | Markdown rendering (Glamour port) |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## License

[MIT](./LICENSE)

---

Based on [Bubble Tea](https://github.com/charmbracelet/bubbletea) by [Charm](https://charm.sh).
